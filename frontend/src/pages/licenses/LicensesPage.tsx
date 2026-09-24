import { useState } from 'react';
import { Plus, Pencil, Trash2, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useLicenses, useDeleteLicense, useEmployees } from '../../hooks/useApi';
import { useAuthStore } from '../../store/authStore';
import { ConfirmDialog, EmptyState, PageLoader, StatusBadge, ColorDot } from '../../components/ui';
import SaldoWidget from '../../components/ui/SaldoWidget';
import LicenseFormModal from './LicenseFormModal';
import type { License } from '../../types';

export default function LicensesPage() {
  const { hasRole } = useAuthStore();
  const canEdit = hasRole(['admin', 'manager']);

  const now = new Date();
  const [anio, setAnio] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [empleadoId, setEmpleadoId] = useState('');
  const [estado, setEstado] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<License | null>(null);
  const [deleting, setDeleting] = useState<License | null>(null);

  const { data: employees = [] } = useEmployees(undefined, true);
  const { data: licenses = [], isLoading } = useLicenses({
    anio,
    mes: mes || undefined,
    empleado: empleadoId || undefined,
    estado: estado || undefined,
  });
  const deleteMutation = useDeleteLicense();

  const handleDelete = async () => {
    if (!deleting) return;
    await deleteMutation.mutateAsync(deleting._id);
    toast.success('Licencia eliminada');
    setDeleting(null);
  };

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);
  const months = [
    { v: 0, l: 'Todos los meses' },
    { v: 1, l: 'Enero' }, { v: 2, l: 'Febrero' }, { v: 3, l: 'Marzo' },
    { v: 4, l: 'Abril' }, { v: 5, l: 'Mayo' }, { v: 6, l: 'Junio' },
    { v: 7, l: 'Julio' }, { v: 8, l: 'Agosto' }, { v: 9, l: 'Septiembre' },
    { v: 10, l: 'Octubre' }, { v: 11, l: 'Noviembre' }, { v: 12, l: 'Diciembre' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Licencias</h1>
          <p className="text-sm text-gray-500 mt-0.5">{licenses.length} registros</p>
        </div>
        {canEdit && (
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Nueva licencia
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={15} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-600">Filtros</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <select className="input" value={anio} onChange={(e) => setAnio(+e.target.value)}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="input" value={mes} onChange={(e) => setMes(+e.target.value)}>
            {months.map(({ v, l }) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select className="input" value={empleadoId} onChange={(e) => setEmpleadoId(e.target.value)}>
            <option value="">Todos los empleados</option>
            {employees.map((e) => (
              <option key={e._id} value={e._id}>{e.apellido}, {e.nombre}</option>
            ))}
          </select>
          <select className="input" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="aprobada">Aprobada</option>
            <option value="pendiente">Pendiente</option>
            <option value="rechazada">Rechazada</option>
          </select>
        </div>
      </div>

      {/* Saldo — solo cuando hay un empleado filtrado */}
      {empleadoId && (() => {
        const emp = employees.find(e => e._id === empleadoId);
        return emp ? (
          <SaldoWidget
            empleadoId={empleadoId}
            anio={anio}
            fechaIngreso={emp.fechaIngreso}
          />
        ) : null;
      })()}

      {/* Table */}
      {isLoading ? <PageLoader /> : (
        <div className="card overflow-hidden">
          {!licenses.length ? (
            <EmptyState message="No se encontraron licencias con los filtros seleccionados" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Empleado</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Desde</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Hasta</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Días</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                    {canEdit && <th className="px-4 py-3" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {licenses.map((lic) => {
                    const emp = lic.empleado as any;
                    const tipo = lic.tipoLicencia as any;
                    return (
                      <tr key={lic._id} className="hover:bg-surface-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {emp?.apellido}, {emp?.nombre}
                          <span className="text-xs text-gray-400 ml-1">({emp?.legajo})</span>
                        </td>
                        <td className="px-4 py-3">
                          <ColorDot color={tipo?.color} label={tipo?.nombre} />
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {format(new Date(lic.fechaInicio), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {format(new Date(lic.fechaFin), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-700">{lic.cantidadDias}</td>
                        <td className="px-4 py-3"><StatusBadge status={lic.estado} /></td>
                        {canEdit && (
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 justify-end">
                              <button className="btn-ghost p-1.5" onClick={() => setEditing(lic)}>
                                <Pencil size={15} />
                              </button>
                              <button
                                className="btn-ghost p-1.5 hover:text-red-500"
                                onClick={() => setDeleting(lic)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <LicenseFormModal open={showCreate} onClose={() => setShowCreate(false)} />
      {editing && (
        <LicenseFormModal open={!!editing} onClose={() => setEditing(null)} editing={editing} />
      )}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Eliminar licencia"
        message="¿Eliminar esta licencia? Esta acción no se puede deshacer."
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

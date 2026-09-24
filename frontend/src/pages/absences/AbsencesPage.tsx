import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAbsences, useDeleteAbsence } from '../../hooks/useApi';
import { PageLoader, EmptyState, ConfirmDialog } from '../../components/ui';
import AbsenceFormModal from './AbsenceFormModal';
import type { Absence } from '../../types';

const now = new Date();

export default function AbsencesPage() {
  const [anio, setAnio] = useState(now.getFullYear());
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Absence | null>(null);
  const [deleting, setDeleting] = useState<Absence | null>(null);

  const { data: absences = [], isLoading } = useAbsences({ anio });
  const deleteMutation = useDeleteAbsence();

  const handleDelete = async () => {
    if (!deleting) return;
    await deleteMutation.mutateAsync(deleting._id);
    toast.success('Ausencia eliminada');
    setDeleting(null);
  };

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faltas e Inasistencias</h1>
          <p className="text-sm text-gray-500 mt-0.5">{absences.length} registros en {anio}</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="input w-28" value={anio} onChange={(e) => setAnio(+e.target.value)}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Nueva ausencia
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {!absences.length ? (
          <EmptyState message="No hay ausencias registradas para este año" />
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
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Observaciones</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {absences.map((abs) => {
                  const emp = abs.empleado as any;
                  return (
                    <tr key={abs._id} className="hover:bg-surface-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {emp?.apellido}, {emp?.nombre}
                        <span className="text-xs text-gray-400 ml-1">({emp?.legajo})</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${abs.tipo === 'falta' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                          {abs.tipo === 'falta' ? 'Falta' : 'Inasistencia'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {format(new Date(abs.fechaInicio), 'dd/MM/yyyy', { locale: es })}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {format(new Date(abs.fechaFin), 'dd/MM/yyyy', { locale: es })}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{abs.cantidadDias}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{abs.observaciones || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button className="btn-ghost p-1.5" onClick={() => setEditing(abs)}>
                            <Pencil size={15} />
                          </button>
                          <button className="btn-ghost p-1.5 hover:text-red-500" onClick={() => setDeleting(abs)}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AbsenceFormModal open={showCreate} onClose={() => setShowCreate(false)} />
      {editing && (
        <AbsenceFormModal open={!!editing} onClose={() => setEditing(null)} editing={editing} />
      )}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Eliminar ausencia"
        message={`¿Eliminar esta ausencia? Esto puede afectar el cálculo de presentismo.`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

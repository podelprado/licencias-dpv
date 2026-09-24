import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Pencil, Trash2, Upload, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from '../../hooks/useApi';
import { useAuthStore } from '../../store/authStore';
import { Modal, ConfirmDialog, EmptyState, PageLoader } from '../../components/ui';
import EmployeeForm from '../../components/forms/EmployeeForm';
import EmployeeImportModal from './EmployeeImportModal';
import type { Employee } from '../../types';
import { format } from 'date-fns';

export default function EmployeesPage() {
  const navigate = useNavigate();
  const { hasRole } = useAuthStore();
  const canEdit = hasRole(['admin', 'manager']);

  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState<Employee | null>(null);
  const [showImport, setShowImport] = useState(false);

  const { data: employees, isLoading } = useEmployees(search || undefined);
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();
  const deleteMutation = useDeleteEmployee();

  const handleCreate = async (data: any) => {
    await createMutation.mutateAsync(data);
    toast.success('Empleado creado');
    setShowCreate(false);
  };

  const handleUpdate = async (data: any) => {
    if (!editing) return;
    await updateMutation.mutateAsync({ id: editing._id, data });
    toast.success('Empleado actualizado');
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await deleteMutation.mutateAsync(deleting._id);
    toast.success('Empleado eliminado');
    setDeleting(null);
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Empleados</h1>
          <p className="text-sm text-gray-500 mt-0.5">{employees?.length ?? 0} registros</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => navigate('/employees/imports')}>
              <History size={16} /> Historial importaciones
            </button>
            <button className="btn-secondary" onClick={() => setShowImport(true)}>
              <Upload size={16} /> Importar Excel
            </button>
            <button className="btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Nuevo empleado
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Buscar por nombre, apellido, legajo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {!employees?.length ? (
          <EmptyState message="No se encontraron empleados" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Legajo</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Apellido y Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Cargo</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Sector</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Ingreso</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-primary-700">{emp.legajo}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {emp.apellido}, {emp.nombre}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{emp.cargo || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.sector || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {emp.fechaIngreso ? format(new Date(emp.fechaIngreso), 'dd/MM/yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${emp.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {emp.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          className="btn-ghost p-1.5"
                          onClick={() => navigate(`/employees/${emp._id}`)}
                          title="Ver licencias"
                        >
                          <Eye size={15} />
                        </button>
                        {canEdit && (
                          <>
                            <button className="btn-ghost p-1.5" onClick={() => setEditing(emp)} title="Editar">
                              <Pencil size={15} />
                            </button>
                            <button
                              className="btn-ghost p-1.5 hover:text-red-500"
                              onClick={() => setDeleting(emp)}
                              title="Eliminar"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo empleado" size="lg">
        <EmployeeForm
          onSubmit={handleCreate}
          loading={createMutation.isPending}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar empleado" size="lg">
        {editing && (
          <EmployeeForm
            defaultValues={editing}
            onSubmit={handleUpdate}
            loading={updateMutation.isPending}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Eliminar empleado"
        message={`¿Eliminar a ${deleting?.apellido}, ${deleting?.nombre}? Se eliminarán también sus licencias.`}
        loading={deleteMutation.isPending}
      />

      <EmployeeImportModal open={showImport} onClose={() => setShowImport(false)} />
    </div>
  );
}

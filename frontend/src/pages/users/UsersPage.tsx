import { useState } from 'react';
import { Plus, Pencil, Trash2, Shield } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../../hooks/useApi';
import { useAuthStore } from '../../store/authStore';
import { Modal, ConfirmDialog, EmptyState, PageLoader, FormField, Spinner } from '../../components/ui';
import type { User } from '../../types';

const roleLabels: Record<string, { label: string; color: string }> = {
  admin: { label: 'Administrador', color: 'bg-red-100 text-red-700' },
  manager: { label: 'Gestor', color: 'bg-blue-100 text-blue-700' },
  viewer: { label: 'Visualizador', color: 'bg-gray-100 text-gray-600' },
};

function UserForm({
  defaultValues, onSubmit, loading, onCancel, isEdit,
}: {
  defaultValues?: Partial<User & { password?: string }>;
  onSubmit: (d: any) => void;
  loading?: boolean;
  onCancel: () => void;
  isEdit?: boolean;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Usuario" required error={errors.username?.message as string}>
          <input {...register('username', { required: 'Requerido' })} className="input" autoComplete="off" />
        </FormField>
        <FormField label={isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña'} required={!isEdit} error={errors.password?.message as string}>
          <input
            {...register('password', { required: isEdit ? false : 'Requerido', minLength: { value: 6, message: 'Mínimo 6 caracteres' } })}
            type="password"
            className="input"
            autoComplete="new-password"
          />
        </FormField>
      </div>
      <FormField label="Nombre completo" required error={errors.fullName?.message as string}>
        <input {...register('fullName', { required: 'Requerido' })} className="input" />
      </FormField>
      <FormField label="Email" required error={errors.email?.message as string}>
        <input {...register('email', { required: 'Requerido' })} type="email" className="input" />
      </FormField>
      <FormField label="Rol">
        <select {...register('role')} className="input">
          <option value="viewer">Visualizador — solo lectura</option>
          <option value="manager">Gestor — puede cargar licencias y empleados</option>
          <option value="admin">Administrador — acceso total</option>
        </select>
      </FormField>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <Spinner size="sm" /> : 'Guardar'}
        </button>
      </div>
    </form>
  );
}

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);

  const { data: users = [], isLoading } = useUsers();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const handleCreate = async (data: any) => {
    await createMutation.mutateAsync(data);
    toast.success('Usuario creado');
    setShowCreate(false);
  };

  const handleUpdate = async (data: any) => {
    if (!editing) return;
    const payload = { ...data };
    if (!payload.password) delete payload.password;
    await updateMutation.mutateAsync({ id: editing._id, data: payload });
    toast.success('Usuario actualizado');
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await deleteMutation.mutateAsync(deleting._id);
    toast.success('Usuario eliminado');
    setDeleting(null);
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} usuarios registrados</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Nuevo usuario
        </button>
      </div>

      {/* Roles info */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={15} className="text-primary-600" />
          <span className="text-sm font-medium text-gray-700">Permisos por rol</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-xs text-gray-600">
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="font-semibold text-red-700 mb-1">Administrador</p>
            <p>Acceso total: usuarios, empleados, licencias, tipos</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="font-semibold text-blue-700 mb-1">Gestor</p>
            <p>Empleados, licencias y tipos de licencia</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="font-semibold text-gray-700 mb-1">Visualizador</p>
            <p>Solo lectura: empleados y licencias</p>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {!users.length ? (
          <EmptyState message="No hay usuarios registrados" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Usuario</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre completo</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Rol</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => {
                  const roleInfo = roleLabels[u.role] || { label: u.role, color: 'bg-gray-100 text-gray-600' };
                  const isSelf = u._id === currentUser?._id;
                  return (
                    <tr key={u._id} className="hover:bg-surface-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-gray-800">
                        {u.username}
                        {isSelf && <span className="ml-2 badge bg-primary-100 text-primary-700">Tú</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-900">{u.fullName}</td>
                      <td className="px-4 py-3 text-gray-500">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${roleInfo.color}`}>{roleInfo.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {u.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button className="btn-ghost p-1.5" onClick={() => setEditing(u)}>
                            <Pencil size={15} />
                          </button>
                          {!isSelf && (
                            <button
                              className="btn-ghost p-1.5 hover:text-red-500"
                              onClick={() => setDeleting(u)}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
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

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo usuario" size="md">
        <UserForm onSubmit={handleCreate} loading={createMutation.isPending} onCancel={() => setShowCreate(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar usuario" size="md">
        {editing && (
          <UserForm
            defaultValues={editing}
            onSubmit={handleUpdate}
            loading={updateMutation.isPending}
            onCancel={() => setEditing(null)}
            isEdit
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Eliminar usuario"
        message={`¿Eliminar al usuario "${deleting?.username}"?`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  useLicenseTypes, useCreateLicenseType, useUpdateLicenseType, useDeleteLicenseType,
} from '../../hooks/useApi';
import { Modal, ConfirmDialog, EmptyState, PageLoader, FormField, Spinner, ColorDot } from '../../components/ui';
import type { LicenseType } from '../../types';

const PRESET_COLORS = [
  '#4CAF50', '#F44336', '#2196F3', '#FF9800', '#9C27B0',
  '#607D8B', '#00BCD4', '#FF5722', '#795548', '#E91E63',
];

function LicenseTypeForm({
  defaultValues, onSubmit, loading, onCancel,
}: {
  defaultValues?: Partial<LicenseType>;
  onSubmit: (d: any) => void;
  loading?: boolean;
  onCancel: () => void;
}) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { nombre: '', descripcion: '', color: '#4CAF50', diasMaximosPorAnio: 0, requiereJustificacion: false, activo: true, categoria: 'normal', ...defaultValues },
  });
  const color = watch('color');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Nombre" required error={errors.nombre?.message as string}>
        <input {...register('nombre', { required: 'Requerido' })} className="input" />
      </FormField>
      <FormField label="Descripción">
        <input {...register('descripcion')} className="input" />
      </FormField>
      <FormField label="Categoría" required>
        <select {...register('categoria')} className="input">
          <option value="normal">Normal</option>
          <option value="vacaciones">Vacaciones</option>
          <option value="partemedico">Parte médico (enfermedad)</option>
          <option value="partemedicoaccidente">Parte médico (accidente)</option>
          <option value="inciso9">Inciso 9</option>
        </select>
      </FormField>
      <FormField label="Color">
        <div className="flex items-center gap-3">
          <input {...register('color')} type="color" className="h-9 w-16 rounded border border-gray-300 cursor-pointer" />
          <div className="flex flex-wrap gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                style={{ backgroundColor: c, borderColor: color === c ? '#1d4ed8' : 'transparent' }}
                onClick={() => setValue('color', c)}
              />
            ))}
          </div>
        </div>
      </FormField>
      <FormField label="Días máximos por año (0 = sin límite)">
        <input {...register('diasMaximosPorAnio', { valueAsNumber: true })} type="number" min={0} className="input" />
      </FormField>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input {...register('requiereJustificacion')} type="checkbox" className="rounded" />
          Requiere justificación
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input {...register('activo')} type="checkbox" className="rounded" />
          Activo
        </label>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <Spinner size="sm" /> : 'Guardar'}
        </button>
      </div>
    </form>
  );
}

export default function LicenseTypesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<LicenseType | null>(null);
  const [deleting, setDeleting] = useState<LicenseType | null>(null);

  const { data: types = [], isLoading } = useLicenseTypes();
  const createMutation = useCreateLicenseType();
  const updateMutation = useUpdateLicenseType();
  const deleteMutation = useDeleteLicenseType();

  const handleCreate = async (data: any) => {
    await createMutation.mutateAsync(data);
    toast.success('Tipo creado');
    setShowCreate(false);
  };

  const handleUpdate = async (data: any) => {
    if (!editing) return;
    await updateMutation.mutateAsync({ id: editing._id, data });
    toast.success('Tipo actualizado');
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await deleteMutation.mutateAsync(deleting._id);
    toast.success('Tipo eliminado');
    setDeleting(null);
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tipos de Licencia</h1>
          <p className="text-sm text-gray-500 mt-0.5">{types.length} tipos configurados</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Nuevo tipo
        </button>
      </div>

      <div className="card overflow-hidden">
        {!types.length ? (
          <EmptyState message="No hay tipos de licencia configurados" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Descripción</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Categoría</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Color</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Días máx/año</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Justificación</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {types.map((t) => (
                  <tr key={t._id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{t.nombre}</td>
                    <td className="px-4 py-3 text-gray-500">{t.descripcion || '—'}</td>
                    <td className="px-4 py-3">
                      {({
                        normal: <span className="badge bg-gray-100 text-gray-600">Normal</span>,
                        vacaciones: <span className="badge bg-blue-100 text-blue-700">Vacaciones</span>,
                        partemedico: <span className="badge bg-yellow-100 text-yellow-700">Parte médico</span>,
                        partemedicoaccidente: <span className="badge bg-orange-100 text-orange-700">Parte médico acc.</span>,
                        inciso9: <span className="badge bg-purple-100 text-purple-700">Inciso 9</span>,
                      } as any)[t.categoria] || <span className="badge bg-gray-100 text-gray-600">Normal</span>}
                    </td>
                    <td className="px-4 py-3">
                      <ColorDot color={t.color} label={t.color} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {t.diasMaximosPorAnio === 0 ? 'Sin límite' : t.diasMaximosPorAnio}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${t.requiereJustificacion ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                        {t.requiereJustificacion ? 'Sí' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${t.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {t.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button className="btn-ghost p-1.5" onClick={() => setEditing(t)}>
                          <Pencil size={15} />
                        </button>
                        <button
                          className="btn-ghost p-1.5 hover:text-red-500"
                          onClick={() => setDeleting(t)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo tipo de licencia" size="md">
        <LicenseTypeForm onSubmit={handleCreate} loading={createMutation.isPending} onCancel={() => setShowCreate(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar tipo de licencia" size="md">
        {editing && (
          <LicenseTypeForm
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
        title="Eliminar tipo de licencia"
        message={`¿Eliminar "${deleting?.nombre}"? Las licencias existentes de este tipo no se verán afectadas.`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

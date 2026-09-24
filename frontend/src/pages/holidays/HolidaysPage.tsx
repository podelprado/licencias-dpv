import { useState } from 'react';
import { Plus, Trash2, Download, Calendar } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  useHolidays, useCreateHoliday, useCreateHolidayBulk, useDeleteHoliday,
} from '../../hooks/useApi';
import { ConfirmDialog, EmptyState, PageLoader, FormField, Spinner } from '../../components/ui';
import type { Holiday } from '../../types';

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i);

export default function HolidaysPage() {
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [deleting, setDeleting] = useState<Holiday | null>(null);
  const [loadingNager, setLoadingNager] = useState(false);

  const { data: holidays = [], isLoading } = useHolidays(anio);
  const createMutation = useCreateHoliday();
  const bulkMutation = useCreateHolidayBulk();
  const deleteMutation = useDeleteHoliday();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ fecha: string; descripcion: string }>();

  const handleCreate = async (data: any) => {
    await createMutation.mutateAsync(data);
    toast.success('Feriado agregado');
    reset();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await deleteMutation.mutateAsync(deleting._id);
    toast.success('Feriado eliminado');
    setDeleting(null);
  };

  const handleLoadFromAPI = async () => {
    setLoadingNager(true);
    try {
      const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${anio}/AR`);
      if (!res.ok) throw new Error('No se pudo conectar con la API de feriados');
      const data: { date: string; localName: string }[] = await res.json();
      const feriados = data.map(f => ({ fecha: f.date, descripcion: f.localName }));
      const result = await bulkMutation.mutateAsync(feriados);
      toast.success(`${result.created} feriados importados, ${result.skipped} ya existían`);
    } catch (e: any) {
      toast.error(e.message || 'Error al importar feriados');
    } finally {
      setLoadingNager(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feriados</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Los feriados se excluyen del cálculo de días hábiles en licencias
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select className="input w-28" value={anio} onChange={e => setAnio(+e.target.value)}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            className="btn-secondary"
            onClick={handleLoadFromAPI}
            disabled={loadingNager}
            title="Importar feriados nacionales de Argentina desde Nager.Date"
          >
            {loadingNager ? <Spinner size="sm" /> : <Download size={16} />}
            Importar AR {anio}
          </button>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Plus size={16} className="text-primary-600" /> Agregar feriado manualmente
        </h3>
        <form onSubmit={handleSubmit(handleCreate)} className="flex gap-3 items-end">
          <FormField label="Fecha" required error={errors.fecha?.message as string}>
            <input {...register('fecha', { required: 'Requerido' })} type="date" className="input w-44" />
          </FormField>
          <FormField label="Descripción" required error={errors.descripcion?.message as string}>
            <input
              {...register('descripcion', { required: 'Requerido' })}
              className="input w-72"
              placeholder="Ej: Día de la Independencia"
            />
          </FormField>
          <button type="submit" className="btn-primary mb-0.5" disabled={createMutation.isPending}>
            {createMutation.isPending ? <Spinner size="sm" /> : 'Agregar'}
          </button>
        </form>
      </div>

      {isLoading ? <PageLoader /> : (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-surface-50 flex items-center gap-2">
            <Calendar size={15} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-600">
              {holidays.length} feriado{holidays.length !== 1 ? 's' : ''} en {anio}
            </span>
          </div>
          {!holidays.length ? (
            <EmptyState message={`No hay feriados cargados para ${anio}. Usá "Importar AR ${anio}" para cargar los nacionales.`} />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-surface-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Fecha</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Día</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Descripción</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {holidays.map(h => (
                  <tr key={h._id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-gray-700">
                      {format(parseISO(h.fecha), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-5 py-3 text-gray-500 capitalize">
                      {format(parseISO(h.fecha), 'EEEE', { locale: es })}
                    </td>
                    <td className="px-5 py-3 text-gray-800">{h.descripcion}</td>
                    <td className="px-5 py-3 text-right">
                      <button className="btn-ghost p-1.5 hover:text-red-500" onClick={() => setDeleting(h)}>
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Eliminar feriado"
        message={`¿Eliminar el feriado del ${deleting ? format(parseISO(deleting.fecha), 'dd/MM/yyyy') : ''}?`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { isBefore, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { Modal, FormField, Spinner } from '../../components/ui';
import EmployeeSearchInput from '../../components/ui/EmployeeSearchInput';
import { useCreateAbsence, useUpdateAbsence } from '../../hooks/useApi';
import type { Absence } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  defaultEmployeeId?: string;
  editing?: Absence | null;
}

export default function AbsenceFormModal({ open, onClose, defaultEmployeeId, editing }: Props) {
  const createMutation = useCreateAbsence();
  const updateMutation = useUpdateAbsence();

  const [empleadoId, setEmpleadoId] = useState(defaultEmployeeId || '');
  const [empleadoError, setEmpleadoError] = useState('');

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: { tipo: 'falta', fechaInicio: '', fechaFin: '', observaciones: '' },
  });

  const fechaInicio = watch('fechaInicio');
  const fechaFin = watch('fechaFin');

  useEffect(() => {
    if (editing) {
      const emp = editing.empleado as any;
      setEmpleadoId(emp?._id || emp || '');
      reset({
        tipo: editing.tipo,
        fechaInicio: editing.fechaInicio?.slice(0, 10),
        fechaFin: editing.fechaFin?.slice(0, 10),
        observaciones: editing.observaciones || '',
      });
    } else {
      setEmpleadoId(defaultEmployeeId || '');
      reset({ tipo: 'falta', fechaInicio: '', fechaFin: '', observaciones: '' });
    }
    setEmpleadoError('');
  }, [editing, defaultEmployeeId, open]);

  const onSubmit = async (data: any) => {
    if (!empleadoId) { setEmpleadoError('Seleccioná un empleado'); return; }
    setEmpleadoError('');
    try {
      const payload = { ...data, empleado: empleadoId };
      if (editing) {
        await updateMutation.mutateAsync({ id: editing._id, data: payload });
        toast.success('Ausencia actualizada');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Ausencia cargada');
      }
      onClose();
    } catch { /* handled by interceptor */ }
  };

  const loading = createMutation.isPending || updateMutation.isPending;
  const rangoError =
    fechaInicio && fechaFin && isBefore(parseISO(fechaFin), parseISO(fechaInicio))
      ? 'La fecha fin no puede ser anterior a la fecha inicio'
      : '';

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Editar ausencia' : 'Nueva ausencia'} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Empleado" required error={empleadoError}>
          <EmployeeSearchInput
            value={empleadoId}
            onChange={(id) => { setEmpleadoId(id); setEmpleadoError(''); }}
            disabled={!!defaultEmployeeId && !editing}
            error={empleadoError}
          />
        </FormField>

        <FormField label="Tipo" required error={errors.tipo?.message as string}>
          <select {...register('tipo', { required: 'Requerido' })} className="input">
            <option value="falta">Falta</option>
            <option value="inasistencia">Inasistencia</option>
          </select>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Fecha inicio" required error={errors.fechaInicio?.message as string}>
            <input
              {...register('fechaInicio', { required: 'Requerida' })}
              type="date"
              className="input"
            />
          </FormField>
          <FormField label="Fecha fin" required error={errors.fechaFin?.message as string}>
            <input
              {...register('fechaFin', {
                required: 'Requerida',
                validate: (v) => {
                  if (fechaInicio && isBefore(parseISO(v), parseISO(fechaInicio)))
                    return 'No puede ser anterior a la fecha inicio';
                  return true;
                },
              })}
              type="date"
              className="input"
              min={fechaInicio || undefined}
            />
          </FormField>
        </div>

        {rangoError && <p className="text-xs text-red-600">{rangoError}</p>}

        <FormField label="Observaciones">
          <textarea {...register('observaciones')} className="input resize-none" rows={2} />
        </FormField>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <Spinner size="sm" /> : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

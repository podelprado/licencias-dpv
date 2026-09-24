import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { isWeekend, parseISO, isBefore, eachDayOfInterval } from 'date-fns';
import { Modal, FormField, Spinner } from '../../components/ui';
import EmployeeSearchInput from '../../components/ui/EmployeeSearchInput';
import { useLicenseTypes, useCreateLicense, useUpdateLicense } from '../../hooks/useApi';
import type { License } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  defaultEmployeeId?: string;
  editing?: License | null;
}

function validateFecha(value: string, label: string): string | true {
  if (!value) return `${label} es requerida`;
  if (isWeekend(parseISO(value))) return `${label} no puede ser sábado ni domingo`;
  return true;
}

function calcDiasHabiles(inicio: string, fin: string): number {
  if (!inicio || !fin) return 0;
  try {
    const s = parseISO(inicio);
    const e = parseISO(fin);
    if (isBefore(e, s)) return 0;
    return eachDayOfInterval({ start: s, end: e }).filter((d) => !isWeekend(d)).length;
  } catch {
    return 0;
  }
}

export default function LicenseFormModal({ open, onClose, defaultEmployeeId, editing }: Props) {
  const { data: licenseTypes = [] } = useLicenseTypes(true);
  const createMutation = useCreateLicense();
  const updateMutation = useUpdateLicense();

  const [empleadoId, setEmpleadoId] = useState(defaultEmployeeId || '');
  const [empleadoError, setEmpleadoError] = useState('');

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      tipoLicencia: '',
      fechaInicio: '',
      fechaFin: '',
      observaciones: '',
      nroExpediente: '',
      llegadaTarde: false,
      estado: 'aprobada',
      esAccidente: false,
    },
  });

  const fechaInicio = watch('fechaInicio');
  const fechaFin = watch('fechaFin');
  const tipoLicenciaId = watch('tipoLicencia');
  const diasHabiles = calcDiasHabiles(fechaInicio, fechaFin);

  const tipoSeleccionado = licenseTypes.find((t) => t._id === tipoLicenciaId);
  const esParteMedico = tipoSeleccionado?.categoria === 'partemedico';

  useEffect(() => {
    if (editing) {
      const emp = editing.empleado as any;
      const tipo = editing.tipoLicencia as any;
      setEmpleadoId(emp?._id || emp || '');
      reset({
        tipoLicencia: tipo?._id || tipo,
        fechaInicio: editing.fechaInicio?.slice(0, 10),
        fechaFin: editing.fechaFin?.slice(0, 10),
        observaciones: editing.observaciones || '',
        nroExpediente: editing.nroExpediente || '',
        llegadaTarde: editing.llegadaTarde || false,
        estado: editing.estado,
        esAccidente: editing.esAccidente || false,
      });
    } else {
      setEmpleadoId(defaultEmployeeId || '');
      reset({ tipoLicencia: '', fechaInicio: '', fechaFin: '', observaciones: '', nroExpediente: '', llegadaTarde: false, estado: 'aprobada', esAccidente: false });
    }
    setEmpleadoError('');
  }, [editing, defaultEmployeeId, open]);

  const onSubmit = async (data: any) => {
    if (!empleadoId) {
      setEmpleadoError('Seleccioná un empleado');
      return;
    }
    setEmpleadoError('');
    try {
      const payload = { ...data, empleado: empleadoId };
      if (editing) {
        await updateMutation.mutateAsync({ id: editing._id, data: payload });
        toast.success('Licencia actualizada');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Licencia cargada');
      }
      onClose();
    } catch {
      // handled by interceptor
    }
  };

  const loading = createMutation.isPending || updateMutation.isPending;
  const rangoError =
    fechaInicio && fechaFin && isBefore(parseISO(fechaFin), parseISO(fechaInicio))
      ? 'La fecha fin no puede ser anterior a la fecha inicio'
      : '';

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Editar licencia' : 'Nueva licencia'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        <FormField label="Empleado" required error={empleadoError}>
          <EmployeeSearchInput
            value={empleadoId}
            onChange={(id) => { setEmpleadoId(id); setEmpleadoError(''); }}
            disabled={!!defaultEmployeeId && !editing}
            error={empleadoError}
          />
        </FormField>

        <FormField label="Tipo de licencia" required error={errors.tipoLicencia?.message as string}>
          <select {...register('tipoLicencia', { required: 'Requerido' })} className="input">
            <option value="">Seleccionar tipo...</option>
            {licenseTypes.map((t) => (
              <option key={t._id} value={t._id}>{t.nombre}</option>
            ))}
          </select>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Fecha inicio" required error={errors.fechaInicio?.message as string}>
            <input
              {...register('fechaInicio', {
                validate: (v) => validateFecha(v, 'Fecha inicio'),
              })}
              type="date"
              className="input"
            />
          </FormField>
          <FormField label="Fecha fin" required error={errors.fechaFin?.message as string}>
            <input
              {...register('fechaFin', {
                validate: (v) => {
                  const wk = validateFecha(v, 'Fecha fin');
                  if (wk !== true) return wk;
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

        {/* Contador de días hábiles en tiempo real */}
        {fechaInicio && fechaFin && !rangoError && (
          <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 border border-primary-100 rounded-lg">
            <span className="text-sm text-primary-700">
              Días hábiles (lun–vie):
            </span>
            <span className="text-sm font-bold text-primary-800">
              {diasHabiles} {diasHabiles === 1 ? 'día' : 'días'}
            </span>
            <span className="text-xs text-primary-500 ml-1">(sábados y domingos no se cuentan)</span>
          </div>
        )}

        {rangoError && <p className="text-xs text-red-600">{rangoError}</p>}

        {/* Aviso fin de semana */}
        {((fechaInicio && isWeekend(parseISO(fechaInicio))) || (fechaFin && isWeekend(parseISO(fechaFin)))) && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
            <span>⚠️</span>
            <span>Las licencias no pueden iniciarse ni finalizar en sábado o domingo.</span>
          </div>
        )}

        <FormField label="N° Expediente" error={errors.nroExpediente?.message as string}>
          <input
            {...register('nroExpediente')}
            className="input"
            placeholder="Ej: 1243-A-2026"
          />
        </FormField>

        <FormField label="Estado">
          <select {...register('estado')} className="input">
            <option value="aprobada">Aprobada</option>
            <option value="pendiente">Pendiente</option>
            <option value="rechazada">Rechazada</option>
          </select>
        </FormField>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input {...register('llegadaTarde')} type="checkbox" className="rounded" />
            Llegada tarde
          </label>
          {esParteMedico && (
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input {...register('esAccidente')} type="checkbox" className="rounded" />
              Es por accidente (no descuenta presentismo)
            </label>
          )}
        </div>

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

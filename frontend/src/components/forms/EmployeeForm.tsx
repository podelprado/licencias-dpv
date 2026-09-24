import { useForm } from 'react-hook-form';
import { Spinner, FormField } from '../../components/ui';
import type { Employee } from '../../types';

interface Props {
  defaultValues?: Partial<Employee>;
  onSubmit: (data: any) => void;
  loading?: boolean;
  onCancel: () => void;
}

export default function EmployeeForm({ defaultValues, onSubmit, loading, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

      {/* Datos básicos */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos básicos</p>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Legajo" required error={errors.legajo?.message as string}>
            <input {...register('legajo', { required: 'Requerido' })} className="input" placeholder="Ej: 1234" />
          </FormField>
          <FormField label="DNI">
            <input {...register('dni')} className="input" placeholder="Ej: 30123456" />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <FormField label="Nombre" required error={errors.nombre?.message as string}>
            <input {...register('nombre', { required: 'Requerido' })} className="input" />
          </FormField>
          <FormField label="Apellido" required error={errors.apellido?.message as string}>
            <input {...register('apellido', { required: 'Requerido' })} className="input" />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <FormField label="Email">
            <input {...register('email')} type="email" className="input" />
          </FormField>
          <FormField label="Fecha de ingreso">
            <input {...register('fechaIngreso')} type="date" className="input" />
          </FormField>
        </div>
      </div>

      {/* Datos organizacionales */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos organizacionales</p>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Cargo">
            <input {...register('cargo')} className="input" placeholder="Ej: Técnico" />
          </FormField>
          <FormField label="Función">
            <input {...register('funcion')} className="input" placeholder="Ej: Administrativo" />
          </FormField>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <FormField label="Dpto.">
            <input {...register('dpto')} className="input" />
          </FormField>
          <FormField label="División">
            <input {...register('division')} className="input" />
          </FormField>
          <FormField label="Sector">
            <input {...register('sector')} className="input" />
          </FormField>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <FormField label="Zona">
            <input {...register('zona')} className="input" />
          </FormField>
          <FormField label="Relación Laboral">
            <select {...register('relacionLaboral')} className="input">
              <option value="">Seleccionar...</option>
              <option>Activo</option>
              <option>Adscripo</option>
              <option>Retiro Voluntario</option>
              <option>Comision de Servicio</option>
            </select>
          </FormField>
          <FormField label="Régimen">
            <select {...register('regimen')} className="input">
              <option value="">Seleccionar...</option>
              <option>Casa Central</option>
              <option>Campaña</option>
            </select>
          </FormField>
        </div>
      </div>

      {/* Datos del formulario físico */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos adicionales (ficha)</p>
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Desarraigo">
            <input {...register('desarraigo')} className="input" />
          </FormField>
          <FormField label="Fecha Clave">
            <input {...register('fechaClave')} className="input" placeholder="Ej: 01/03" />
          </FormField>
          <FormField label="Dedicación Op.">
            <input {...register('dedicacion')} className="input" />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <FormField label="Viático A">
            <input {...register('viaticoA')} className="input" />
          </FormField>
          <FormField label="Viático B">
            <input {...register('viaticoB')} className="input" />
          </FormField>
        </div>
        <div className="grid grid-cols-1 mt-4">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input {...register('activo')} type="checkbox" className="rounded" defaultChecked />
            Empleado activo
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <Spinner size="sm" /> : 'Guardar'}
        </button>
      </div>
    </form>
  );
}

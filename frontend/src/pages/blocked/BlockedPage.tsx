import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Lock, ShieldCheck } from 'lucide-react';
import { apiClient } from '../../api/client';
import toast from 'react-hot-toast';

interface Props {
  expira?: string;
  onUnlocked: () => void;
}

export default function BlockedPage({ expira, onUnlocked }: Props) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { clave: '', dias: 15 },
  });

  const onSubmit = async (data: { clave: string; dias: number }) => {
    setLoading(true);
    try {
      const res = await apiClient.post('/admin/unlock', { clave: data.clave.trim(), dias: Number(data.dias) });
      if (res.data.ok) {
        toast.success(res.data.mensaje);
        onUnlocked();
      } else {
        toast.error(res.data.mensaje || 'Clave incorrecta');
      }
    } catch {
      toast.error('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <Lock size={32} className="text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Aplicación bloqueada</h1>
          <p className="text-sm text-gray-500 mt-2">
            {expira
              ? `El período de uso venció el ${new Date(expira).toLocaleDateString('es-AR')}.`
              : 'El período de uso ha expirado.'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Ingresá la clave de habilitación para continuar.
          </p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clave de habilitación
              </label>
              <input
                {...register('clave', { required: 'La clave es requerida' })}
                className="input uppercase tracking-widest font-mono"
                placeholder="XXXXXXXXXXXX"
                autoComplete="off"
                autoFocus
              />
              {errors.clave && (
                <p className="text-xs text-red-600 mt-1">{errors.clave.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Días a habilitar
              </label>
              <input
                {...register('dias', { required: true, min: 1, max: 365, valueAsNumber: true })}
                type="number"
                className="input"
                min={1}
                max={365}
              />
              {errors.dias && (
                <p className="text-xs text-red-600 mt-1">Ingresá un valor entre 1 y 365</p>
              )}
            </div>

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              <ShieldCheck size={16} />
              {loading ? 'Verificando...' : 'Habilitar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

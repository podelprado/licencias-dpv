import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogIn, Lock, User } from 'lucide-react';
import { useLogin } from '../../hooks/useApi';
import { useAuthStore } from '../../store/authStore';
import { Spinner } from '../../components/ui';

interface LoginForm {
  username: string;
  password: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const login = useLogin();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await login.mutateAsync(data);
      if (res.access_token) {
        setAuth(res.access_token, res.user);
        navigate('/dashboard');
      } else {
        toast.error('Credenciales inválidas');
      }
    } catch {
      // handled by interceptor
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-primary-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 shadow-lg">
            <CalendarIcon />
          </div>
          <h1 className="text-2xl font-bold text-white">Sistema de Licencias</h1>
          <p className="text-gray-400 text-sm mt-1">DPV — Gestión de Personal</p>
        </div>

        {/* Card */}
        <div className="card p-8 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Usuario</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  {...register('username', { required: 'Requerido' })}
                  className="input pl-9"
                  placeholder="usuario"
                  autoComplete="username"
                />
              </div>
              {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>}
            </div>

            <div>
              <label className="label">Contraseña</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  {...register('password', { required: 'Requerido' })}
                  type="password"
                  className="input pl-9"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={login.isPending}>
              {login.isPending ? <Spinner size="sm" /> : <><LogIn size={16} /> Ingresar</>}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Usuario por defecto: <span className="font-mono font-medium text-gray-600">admin / Admin1234!</span>
          </p>
        </div>
      </div>
    </div>
  );
}

const CalendarIcon = () => (
  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

import { useNavigate } from 'react-router-dom';
import { UserCheck, CalendarDays, Tag, TrendingUp } from 'lucide-react';
import { useEmployees } from '../../hooks/useApi';
import { useLicenses } from '../../hooks/useApi';
import { useLicenseTypes } from '../../hooks/useApi';
import { useAuthStore } from '../../store/authStore';
import { PageLoader, ColorDot } from '../../components/ui';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const now = new Date();
  const anio = now.getFullYear();
  const mes = now.getMonth() + 1;

  const { data: employees, isLoading: loadingEmp } = useEmployees(undefined, true);
  const { data: licensesMonth, isLoading: loadingLic } = useLicenses({ anio, mes });
  const { data: licenseTypes } = useLicenseTypes();

  if (loadingEmp || loadingLic) return <PageLoader />;

  const stats = [
    {
      label: 'Empleados activos',
      value: employees?.length ?? 0,
      icon: UserCheck,
      color: 'bg-blue-50 text-blue-600',
      action: () => navigate('/employees'),
    },
    {
      label: `Licencias en ${format(now, 'MMMM', { locale: es })}`,
      value: licensesMonth?.length ?? 0,
      icon: CalendarDays,
      color: 'bg-green-50 text-green-600',
      action: () => navigate('/licenses'),
    },
    {
      label: 'Tipos de licencia',
      value: licenseTypes?.length ?? 0,
      icon: Tag,
      color: 'bg-purple-50 text-purple-600',
      action: () => navigate('/license-types'),
    },
  ];

  // Licencias del mes agrupadas por tipo
  const byType: Record<string, { nombre: string; color: string; count: number }> = {};
  licensesMonth?.forEach((lic) => {
    const tipo = lic.tipoLicencia as any;
    if (!tipo?._id) return;
    const key = tipo._id;
    if (!byType[key]) byType[key] = { nombre: tipo.nombre, color: tipo.color, count: 0 };
    byType[key].count++;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenido, {user?.fullName?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {format(now, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color, action }) => (
          <button
            key={label}
            onClick={action}
            className="card p-5 text-left hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
              </div>
              <div className={`p-3 rounded-xl ${color}`}>
                <Icon size={22} />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Licencias del mes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-primary-600" />
            <h2 className="font-semibold text-gray-900">
              Licencias por tipo — {format(now, 'MMMM yyyy', { locale: es })}
            </h2>
          </div>
          {Object.keys(byType).length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Sin licencias este mes</p>
          ) : (
            <div className="space-y-3">
              {Object.values(byType).map(({ nombre, color, count }) => (
                <div key={nombre} className="flex items-center justify-between">
                  <ColorDot color={color} label={nombre} />
                  <span className="text-sm font-semibold text-gray-700">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimas licencias */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Últimas licencias cargadas</h2>
          {!licensesMonth?.length ? (
            <p className="text-sm text-gray-400 py-4 text-center">Sin licencias este mes</p>
          ) : (
            <div className="space-y-2">
              {licensesMonth.slice(0, 6).map((lic) => {
                const emp = lic.empleado as any;
                const tipo = lic.tipoLicencia as any;
                return (
                  <div key={lic._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {emp?.apellido}, {emp?.nombre}
                      </p>
                      <p className="text-xs text-gray-400">{tipo?.nombre}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{lic.cantidadDias} día{lic.cantidadDias !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Acciones rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <button className="btn-primary" onClick={() => navigate('/licenses')}>
            <CalendarDays size={16} /> Nueva licencia
          </button>
          <button className="btn-secondary" onClick={() => navigate('/employees')}>
            <UserCheck size={16} /> Ver empleados
          </button>
        </div>
      </div>
    </div>
  );
}

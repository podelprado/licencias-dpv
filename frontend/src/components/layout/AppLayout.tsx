import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCheck, CalendarDays, Tag,
  LogOut, Menu, ChevronRight, Shield, AlertCircle, ClipboardList,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'manager', 'viewer'] },
  { to: '/employees', icon: UserCheck, label: 'Empleados', roles: ['admin', 'manager', 'viewer'] },
  { to: '/licenses', icon: CalendarDays, label: 'Licencias', roles: ['admin', 'manager', 'viewer'] },
  { to: '/license-types', icon: Tag, label: 'Tipos de Licencia', roles: ['admin', 'manager'] },
  { to: '/absences', icon: AlertCircle, label: 'Faltas/Inasistencias', roles: ['admin', 'manager'] },
  { to: '/holidays', icon: CalendarDays, label: 'Feriados', roles: ['admin', 'manager'] },
  { to: '/users', icon: Users, label: 'Usuarios', roles: ['admin'] },
  { to: '/audit', icon: ClipboardList, label: 'Auditoría', roles: ['admin'] },
];

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  manager: 'Gestor',
  viewer: 'Visualizador',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleItems = navItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-surface-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={clsx(
          'flex flex-col bg-gray-900 text-white transition-all duration-300 flex-shrink-0',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-700">
          {!collapsed && (
            <div>
              <p className="font-bold text-white text-sm leading-tight">Sistema de</p>
              <p className="font-bold text-primary-400 text-sm leading-tight">Licencias DPV</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors ml-auto"
          >
            {collapsed ? <ChevronRight size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {visibleItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                )
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="border-t border-gray-700 p-3">
          {!collapsed && (
            <div className="mb-2 px-2">
              <p className="text-xs font-medium text-white truncate">{user?.fullName}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Shield size={10} className="text-primary-400" />
                <p className="text-xs text-gray-400">{roleLabels[user?.role || ''] || user?.role}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-all"
          >
            <LogOut size={18} className="flex-shrink-0" />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}

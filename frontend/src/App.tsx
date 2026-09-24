import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useAppStatus } from './hooks/useApi';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import BlockedPage from './pages/blocked/BlockedPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import EmployeesPage from './pages/employees/EmployeesPage';
import EmployeeDetailPage from './pages/employees/EmployeeDetailPage';
import LicensesPage from './pages/licenses/LicensesPage';
import LicenseTypesPage from './pages/license-types/LicenseTypesPage';
import AuditPage from './pages/audit/AuditPage';
import AbsencesPage from './pages/absences/AbsencesPage';
import ImportReportsPage from './pages/employees/ImportReportsPage';
import HolidaysPage from './pages/holidays/HolidaysPage';
import UsersPage from './pages/users/UsersPage';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <AppLayout>{children}</AppLayout>;
}

export default function App() {
  const { isAuthenticated } = useAuthStore();
  const { data: status, refetch } = useAppStatus();

  if (status && !status.activa) {
    return <BlockedPage expira={status.expira} onUnlocked={() => refetch()} />;
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated() ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/employees" element={<ProtectedRoute><EmployeesPage /></ProtectedRoute>} />
      <Route path="/employees/imports" element={<ProtectedRoute roles={['admin', 'manager']}><ImportReportsPage /></ProtectedRoute>} />
      <Route path="/employees/:id" element={<ProtectedRoute><EmployeeDetailPage /></ProtectedRoute>} />
      <Route path="/licenses" element={<ProtectedRoute><LicensesPage /></ProtectedRoute>} />
      <Route path="/license-types" element={
        <ProtectedRoute roles={['admin', 'manager']}><LicenseTypesPage /></ProtectedRoute>
      } />
      <Route path="/audit" element={
        <ProtectedRoute roles={['admin']}><AuditPage /></ProtectedRoute>
      } />
      <Route path="/absences" element={
        <ProtectedRoute roles={['admin', 'manager']}><AbsencesPage /></ProtectedRoute>
      } />
      <Route path="/holidays" element={
        <ProtectedRoute roles={['admin', 'manager']}><HolidaysPage /></ProtectedRoute>
      } />
      <Route path="/users" element={
        <ProtectedRoute roles={['admin']}><UsersPage /></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

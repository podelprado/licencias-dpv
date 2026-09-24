import React from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

// ─── Spinner ─────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const s = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' }[size];
  return (
    <div className={clsx('animate-spin rounded-full border-2 border-gray-200 border-t-primary-600', s)} />
  );
};

export const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <Spinner size="lg" />
  </div>
);

// ─── Modal ───────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal = ({ open, onClose, title, children, size = 'md' }: ModalProps) => {
  if (!open) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx('relative bg-white rounded-2xl shadow-xl w-full', widths[size])}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

// ─── StatusBadge ─────────────────────────────────────────────────────────────
const statusConfig = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  aprobada: 'bg-green-100 text-green-800',
  rechazada: 'bg-red-100 text-red-800',
};

export const StatusBadge = ({ status }: { status: string }) => (
  <span className={clsx('badge', statusConfig[status as keyof typeof statusConfig] || 'bg-gray-100 text-gray-700')}>
    {status}
  </span>
);

// ─── ColorDot ────────────────────────────────────────────────────────────────
export const ColorDot = ({ color, label }: { color: string; label?: string }) => (
  <span className="inline-flex items-center gap-1.5">
    <span className="inline-block w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
    {label && <span className="text-sm">{label}</span>}
  </span>
);

// ─── EmptyState ──────────────────────────────────────────────────────────────
export const EmptyState = ({ message = 'Sin resultados' }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
    <svg className="w-12 h-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    <p className="text-sm">{message}</p>
  </div>
);

// ─── ConfirmDialog ───────────────────────────────────────────────────────────
interface ConfirmProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  loading?: boolean;
}

export const ConfirmDialog = ({
  open, onClose, onConfirm, title = '¿Confirmar acción?',
  message = 'Esta acción no se puede deshacer.', loading,
}: ConfirmProps) => (
  <Modal open={open} onClose={onClose} title={title} size="sm">
    <p className="text-sm text-gray-600 mb-6">{message}</p>
    <div className="flex justify-end gap-3">
      <button className="btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
      <button className="btn-danger" onClick={onConfirm} disabled={loading}>
        {loading ? <Spinner size="sm" /> : 'Eliminar'}
      </button>
    </div>
  </Modal>
);

// ─── FormField ───────────────────────────────────────────────────────────────
interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export const FormField = ({ label, error, required, children }: FormFieldProps) => (
  <div>
    <label className="label">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

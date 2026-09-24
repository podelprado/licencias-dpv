import { useState, useRef, useEffect } from 'react';
import { Search, Plus, UserCheck, X } from 'lucide-react';
import { useEmployees, useCreateEmployee } from '../../hooks/useApi';
import { Spinner } from './index';
import type { Employee } from '../../types';
import toast from 'react-hot-toast';

interface Props {
  value: string;           // empleado _id seleccionado
  onChange: (id: string) => void;
  disabled?: boolean;
  error?: string;
}

export default function EmployeeSearchInput({ value, onChange, disabled, error }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickForm, setQuickForm] = useState({ legajo: '', nombre: '', apellido: '' });
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: employees = [] } = useEmployees(query || undefined, true);
  const createMutation = useCreateEmployee();

  // Empleado actualmente seleccionado
  const { data: allEmployees = [] } = useEmployees(undefined, undefined);
  const selected = allEmployees.find((e) => e._id === value);

  // Cerrar dropdown al click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowQuickCreate(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (emp: Employee) => {
    onChange(emp._id);
    setQuery('');
    setOpen(false);
    setShowQuickCreate(false);
  };

  const handleClear = () => {
    onChange('');
    setQuery('');
  };

  const handleQuickCreate = async () => {
    if (!quickForm.legajo || !quickForm.nombre || !quickForm.apellido) {
      toast.error('Legajo, nombre y apellido son requeridos');
      return;
    }
    try {
      const emp = await createMutation.mutateAsync(quickForm);
      toast.success(`Empleado ${emp.apellido}, ${emp.nombre} creado`);
      handleSelect(emp);
      setQuickForm({ legajo: '', nombre: '', apellido: '' });
    } catch {
      // handled by interceptor
    }
  };

  // Si hay un empleado seleccionado, mostrar chip
  if (value && selected) {
    return (
      <div className={`input flex items-center justify-between ${disabled ? 'bg-gray-50' : ''}`}>
        <div className="flex items-center gap-2">
          <UserCheck size={15} className="text-primary-600 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-800">
            {selected.apellido}, {selected.nombre}
          </span>
          <span className="text-xs text-gray-400">Leg. {selected.legajo}</span>
        </div>
        {!disabled && (
          <button type="button" onClick={handleClear} className="text-gray-400 hover:text-gray-600 ml-2">
            <X size={15} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Input de búsqueda */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className={`input pl-9 ${error ? 'border-red-400' : ''}`}
          placeholder="Buscar por nombre, apellido o legajo..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setShowQuickCreate(false); }}
          onFocus={() => setOpen(true)}
          disabled={disabled}
          autoComplete="off"
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {/* Lista de resultados */}
          <div className="max-h-48 overflow-y-auto">
            {employees.length === 0 && !showQuickCreate ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                {query ? 'No se encontraron empleados' : 'Escribí para buscar...'}
              </div>
            ) : (
              employees.map((emp) => (
                <button
                  key={emp._id}
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-50 text-left transition-colors"
                  onClick={() => handleSelect(emp)}
                >
                  <UserCheck size={15} className="text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {emp.apellido}, {emp.nombre}
                    </p>
                    <p className="text-xs text-gray-400">Leg. {emp.legajo}{emp.sector ? ` · ${emp.sector}` : ''}</p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Botón agregar nuevo */}
          {!showQuickCreate && (
            <div className="border-t border-gray-100">
              <button
                type="button"
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-primary-600 hover:bg-primary-50 transition-colors font-medium"
                onClick={() => {
                  setShowQuickCreate(true);
                  // Pre-llenar con lo que escribió
                  const parts = query.trim().split(' ');
                  setQuickForm({
                    legajo: '',
                    nombre: parts[0] || '',
                    apellido: parts[1] || '',
                  });
                }}
              >
                <Plus size={15} />
                Agregar nuevo empleado
              </button>
            </div>
          )}

          {/* Formulario rápido de creación */}
          {showQuickCreate && (
            <div className="border-t border-gray-100 p-3 bg-blue-50 space-y-2">
              <p className="text-xs font-semibold text-primary-700 mb-2">Nuevo empleado</p>
              <div className="grid grid-cols-3 gap-2">
                <input
                  className="input text-xs py-1.5"
                  placeholder="Legajo *"
                  value={quickForm.legajo}
                  onChange={(e) => setQuickForm((f) => ({ ...f, legajo: e.target.value }))}
                  autoFocus
                />
                <input
                  className="input text-xs py-1.5"
                  placeholder="Nombre *"
                  value={quickForm.nombre}
                  onChange={(e) => setQuickForm((f) => ({ ...f, nombre: e.target.value }))}
                />
                <input
                  className="input text-xs py-1.5"
                  placeholder="Apellido *"
                  value={quickForm.apellido}
                  onChange={(e) => setQuickForm((f) => ({ ...f, apellido: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  className="btn-ghost text-xs py-1 px-2"
                  onClick={() => setShowQuickCreate(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-primary text-xs py-1 px-3"
                  onClick={handleQuickCreate}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? <Spinner size="sm" /> : 'Crear y seleccionar'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

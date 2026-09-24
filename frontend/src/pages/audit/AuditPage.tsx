import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useAuditLogs, useUsers } from '../../hooks/useApi';
import { PageLoader, EmptyState } from '../../components/ui';
import type { AuditLog } from '../../types';

const MODULOS = ['Empleados', 'Licencias', 'Tipos de Licencia', 'Usuarios', 'Feriados', 'Ausencias'];

const ACCION_BADGE: Record<string, string> = {
  crear:    'bg-green-100 text-green-700',
  editar:   'bg-blue-100 text-blue-700',
  eliminar: 'bg-red-100 text-red-700',
};

function DiffRow({ label, antes, despues }: { label: string; antes?: any; despues?: any }) {
  if (antes === despues) return null;
  return (
    <tr className="text-xs border-b border-gray-100 last:border-0">
      <td className="py-1 pr-3 font-medium text-gray-500 w-32">{label}</td>
      <td className="py-1 pr-3 text-red-600 line-through">{antes !== undefined ? String(antes) : '—'}</td>
      <td className="py-1 text-green-700">{despues !== undefined ? String(despues) : '—'}</td>
    </tr>
  );
}

function DetailPanel({ log }: { log: AuditLog }) {
  const before = log.valorAnterior || {};
  const after  = log.valorNuevo   || {};
  const keys   = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]))
    .filter(k => !['__v', 'password', 'deletedAt', 'createdAt', 'updatedAt', '_id'].includes(k));

  if (!keys.length) return <p className="text-xs text-gray-400 px-4 py-2">Sin detalle disponible.</p>;

  return (
    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
      <table className="w-full">
        <thead>
          <tr className="text-xs text-gray-400">
            <th className="text-left pb-1 w-32">Campo</th>
            <th className="text-left pb-1">Antes</th>
            <th className="text-left pb-1">Después</th>
          </tr>
        </thead>
        <tbody>
          {keys.map(k => (
            <DiffRow key={k} label={k} antes={before[k]} despues={after[k]} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AuditPage() {
  const now = new Date();
  const [modulo, setModulo]       = useState('');
  const [usuarioId, setUsuarioId] = useState('');
  const [desde, setDesde]         = useState('');
  const [hasta, setHasta]         = useState('');
  const [expanded, setExpanded]   = useState<string | null>(null);

  const { data: logs = [], isLoading } = useAuditLogs({
    modulo:    modulo    || undefined,
    usuarioId: usuarioId || undefined,
    desde:     desde     || undefined,
    hasta:     hasta     || undefined,
  });
  const { data: users = [] } = useUsers();

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Auditoría</h1>
          <p className="text-sm text-gray-500 mt-0.5">{logs.length} registros encontrados</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <select className="input" value={modulo} onChange={e => setModulo(e.target.value)}>
          <option value="">Todos los módulos</option>
          {MODULOS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select className="input" value={usuarioId} onChange={e => setUsuarioId(e.target.value)}>
          <option value="">Todos los usuarios</option>
          {users.map(u => <option key={u._id} value={u._id}>{u.fullName}</option>)}
        </select>
        <input type="date" className="input" value={desde} onChange={e => setDesde(e.target.value)} placeholder="Desde" />
        <input type="date" className="input" value={hasta} onChange={e => setHasta(e.target.value)} placeholder="Hasta" />
      </div>

      {isLoading ? <PageLoader /> : (
        <div className="card overflow-hidden">
          {!logs.length ? (
            <EmptyState message="No hay registros de auditoría con los filtros seleccionados" />
          ) : (
            <div className="divide-y divide-gray-50">
              {logs.map((log) => (
                <div key={log._id}>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-50 transition-colors text-left"
                    onClick={() => toggle(log._id)}
                  >
                    {expanded === log._id
                      ? <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
                      : <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                    }
                    <span className="text-xs text-gray-400 w-36 flex-shrink-0">
                      {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </span>
                    <span className="text-sm font-medium text-gray-800 w-32 flex-shrink-0">{log.usuarioNombre}</span>
                    <span className="text-sm text-gray-500 w-36 flex-shrink-0">{log.modulo}</span>
                    <span className={`badge text-xs flex-shrink-0 ${ACCION_BADGE[log.accion] || 'bg-gray-100 text-gray-600'}`}>
                      {log.accion.charAt(0).toUpperCase() + log.accion.slice(1)}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto font-mono truncate">{log.entidadId}</span>
                  </button>
                  {expanded === log._id && <DetailPanel log={log} />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

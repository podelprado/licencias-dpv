import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronDown, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react';
import { useImportReports, useImportReport } from '../../hooks/useApi';
import { PageLoader } from '../../components/ui';
import type { ImportReport } from '../../types';

function ReportRow({ report }: { report: ImportReport }) {
  const [expanded, setExpanded] = useState(false);
  const { data: detail } = useImportReport(expanded ? report._id : '');

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{report.archivo}</p>
          <p className="text-xs text-gray-500">
            {format(new Date(report.createdAt), "dd/MM/yyyy HH:mm", { locale: es })} · {report.usuarioNombre}
          </p>
        </div>
        <div className="flex gap-3 text-xs flex-shrink-0">
          <span className="text-green-700 font-medium">{report.creados} creados</span>
          <span className="text-blue-700 font-medium">{report.actualizados} actualizados</span>
          {report.errores > 0 && <span className="text-red-700 font-medium">{report.errores} errores</span>}
          <span className="text-gray-500">{report.totalFilas} total</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 divide-y divide-gray-50 max-h-72 overflow-y-auto">
          {(detail?.detalle ?? report.detalle).map((row, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-2">
              {row.accion === 'error'
                ? <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                : <CheckCircle size={14} className={`mt-0.5 flex-shrink-0 ${row.accion === 'creado' ? 'text-green-500' : 'text-blue-500'}`} />
              }
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800">
                  Fila {row.fila} · {row.nombre} <span className="text-gray-400">(Leg. {row.legajo})</span>
                </p>
                {row.detalle && <p className="text-xs text-red-600">{row.detalle}</p>}
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                row.accion === 'creado' ? 'bg-green-100 text-green-700' :
                row.accion === 'actualizado' ? 'bg-blue-100 text-blue-700' :
                'bg-red-100 text-red-700'
              }`}>
                {row.accion}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ImportReportsPage() {
  const { data: reports = [], isLoading } = useImportReports();

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Historial de importaciones</h1>
        <p className="text-sm text-gray-500 mt-1">Últimas 50 importaciones de empleados</p>
      </div>

      {reports.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">
          No hay importaciones registradas
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map((r) => <ReportRow key={r._id} report={r} />)}
        </div>
      )}
    </div>
  );
}

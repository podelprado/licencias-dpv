import { useRef, useState } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Modal } from '../../components/ui';
import { useImportEmployees } from '../../hooks/useApi';
import { apiClient } from '../../api/client';
import type { ImportReport } from '../../types';
import toast from 'react-hot-toast';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function EmployeeImportModal({ open, onClose }: Props) {
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<ImportReport | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const importMutation = useImportEmployees();

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx')) {
      toast.error('Solo se aceptan archivos .xlsx');
      return;
    }
    try {
      const report = await importMutation.mutateAsync(file);
      setResult(report);
    } catch {
      // handled by interceptor
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const downloadTemplate = async () => {
    const res = await apiClient.get('/employees/import/template', { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_empleados.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setResult(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Importar empleados desde Excel" size="lg">
      {!result ? (
        <div className="space-y-4">
          <button
            className="btn-secondary w-full flex items-center justify-center gap-2"
            onClick={downloadTemplate}
          >
            <Download size={16} /> Descargar plantilla .xlsx
          </button>

          <div
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              dragging ? 'border-primary-400 bg-primary-50' : 'border-gray-300 hover:border-primary-300'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <FileSpreadsheet size={40} className="mx-auto text-gray-400 mb-3" />
            <p className="text-sm font-medium text-gray-700">
              {importMutation.isPending ? 'Procesando...' : 'Arrastrá el archivo o hacé click para seleccionar'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Solo archivos .xlsx</p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
            />
          </div>

          {importMutation.isPending && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <RefreshCw size={16} className="animate-spin" /> Procesando archivo...
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Resumen */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{result.creados}</p>
              <p className="text-xs text-green-600 mt-0.5">Creados</p>
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">{result.actualizados}</p>
              <p className="text-xs text-blue-600 mt-0.5">Actualizados</p>
            </div>
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-center">
              <p className="text-2xl font-bold text-red-700">{result.errores}</p>
              <p className="text-xs text-red-600 mt-0.5">Errores</p>
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center">
            {result.totalFilas} filas procesadas · {result.archivo}
          </p>

          {/* Detalle */}
          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
            {result.detalle.map((row, i) => (
              <div key={i} className="flex items-start gap-3 px-3 py-2">
                {row.accion === 'error'
                  ? <AlertCircle size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
                  : <CheckCircle size={15} className={`mt-0.5 flex-shrink-0 ${row.accion === 'creado' ? 'text-green-500' : 'text-blue-500'}`} />
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

          <div className="flex gap-3 pt-2">
            <button className="btn-secondary flex-1" onClick={() => setResult(null)}>
              <Upload size={16} /> Importar otro
            </button>
            <button className="btn-primary flex-1" onClick={handleClose}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

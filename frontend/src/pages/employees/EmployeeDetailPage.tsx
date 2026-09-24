import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, ChevronLeft, ChevronRight, Plus, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEmployee, useLicensesByMonth, useLicenseSummary, useLicenses, useLicenseTypes, useAbsences, usePresentismo } from '../../hooks/useApi';
import { PageLoader, ColorDot, StatusBadge } from '../../components/ui';
import LicenseCalendarGrid from '../../components/ui/LicenseCalendarGrid';
import SaldoWidget from '../../components/ui/SaldoWidget';
import PresentismoWidget from '../../components/ui/PresentismoWidget';
import { useAuthStore } from '../../store/authStore';
import LicenseFormModal from '../licenses/LicenseFormModal';
import { generateAnnualPDF } from '../../utils/generatePDF';

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuthStore();
  const canEdit = hasRole(['admin', 'manager']);

  const now = new Date();
  const [anio, setAnio] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [showNewLicense, setShowNewLicense] = useState(false);
  const [pdfAnio, setPdfAnio] = useState(now.getFullYear());
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const { data: employee, isLoading } = useEmployee(id!);
  const { data: licenses = [] } = useLicensesByMonth(id!, anio, mes);
  const { data: summary = [] } = useLicenseSummary(id!, anio);

  // Licencias del año completo para el PDF
  const { data: annualLicenses = [] } = useLicenses({ empleado: id, anio: pdfAnio });
  const { data: licenseTypes = [] } = useLicenseTypes();
  const { data: annualAbsences = [] } = useAbsences({ empleado: id, anio: pdfAnio });
  const { data: annualPresentismo = [] } = usePresentismo(id!, pdfAnio);

  // Saldo widget usa el año del calendario
  const saldoAnio = anio;

  const prevMonth = () => {
    if (mes === 1) { setMes(12); setAnio(anio - 1); }
    else setMes(mes - 1);
  };
  const nextMonth = () => {
    if (mes === 12) { setMes(1); setAnio(anio + 1); }
    else setMes(mes + 1);
  };

  const handleDownloadPDF = async () => {
    if (!employee) return;
    setGeneratingPdf(true);
    try {
      generateAnnualPDF(employee, pdfAnio, annualLicenses, licenseTypes, annualAbsences, annualPresentismo);
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (isLoading) return <PageLoader />;
  if (!employee) return <p className="text-gray-500">Empleado no encontrado</p>;

  const monthLabel = format(new Date(anio, mes - 1), 'MMMM yyyy', { locale: es });
  const years = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 no-print">
        <button className="btn-ghost p-2" onClick={() => navigate('/employees')}>
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {employee.apellido}, {employee.nombre}
          </h1>
          <p className="text-sm text-gray-500">
            Legajo: {employee.legajo} · {employee.cargo || 'Sin cargo'} · {employee.sector || 'Sin sector'}
          </p>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <button className="btn-primary" onClick={() => setShowNewLicense(true)}>
              <Plus size={16} /> Nueva licencia
            </button>
          )}
          <button className="btn-secondary" onClick={() => window.print()}>
            <Printer size={16} /> Imprimir
          </button>
        </div>
      </div>

      {/* Saldo por antigüedad */}
      <SaldoWidget
        empleadoId={id!}
        anio={saldoAnio}
        fechaIngreso={employee.fechaIngreso}
      />

      {/* Presentismo mensual */}
      <PresentismoWidget empleadoId={id!} anio={saldoAnio} />

      {/* PDF anual */}
      <div className="card p-5 no-print">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Descargar reporte anual en PDF</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Genera un PDF con la grilla de los 12 meses con los colores de cada licencia
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              className="input w-28"
              value={pdfAnio}
              onChange={(e) => setPdfAnio(+e.target.value)}
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <button
              className="btn-primary"
              onClick={handleDownloadPDF}
              disabled={generatingPdf}
            >
              <FileDown size={16} />
              {generatingPdf ? 'Generando...' : 'Descargar PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* Print header */}
      <div className="hidden print-only mb-4">
        <h1 className="text-xl font-bold">Licencias — {employee.apellido}, {employee.nombre}</h1>
        <p className="text-sm text-gray-600">Legajo: {employee.legajo} · {employee.cargo} · {employee.sector}</p>
        <p className="text-sm text-gray-600">Período: {monthLabel}</p>
      </div>

      {/* Calendar navigation */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <button className="btn-ghost p-2 no-print" onClick={prevMonth}>
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 capitalize">{monthLabel}</h2>
          <button className="btn-ghost p-2 no-print" onClick={nextMonth}>
            <ChevronRight size={18} />
          </button>
        </div>

        <LicenseCalendarGrid anio={anio} mes={mes} licenses={licenses} />

        {licenses.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2">Referencias del mes:</p>
            <div className="flex flex-wrap gap-3">
              {Array.from(
                new Map(
                  licenses.map((l) => {
                    const t = l.tipoLicencia as any;
                    return [t._id, { color: t.color, nombre: t.nombre }];
                  })
                ).values()
              ).map(({ color, nombre }) => (
                <ColorDot key={nombre} color={color} label={nombre} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Licenses list for the month */}
      {licenses.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Detalle del mes</h3>
          <div className="space-y-2">
            {licenses.map((lic) => {
              const tipo = lic.tipoLicencia as any;
              return (
                <div key={lic._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: tipo?.color }} />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{tipo?.nombre}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(lic.fechaInicio), 'dd/MM/yyyy')} — {format(new Date(lic.fechaFin), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">{lic.cantidadDias} día{lic.cantidadDias !== 1 ? 's' : ''}</span>
                    <StatusBadge status={lic.estado} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Annual summary */}
      {summary.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Resumen anual {anio}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(summary as any[]).map(({ nombre, color, dias }) => (
              <div key={nombre} className="flex items-center justify-between p-3 rounded-lg bg-surface-50">
                <ColorDot color={color} label={nombre} />
                <span className="text-sm font-bold text-gray-700">{dias}d</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showNewLicense && (
        <LicenseFormModal
          open={showNewLicense}
          onClose={() => setShowNewLicense(false)}
          defaultEmployeeId={id}
        />
      )}
    </div>
  );
}

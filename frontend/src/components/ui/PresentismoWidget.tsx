import { usePresentismo } from '../../hooks/useApi';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

interface Props {
  empleadoId: string;
  anio: number;
}

export default function PresentismoWidget({ empleadoId, anio }: Props) {
  const { data: meses, isLoading } = usePresentismo(empleadoId, anio);

  if (isLoading || !meses) return null;

  const totalConPresentismo = meses.filter((m) => m.tienePresentismo).length;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Presentismo {anio}</h3>
        <span className={`badge ${totalConPresentismo === 12 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
          {totalConPresentismo}/12 meses
        </span>
      </div>
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
        {meses.map((m) => (
          <div
            key={m.mes}
            title={m.motivo ? `Sin presentismo: ${m.motivo}` : 'Con presentismo'}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-medium cursor-default transition-colors
              ${m.tienePresentismo
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
              }`}
          >
            <span>{MESES[m.mes - 1]}</span>
            <span className={`w-2 h-2 rounded-full ${m.tienePresentismo ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
        ))}
      </div>
      {meses.some((m) => !m.tienePresentismo) && (
        <div className="mt-3 space-y-1">
          {meses.filter((m) => !m.tienePresentismo).map((m) => (
            <p key={m.mes} className="text-xs text-red-600">
              · {MESES[m.mes - 1]}: {m.motivo}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

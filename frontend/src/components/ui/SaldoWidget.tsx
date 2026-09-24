import { AlertTriangle, Umbrella, FileText } from 'lucide-react';
import { useSaldo } from '../../hooks/useApi';

interface Props {
  empleadoId: string;
  anio: number;
  fechaIngreso?: string;
}

function PoolBar({ tomados, pool }: { tomados: number; pool: number }) {
  const pct = Math.min(100, pool > 0 ? (tomados / pool) * 100 : 0);
  const color = pct >= 100 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-400' : 'bg-green-500';
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
      <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function PoolCard({ icon: Icon, title, data, color }: {
  icon: any; title: string;
  data: { pool: number; tomados: number; restantes: number };
  color: string;
}) {
  return (
    <div className={`flex-1 p-4 rounded-xl border ${color}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} />
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-2xl font-bold">{data.pool}</p>
          <p className="text-xs opacity-70">Total</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{data.tomados}</p>
          <p className="text-xs opacity-70">Tomados</p>
        </div>
        <div>
          <p className={`text-2xl font-bold ${data.restantes === 0 ? 'text-red-600' : ''}`}>
            {data.restantes}
          </p>
          <p className="text-xs opacity-70">Restantes</p>
        </div>
      </div>
      <PoolBar tomados={data.tomados} pool={data.pool} />
    </div>
  );
}

export default function SaldoWidget({ empleadoId, anio, fechaIngreso }: Props) {
  const { data: saldo, isLoading } = useSaldo(empleadoId, anio, fechaIngreso);

  if (isLoading) return null;
  if (!saldo) return null;

  if (saldo.sinFechaIngreso) {
    return (
      <div className="card p-4 flex items-center gap-3 border-amber-200 bg-amber-50">
        <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-800">Fecha de ingreso no cargada</p>
          <p className="text-xs text-amber-600">
            Cargá la fecha de ingreso del empleado para calcular el saldo por antigüedad.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Saldo {anio}</h3>
        <span className="badge bg-primary-100 text-primary-700">
          {saldo.aniosAntiguedad} año{saldo.aniosAntiguedad !== 1 ? 's' : ''} de antigüedad
          · {saldo.diasPool} días
        </span>
      </div>
      <div className="flex gap-3">
        {saldo.vacaciones && (
          <PoolCard
            icon={Umbrella}
            title="Vacaciones"
            data={saldo.vacaciones}
            color="border-blue-200 bg-blue-50 text-blue-800"
          />
        )}
        {saldo.licencias && (
          <PoolCard
            icon={FileText}
            title="Licencias"
            data={saldo.licencias}
            color="border-purple-200 bg-purple-50 text-purple-800"
          />
        )}
      </div>
      <p className="text-xs text-gray-400 mt-3">
        * Solo días hábiles (lun–vie, excluyendo feriados). Licencias con estado "rechazada" no se cuentan.
      </p>
    </div>
  );
}

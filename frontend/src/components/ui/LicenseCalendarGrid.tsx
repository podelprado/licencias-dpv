import { getDaysInMonth, getDay, format, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';
import { clsx } from 'clsx';
import type { License, LicenseType } from '../../types';

interface Props {
  anio: number;
  mes: number; // 1-12
  licenses: License[];
}

const DAYS_HEADER = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function LicenseCalendarGrid({ anio, mes, licenses }: Props) {
  const daysInMonth = getDaysInMonth(new Date(anio, mes - 1));

  // Mapa: día -> lista de licencias activas ese día
  const dayMap: Record<number, { color: string; nombre: string }[]> = {};

  for (const lic of licenses) {
    const tipo = lic.tipoLicencia as LicenseType;
    if (!tipo?.color) continue;

    const start = new Date(lic.fechaInicio);
    const end = new Date(lic.fechaFin);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getFullYear() === anio && d.getMonth() + 1 === mes) {
        const day = d.getDate();
        if (!dayMap[day]) dayMap[day] = [];
        dayMap[day].push({ color: tipo.color, nombre: tipo.nombre });
      }
    }
  }

  // Primer día de la semana del mes (0=Dom)
  const firstDayOfWeek = getDay(new Date(anio, mes - 1, 1));

  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_HEADER.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-gray-500 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="h-10 rounded" />;

          const date = new Date(anio, mes - 1, day);
          const isWknd = isWeekend(date);
          const today = new Date();
          const isToday =
            today.getDate() === day &&
            today.getMonth() + 1 === mes &&
            today.getFullYear() === anio;

          const entries = dayMap[day];
          const primaryColor = entries?.[0]?.color;
          const hasMultiple = entries && entries.length > 1;

          return (
            <div
              key={day}
              title={entries?.map((e) => e.nombre).join(', ')}
              className={clsx(
                'h-10 rounded flex flex-col items-center justify-center relative transition-all',
                isWknd && !primaryColor && 'bg-gray-50',
                !isWknd && !primaryColor && 'bg-white border border-gray-100',
                isToday && !primaryColor && 'ring-2 ring-primary-400',
              )}
              style={primaryColor ? { backgroundColor: primaryColor + '33', border: `1.5px solid ${primaryColor}` } : {}}
            >
              <span
                className={clsx(
                  'text-xs font-medium',
                  primaryColor ? 'text-gray-800' : isWknd ? 'text-gray-400' : 'text-gray-700',
                  isToday && !primaryColor && 'text-primary-700 font-bold',
                )}
              >
                {day}
              </span>
              {/* Color dot for primary license */}
              {primaryColor && (
                <span
                  className="w-2 h-2 rounded-full mt-0.5"
                  style={{ backgroundColor: primaryColor }}
                />
              )}
              {/* Indicator for multiple licenses */}
              {hasMultiple && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-orange-400" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

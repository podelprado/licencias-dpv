import jsPDF from 'jspdf';
import { getDaysInMonth, getDay, isWeekend, eachDayOfInterval } from 'date-fns';
import type { Employee, License, LicenseType, Absence, PresentismoMes } from '../types';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// Landscape A4: W=297, H=210
const PW = 297;
const PH = 210;
const M  = 8;

function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace('#', '');
  const n = parseInt(c.length === 3 ? c.split('').map(x => x + x).join('') : c, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lighten(hex: string, factor = 0.6): [number, number, number] {
  const [r, g, b] = hexToRgb(hex);
  return [
    Math.round(r * (1 - factor) + 255 * factor),
    Math.round(g * (1 - factor) + 255 * factor),
    Math.round(b * (1 - factor) + 255 * factor),
  ];
}

function diasHabilesEnMes(lic: License, anio: number, mes: number): number {
  const start = new Date(Math.max(new Date(lic.fechaInicio).getTime(), new Date(anio, mes - 1, 1).getTime()));
  const end   = new Date(Math.min(new Date(lic.fechaFin).getTime(), new Date(anio, mes, 0).getTime()));
  if (start > end) return 0;
  return eachDayOfInterval({ start, end }).filter(d => !isWeekend(d)).length;
}

// ─── HOJA 1: FICHA INDIVIDUAL DE TARJAS Y LICENCIAS ─────────────────────────
function drawHoja1(
  doc: jsPDF,
  employee: Employee,
  anio: number,
  licenses: License[],
  absences: Absence[],
  presentismo: PresentismoMes[],
) {
  // Título
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('FICHA INDIVIDUAL DE TARJAS Y LICENCIAS', PW / 2, M + 6, { align: 'center' });

  // ── Datos del empleado ────────────────────────────────────────────────────
  const dy = M + 11;
  doc.setFontSize(7);

  const field = (label: string, value: string, x: number, y: number, w: number) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, x, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value || '', x + doc.getTextWidth(`${label}: `), y);
    doc.line(x, y + 0.5, x + w, y + 0.5);
  };

  const c1 = M, c2 = M + 80, c3 = M + 160, c4 = M + 240;
  field('APELLIDO Y NOMBRES', `${employee.apellido}, ${employee.nombre}`, c1, dy, 75);
  field('LEGAJO N°', employee.legajo, c2, dy, 35);
  field('Función', employee.funcion || '', c3, dy, 55);
  field('Cargo', employee.cargo || '', c4, dy, 45);

  field('Dpto./Div.', employee.dpto || '', c1, dy + 6, 55);
  field('Zona', employee.zona || '', c2, dy + 6, 35);
  field('Adscripto', employee.adscripto || '', c3, dy + 6, 55);
  field('Campaña', employee.campania || '', c4, dy + 6, 45);

  field('Desarraigo', employee.desarraigo || '', c1, dy + 12, 55);
  field('Fecha Clave', employee.fechaClave || '', c2, dy + 12, 35);
  field('Dedicación Op.', employee.dedicacion || '', c3, dy + 12, 55);
  field('Viático "B"', employee.viatico || '', c4, dy + 12, 45);

  // ── Grilla principal ──────────────────────────────────────────────────────
  const gridY    = dy + 20;
  const labelW   = 20;   // columna MES
  const anoW     = 9;    // columna AÑO
  const usableW  = PW - M * 2 - labelW - anoW;
  const dayW     = usableW / 31;
  const rowH     = 6.2;

  // Encabezado días
  doc.setFillColor(210, 210, 210);
  doc.rect(M, gridY, labelW, rowH * 2, 'FD');
  doc.rect(M + labelW, gridY, anoW, rowH * 2, 'FD');
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.text('MES', M + labelW / 2, gridY + rowH * 1.5 - 1, { align: 'center' });
  doc.text('AÑO', M + labelW + anoW / 2, gridY + rowH * 1.5 - 1, { align: 'center' });

  for (let d = 1; d <= 31; d++) {
    const x = M + labelW + anoW + (d - 1) * dayW;
    doc.setFillColor(210, 210, 210);
    doc.rect(x, gridY, dayW, rowH, 'FD');
    doc.setFontSize(5.5);
    doc.text(String(d), x + dayW / 2, gridY + rowH - 1.5, { align: 'center' });
  }

  // Mapa licencias: mes → día → {color, sigla}
  const licMap: Record<number, Record<number, { color: string; sigla: string }>> = {};
  for (let m = 1; m <= 12; m++) licMap[m] = {};

  for (const lic of licenses) {
    if (lic.estado === 'rechazada') continue;
    const tipo = lic.tipoLicencia as LicenseType;
    if (!tipo?.color) continue;
    const sigla = tipo.nombre.substring(0, 2).toUpperCase();
    const start = new Date(lic.fechaInicio);
    const end   = new Date(lic.fechaFin);
    for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getFullYear() === anio) {
        licMap[d.getMonth() + 1][d.getDate()] = { color: tipo.color, sigla };
      }
    }
  }

  // Mapa ausencias: mes → día → tipo
  const absMap: Record<number, Record<number, string>> = {};
  for (let m = 1; m <= 12; m++) absMap[m] = {};
  for (const abs of absences) {
    const start = new Date(abs.fechaInicio);
    const end   = new Date(abs.fechaFin);
    for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getFullYear() === anio) {
        absMap[d.getMonth() + 1][d.getDate()] = abs.tipo === 'falta' ? 'F' : 'I';
      }
    }
  }

  // Mapa nroExpediente por mes: usa el de la primera licencia del mes que lo tenga
  const expMap: Record<number, string> = {};
  for (const lic of licenses) {
    if (!lic.nroExpediente) continue;
    const m = new Date(lic.fechaInicio).getMonth() + 1;
    if (!expMap[m]) expMap[m] = lic.nroExpediente;
  }

  // Filas de meses
  for (let m = 1; m <= 12; m++) {
    const ry = gridY + rowH * 2 + (m - 1) * rowH;
    const daysInMonth = getDaysInMonth(new Date(anio, m - 1));

    // Etiqueta mes
    doc.setFillColor(235, 235, 235);
    doc.rect(M, ry, labelW, rowH, 'FD');
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.text(MONTHS[m - 1].substring(0, 3).toUpperCase(), M + labelW / 2, ry + rowH - 1.8, { align: 'center' });

    doc.setFillColor(235, 235, 235);
    doc.rect(M + labelW, ry, anoW, rowH, 'FD');
    doc.setFontSize(5);
    doc.text(expMap[m] ? expMap[m].substring(0, 8) : String(anio), M + labelW + anoW / 2, ry + rowH - 1.8, { align: 'center' });

    for (let d = 1; d <= 31; d++) {
      const x = M + labelW + anoW + (d - 1) * dayW;

      if (d > daysInMonth) {
        // Día inexistente — rayado gris
        doc.setFillColor(185, 185, 185);
        doc.rect(x, ry, dayW, rowH, 'F');
        doc.setDrawColor(160);
        doc.line(x, ry, x + dayW, ry + rowH);
        doc.setDrawColor(0);
        continue;
      }

      const date = new Date(anio, m - 1, d);
      const dow  = getDay(date);
      const wknd = dow === 0 || dow === 6;
      const licEntry = licMap[m][d];
      const absEntry = absMap[m][d];

      if (wknd) {
        // Fin de semana — gris claro con S/D
        doc.setFillColor(220, 220, 220);
        doc.rect(x, ry, dayW, rowH, 'FD');
        doc.setFontSize(4.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120);
        doc.text(dow === 6 ? 'S' : 'D', x + dayW / 2, ry + rowH - 1.8, { align: 'center' });
        doc.setTextColor(0);
      } else if (absEntry) {
        // Falta/inasistencia — rojo claro
        doc.setFillColor(255, 200, 200);
        doc.rect(x, ry, dayW, rowH, 'FD');
        doc.setFontSize(4.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(180, 0, 0);
        doc.text(absEntry, x + dayW / 2, ry + rowH - 1.8, { align: 'center' });
        doc.setTextColor(0);
      } else if (licEntry) {
        // Licencia — color del tipo
        const [r, g, b] = lighten(licEntry.color, 0.55);
        doc.setFillColor(r, g, b);
        doc.rect(x, ry, dayW, rowH, 'FD');
        const [dr, dg, db] = hexToRgb(licEntry.color);
        doc.setTextColor(Math.round(dr * 0.5), Math.round(dg * 0.5), Math.round(db * 0.5));
        doc.setFontSize(4);
        doc.setFont('helvetica', 'bold');
        doc.text(licEntry.sigla, x + dayW / 2, ry + rowH - 1.8, { align: 'center' });
        doc.setTextColor(0);
      } else {
        // Día normal — azul claro (presente)
        doc.setFillColor(210, 230, 255);
        doc.rect(x, ry, dayW, rowH, 'FD');
      }
    }
  }

  // ── Tabla inferior de conceptos ───────────────────────────────────────────
  const tableY    = gridY + rowH * 2 + 12 * rowH + 3;
  const conceptoW = 52;
  const mCellW    = (PW - M * 2 - conceptoW) / 12;
  const tRowH     = 5.5;

  const conceptos = [
    'Injustificadas', 'Injustificadas Acumuladas', 'Tardanzas',
    'Comp. Pers. De Licencia', 'Desc. Jornal p/Tardanza', 'Total Desc. de Jornales',
    'Area Op. Central / Camp.', 'Desc. Viat. B / Ded. Func. - Op.',
    'Presentismo', 'Reintegro de Jornales', 'Días Hábiles',
  ];

  // Header meses
  doc.setFillColor(210, 210, 210);
  doc.rect(M, tableY, conceptoW, tRowH, 'FD');
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'bold');
  for (let m = 0; m < 12; m++) {
    const x = M + conceptoW + m * mCellW;
    doc.rect(x, tableY, mCellW, tRowH, 'FD');
    doc.text(MONTHS_SHORT[m], x + mCellW / 2, tableY + tRowH - 1.5, { align: 'center' });
  }

  // Mapa presentismo por mes (0-based)
  const presMap: Record<number, boolean> = {};
  for (const p of presentismo) presMap[p.mes - 1] = p.tienePresentismo;

  for (let i = 0; i < conceptos.length; i++) {
    const ry2 = tableY + tRowH * (i + 1);
    const isPresentismo = conceptos[i] === 'Presentismo';

    doc.setFillColor(i % 2 === 0 ? 252 : 247, i % 2 === 0 ? 252 : 247, i % 2 === 0 ? 252 : 247);
    doc.rect(M, ry2, conceptoW, tRowH, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.text(conceptos[i], M + 1.5, ry2 + tRowH - 1.8);

    for (let m = 0; m < 12; m++) {
      const x = M + conceptoW + m * mCellW;
      if (isPresentismo) {
        const tiene = presMap[m] !== false;
        doc.setFillColor(tiene ? 200 : 255, tiene ? 240 : 200, tiene ? 200 : 200);
        doc.rect(x, ry2, mCellW, tRowH, 'FD');
        doc.setFontSize(5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(tiene ? 0 : 180, tiene ? 120 : 0, 0);
        doc.text(tiene ? 'SI' : 'NO', x + mCellW / 2, ry2 + tRowH - 1.8, { align: 'center' });
        doc.setTextColor(0);
      } else {
        doc.setFillColor(i % 2 === 0 ? 252 : 247, i % 2 === 0 ? 252 : 247, i % 2 === 0 ? 252 : 247);
        doc.rect(x, ry2, mCellW, tRowH, 'FD');
      }
    }
  }

  // ── Cumplimiento + Observaciones ─────────────────────────────────────────
  const cumplY = tableY + tRowH * (conceptos.length + 1) + 3;
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.text('CUMPLIMIENTO:', M, cumplY);

  const items = [
    { label: 'A', desc: 'Puntualidad' },
    { label: 'B', desc: 'Inasist. S/J' },
    { label: 'C', desc: 'Permanencia' },
  ];
  let cx = M + 28;
  for (const item of items) {
    doc.rect(cx, cumplY - 4, 5, 4.5, 'D');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.text(item.label, cx + 2.5, cumplY - 0.8, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.text(item.desc, cx + 7, cumplY - 0.8);
    cx += 32;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.text('ACLARACIÓN:', cx + 5, cumplY);
  doc.line(cx + 22, cumplY + 0.5, PW - M, cumplY + 0.5);

  doc.setFont('helvetica', 'bold');
  doc.text('OBSERVACIONES:', M, cumplY + 6);
  doc.line(M + 30, cumplY + 6.5, PW - M, cumplY + 6.5);
}

// ─── HOJA 2: REGISTRO DE LICENCIAS ──────────────────────────────────────────
function drawHoja2(
  doc: jsPDF,
  employee: Employee,
  anio: number,
  licenses: License[],
  licenseTypes: LicenseType[],
) {
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('REGISTRO DE LICENCIAS', PW / 2, M + 6, { align: 'center' });

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Empleado: ${employee.apellido}, ${employee.nombre}`, M, M + 13);
  doc.text(`Legajo N°: ${employee.legajo}`, PW - M, M + 13, { align: 'right' });
  doc.text(`Año: ${anio}`, PW / 2, M + 13, { align: 'center' });

  const tableY  = M + 18;
  const rowH    = 6;
  const mesW    = 16;
  const subCols = ['Días', 'Total', 'Acum.'];
  const subW    = 8;
  const tipoW   = subCols.length * subW;

  // Columnas fijas al final
  const fixedDefs = [
    { label: 'Días\nHábiles', w: 13 },
    { label: 'Días\nTomados', w: 13 },
    { label: 'Saldo', w: 11 },
    { label: 'Observaciones', w: 0 },
  ];
  const fixedStaticW = fixedDefs.slice(0, 3).reduce((a, c) => a + c.w, 0);
  fixedDefs[3].w = PW - M * 2 - mesW - licenseTypes.length * tipoW - fixedStaticW;

  // ── Header fila 1: tipos ──────────────────────────────────────────────────
  doc.setFillColor(210, 210, 210);
  doc.rect(M, tableY, mesW, rowH * 2, 'FD');
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'bold');
  doc.text('MES', M + mesW / 2, tableY + rowH - 1, { align: 'center' });

  let hx = M + mesW;
  for (const tipo of licenseTypes) {
    const [r, g, b] = lighten(tipo.color, 0.5);
    doc.setFillColor(r, g, b);
    doc.rect(hx, tableY, tipoW, rowH, 'FD');
    doc.setTextColor(0);
    const nombre = tipo.nombre.length > 14 ? tipo.nombre.substring(0, 13) + '.' : tipo.nombre;
    doc.setFontSize(5);
    doc.text(nombre, hx + tipoW / 2, tableY + rowH - 1.5, { align: 'center' });

    for (let s = 0; s < subCols.length; s++) {
      doc.setFillColor(230, 230, 230);
      doc.rect(hx + s * subW, tableY + rowH, subW, rowH, 'FD');
      doc.setFontSize(4.5);
      doc.text(subCols[s], hx + s * subW + subW / 2, tableY + rowH * 2 - 1.5, { align: 'center' });
    }
    hx += tipoW;
  }

  // Columnas fijas header
  for (const col of fixedDefs) {
    doc.setFillColor(210, 210, 210);
    doc.rect(hx, tableY, col.w, rowH * 2, 'FD');
    doc.setFontSize(4.8);
    doc.setFont('helvetica', 'bold');
    const lines = col.label.split('\n');
    lines.forEach((line, i) => {
      doc.text(line, hx + col.w / 2, tableY + rowH - 2 + i * 3.5, { align: 'center' });
    });
    hx += col.w;
  }

  // ── Filas de meses ────────────────────────────────────────────────────────
  const acum: Record<string, number> = {};
  licenseTypes.forEach(t => { acum[t._id] = 0; });

  for (let m = 1; m <= 12; m++) {
    const ry = tableY + rowH * 2 + (m - 1) * rowH;
    const bg: [number, number, number] = m % 2 === 0 ? [248, 248, 248] : [255, 255, 255];

    doc.setFillColor(...bg);
    doc.rect(M, ry, mesW, rowH, 'FD');
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.text(MONTHS_SHORT[m - 1], M + mesW / 2, ry + rowH - 1.8, { align: 'center' });

    let rx = M + mesW;
    let totalMes = 0;

    for (const tipo of licenseTypes) {
      const diasMes = licenses
        .filter(l => {
          const t = l.tipoLicencia as LicenseType;
          return t?._id === tipo._id && l.estado !== 'rechazada';
        })
        .reduce((sum, l) => sum + diasHabilesEnMes(l, anio, m), 0);

      acum[tipo._id] += diasMes;
      totalMes += diasMes;

      const vals = [
        diasMes > 0 ? String(diasMes) : '',
        diasMes > 0 ? String(diasMes) : '',
        acum[tipo._id] > 0 ? String(acum[tipo._id]) : '',
      ];

      for (let s = 0; s < subCols.length; s++) {
        doc.setFillColor(...bg);
        doc.rect(rx + s * subW, ry, subW, rowH, 'FD');
        if (vals[s]) {
          doc.setFontSize(5.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(40, 40, 40);
          doc.text(vals[s], rx + s * subW + subW / 2, ry + rowH - 1.8, { align: 'center' });
          doc.setTextColor(0);
        }
      }
      rx += tipoW;
    }

    // Columnas fijas
    const fixedVals = [
      totalMes > 0 ? String(totalMes) : '',
      totalMes > 0 ? String(totalMes) : '',
      '',
      '',
    ];
    for (let f = 0; f < fixedDefs.length; f++) {
      doc.setFillColor(...bg);
      doc.rect(rx, ry, fixedDefs[f].w, rowH, 'FD');
      if (fixedVals[f]) {
        doc.setFontSize(5.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 40, 40);
        doc.text(fixedVals[f], rx + fixedDefs[f].w / 2, ry + rowH - 1.8, { align: 'center' });
        doc.setTextColor(0);
      }
      rx += fixedDefs[f].w;
    }
  }

  // ── Fila totales ──────────────────────────────────────────────────────────
  const totalY = tableY + rowH * 2 + 12 * rowH;
  doc.setFillColor(210, 210, 210);
  doc.rect(M, totalY, mesW, rowH, 'FD');
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL', M + mesW / 2, totalY + rowH - 1.8, { align: 'center' });

  let tx = M + mesW;
  for (const tipo of licenseTypes) {
    const total = licenses
      .filter(l => (l.tipoLicencia as LicenseType)?._id === tipo._id && l.estado !== 'rechazada')
      .reduce((sum, l) => sum + l.cantidadDias, 0);

    for (let s = 0; s < subCols.length; s++) {
      doc.setFillColor(210, 210, 210);
      doc.rect(tx + s * subW, totalY, subW, rowH, 'FD');
      if (s === 2 && total > 0) {
        doc.setFontSize(5.5);
        doc.text(String(total), tx + s * subW + subW / 2, totalY + rowH - 1.8, { align: 'center' });
      }
    }
    tx += tipoW;
  }
  for (const col of fixedDefs) {
    doc.setFillColor(210, 210, 210);
    doc.rect(tx, totalY, col.w, rowH, 'FD');
    tx += col.w;
  }

  // ── Leyenda de tipos ──────────────────────────────────────────────────────
  const legendY = totalY + rowH + 5;
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Referencias:', M, legendY);
  let lx = M + 18;
  for (const tipo of licenseTypes) {
    const [r, g, b] = hexToRgb(tipo.color);
    doc.setFillColor(r, g, b);
    doc.rect(lx, legendY - 3, 3, 3, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const lbl = tipo.nombre;
    doc.text(lbl, lx + 4.5, legendY);
    lx += doc.getTextWidth(lbl) + 10;
    if (lx > PW - M - 20) lx = M + 18;
  }
  doc.setTextColor(0);

  // ── Observaciones ─────────────────────────────────────────────────────────
  const obsY = legendY + 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.text('OBSERVACIONES:', M, obsY);
  doc.line(M + 30, obsY + 0.5, PW - M, obsY + 0.5);
  doc.line(M, obsY + 6, PW - M, obsY + 6);
  doc.line(M, obsY + 12, PW - M, obsY + 12);
}

// ─── EXPORT PRINCIPAL ────────────────────────────────────────────────────────
export function generateAnnualPDF(
  employee: Employee,
  anio: number,
  licenses: License[],
  licenseTypes: LicenseType[],
  absences: Absence[] = [],
  presentismo: PresentismoMes[] = [],
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  drawHoja1(doc, employee, anio, licenses, absences, presentismo);
  doc.addPage('a4', 'landscape');
  drawHoja2(doc, employee, anio, licenses, licenseTypes);

  doc.save(`Ficha_${employee.apellido}_${employee.nombre}_${anio}.pdf`);
}

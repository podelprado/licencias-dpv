import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { License, LicenseDocument } from './schemas/license.schema';
import { CreateLicenseDto } from './dto/create-license.dto';
import { UpdateLicenseDto } from './dto/update-license.dto';
import { HolidaysService } from '../holidays/holidays.service';
import { AbsencesService } from '../absences/absences.service';
import { LicenseTypeCategoria } from '../license-types/schemas/license-type.schema';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditModule } from '../audit/schemas/audit.schema';

// Días por antigüedad (años completos)
function diasPorAntiguedad(anios: number): number {
  if (anios < 5)  return 20;
  if (anios < 10) return 25;
  if (anios < 15) return 30;
  return 35;
}

@Injectable()
export class LicensesService {
  constructor(
    @InjectModel(License.name) private licenseModel: Model<LicenseDocument>,
    private readonly holidaysService: HolidaysService,
    private readonly absencesService: AbsencesService,
    private readonly auditService: AuditService,
  ) {}

  private calcDiasHabiles(start: Date, end: Date, holidays: Set<string>): number {
    let count = 0;
    for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dow = d.getDay();
      const key = d.toISOString().slice(0, 10);
      if (dow !== 0 && dow !== 6 && !holidays.has(key)) count++;
    }
    return count;
  }

  async create(dto: CreateLicenseDto, userId: string, userName: string): Promise<LicenseDocument> {
    const start = new Date(dto.fechaInicio);
    const end   = new Date(dto.fechaFin);
    if (end < start) throw new BadRequestException('La fecha fin no puede ser anterior a la fecha inicio');
    const holidays = await this.holidaysService.getHolidaySet(start.getFullYear());
    const dias = this.calcDiasHabiles(start, end, holidays);
    const license = new this.licenseModel({
      ...dto,
      empleado:     new Types.ObjectId(dto.empleado),
      tipoLicencia: new Types.ObjectId(dto.tipoLicencia),
      fechaInicio:  start, fechaFin: end, cantidadDias: dias,
      creadoPor:    new Types.ObjectId(userId), deletedAt: null,
    });
    const saved = await (await license.save()).populate(['empleado', 'tipoLicencia']);
    await this.auditService.log({
      usuarioId: userId, usuarioNombre: userName,
      modulo: AuditModule.LICENCIAS, accion: AuditAction.CREAR,
      entidadId: saved._id.toString(), valorNuevo: dto as any,
    });
    return saved;
  }

  async findAll(query?: { empleado?: string; anio?: number; mes?: number; estado?: string }): Promise<LicenseDocument[]> {
    const filter: any = { deletedAt: null };
    if (query?.empleado) filter.empleado = new Types.ObjectId(query.empleado);
    if (query?.estado)   filter.estado   = query.estado;
    if (query?.anio) {
      const { anio, mes } = query;
      const start = mes ? new Date(anio, mes - 1, 1)      : new Date(anio, 0, 1);
      const end   = mes ? new Date(anio, mes, 0, 23,59,59) : new Date(anio, 11, 31, 23,59,59);
      filter.$or = [{ fechaInicio: { $lte: end }, fechaFin: { $gte: start } }];
    }
    return this.licenseModel
      .find(filter)
      .populate('empleado', 'legajo nombre apellido')
      .populate('tipoLicencia', 'nombre color')
      .sort({ fechaInicio: -1 })
      .exec();
  }

  async findById(id: string): Promise<LicenseDocument> {
    const license = await this.licenseModel
      .findOne({ _id: id, deletedAt: null })
      .populate('empleado', 'legajo nombre apellido')
      .populate('tipoLicencia', 'nombre color descripcion')
      .exec();
    if (!license) throw new NotFoundException('Licencia no encontrada');
    return license;
  }

  async findByEmployeeAndMonth(empleadoId: string, anio: number, mes: number): Promise<LicenseDocument[]> {
    const start = new Date(anio, mes - 1, 1);
    const end   = new Date(anio, mes, 0, 23, 59, 59);
    return this.licenseModel
      .find({ empleado: new Types.ObjectId(empleadoId), fechaInicio: { $lte: end }, fechaFin: { $gte: start }, deletedAt: null })
      .populate('tipoLicencia', 'nombre color')
      .sort({ fechaInicio: 1 })
      .exec();
  }

  async update(id: string, dto: UpdateLicenseDto, userId: string, userName: string): Promise<LicenseDocument> {
    const before = await this.findById(id);
    if (dto.fechaInicio && dto.fechaFin) {
      const start = new Date(dto.fechaInicio);
      const end   = new Date(dto.fechaFin);
      if (end < start) throw new BadRequestException('La fecha fin no puede ser anterior a la fecha inicio');
      const holidays = await this.holidaysService.getHolidaySet(start.getFullYear());
      (dto as any).cantidadDias = this.calcDiasHabiles(start, end, holidays);
    }
    const license = await this.licenseModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('empleado', 'legajo nombre apellido')
      .populate('tipoLicencia', 'nombre color')
      .exec();
    if (!license) throw new NotFoundException('Licencia no encontrada');
    await this.auditService.log({
      usuarioId: userId, usuarioNombre: userName,
      modulo: AuditModule.LICENCIAS, accion: AuditAction.EDITAR,
      entidadId: id, valorAnterior: before.toObject(), valorNuevo: dto as any,
    });
    return license;
  }

  async remove(id: string, userId: string, userName: string): Promise<void> {
    const before = await this.findById(id);
    const result = await this.licenseModel.findByIdAndUpdate(id, { deletedAt: new Date() }).exec();
    if (!result) throw new NotFoundException('Licencia no encontrada');
    await this.auditService.log({
      usuarioId: userId, usuarioNombre: userName,
      modulo: AuditModule.LICENCIAS, accion: AuditAction.ELIMINAR,
      entidadId: id, valorAnterior: before.toObject(),
    });
  }

  async getSummaryByYear(empleadoId: string, anio: number) {
    const start = new Date(anio, 0, 1);
    const end   = new Date(anio, 11, 31, 23, 59, 59);
    const licenses = await this.licenseModel
      .find({ empleado: new Types.ObjectId(empleadoId), fechaInicio: { $lte: end }, fechaFin: { $gte: start }, estado: 'aprobada', deletedAt: null })
      .populate('tipoLicencia', 'nombre color')
      .exec();

    const summary: Record<string, { nombre: string; color: string; dias: number }> = {};
    for (const lic of licenses) {
      const tipo = lic.tipoLicencia as any;
      const key  = tipo._id.toString();
      if (!summary[key]) summary[key] = { nombre: tipo.nombre, color: tipo.color, dias: 0 };
      summary[key].dias += lic.cantidadDias;
    }
    return Object.values(summary);
  }

  // Presentismo mensual: array de 12 meses con tienePresentismo boolean
  async getPresentismo(empleadoId: string, anio: number): Promise<{ mes: number; tienePresentismo: boolean; motivo: string | null }[]> {
    const start = new Date(anio, 0, 1);
    const end   = new Date(anio, 11, 31, 23, 59, 59);

    // Licencias del año (no rechazadas)
    const licenses = await this.licenseModel
      .find({ empleado: new Types.ObjectId(empleadoId), fechaInicio: { $lte: end }, fechaFin: { $gte: start }, estado: { $ne: 'rechazada' } })
      .populate('tipoLicencia', 'nombre categoria color')
      .exec();

    // Ausencias del año
    const absences = await this.absencesService.findByEmployeeAndYear(empleadoId, anio);

    // Meses con falta/inasistencia
    const mesesConFalta = new Set<number>();
    for (const abs of absences) {
      const mesInicio = new Date(abs.fechaInicio).getMonth(); // 0-based
      const mesFin    = new Date(abs.fechaFin).getMonth();
      for (let m = mesInicio; m <= mesFin; m++) mesesConFalta.add(m);
    }

    // Parte médico (no accidente): acumular días corridos por mes-inicio
    // Si acumulado > 60 días corridos → pierde el mes SIGUIENTE
    const mesesPorParteMedico = new Set<number>();
    let diasParteMedico = 0;
    for (const lic of licenses) {
      const tipo = lic.tipoLicencia as any;
      if (tipo?.categoria === LicenseTypeCategoria.PARTE_MEDICO && !lic.esAccidente) {
        const s = new Date(lic.fechaInicio);
        const e = new Date(lic.fechaFin);
        const dias = Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        diasParteMedico += dias;
        if (diasParteMedico > 60) {
          // mes siguiente al inicio de esta licencia
          const mesSiguiente = (s.getMonth() + 1) % 12;
          mesesPorParteMedico.add(mesSiguiente);
        }
      }
    }

    // Inciso 9: detectar 2 meses consecutivos → bloquear 4 meses siguientes al segundo
    const mesesConInciso9 = new Set<number>();
    for (const lic of licenses) {
      const tipo = lic.tipoLicencia as any;
      if (tipo?.categoria === LicenseTypeCategoria.INCISO_9) {
        mesesConInciso9.add(new Date(lic.fechaInicio).getMonth());
      }
    }
    const mesesBloqueadosPorInciso9 = new Set<number>();
    const mesesInciso9Arr = Array.from(mesesConInciso9).sort((a, b) => a - b);
    for (let i = 0; i < mesesInciso9Arr.length - 1; i++) {
      if (mesesInciso9Arr[i + 1] === mesesInciso9Arr[i] + 1) {
        // 2 meses consecutivos encontrados: bloquear 4 meses desde el segundo
        const segundoMes = mesesInciso9Arr[i + 1];
        for (let j = 1; j <= 4; j++) {
          const bloqueado = (segundoMes + j) % 12;
          mesesBloqueadosPorInciso9.add(bloqueado);
        }
      }
    }

    return Array.from({ length: 12 }, (_, i) => {
      if (mesesConFalta.has(i))           return { mes: i + 1, tienePresentismo: false, motivo: 'falta/inasistencia' };
      if (mesesPorParteMedico.has(i))     return { mes: i + 1, tienePresentismo: false, motivo: 'parte médico >60 días' };
      if (mesesBloqueadosPorInciso9.has(i)) return { mes: i + 1, tienePresentismo: false, motivo: 'inciso 9 consecutivo' };
      return { mes: i + 1, tienePresentismo: true, motivo: null };
    });
  }

  // Saldo de licencias y vacaciones por antigüedad
  async getSaldo(empleadoId: string, anio: number, fechaIngreso?: Date) {
    if (!fechaIngreso) {
      return { sinFechaIngreso: true };
    }

    // Años completos al 1 de enero del año consultado
    const refDate  = new Date(anio, 0, 1);
    const anios    = Math.floor((refDate.getTime() - fechaIngreso.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    const diasPool = diasPorAntiguedad(Math.max(0, anios));

    const start = new Date(anio, 0, 1);
    const end   = new Date(anio, 11, 31, 23, 59, 59);

    const licenses = await this.licenseModel
      .find({ empleado: new Types.ObjectId(empleadoId), fechaInicio: { $lte: end }, fechaFin: { $gte: start }, estado: { $ne: 'rechazada' } })
      .populate('tipoLicencia', 'nombre color')
      .exec();

    let diasVacacionesTomados = 0;
    let diasLicenciasTomados  = 0;

    for (const lic of licenses) {
      const tipo = (lic.tipoLicencia as any)?.nombre?.toLowerCase() || '';
      if (tipo === 'vacaciones') {
        diasVacacionesTomados += lic.cantidadDias;
      } else {
        diasLicenciasTomados += lic.cantidadDias;
      }
    }

    return {
      sinFechaIngreso: false,
      aniosAntiguedad: Math.max(0, anios),
      diasPool,
      // Vacaciones
      vacaciones: {
        pool:      diasPool,
        tomados:   diasVacacionesTomados,
        restantes: Math.max(0, diasPool - diasVacacionesTomados),
      },
      // Licencias (todos los tipos excepto vacaciones)
      licencias: {
        pool:      diasPool,
        tomados:   diasLicenciasTomados,
        restantes: Math.max(0, diasPool - diasLicenciasTomados),
      },
    };
  }
}

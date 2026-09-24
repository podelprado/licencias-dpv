import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Absence, AbsenceDocument } from './schemas/absence.schema';
import { CreateAbsenceDto, UpdateAbsenceDto } from './dto/absence.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditModule } from '../audit/schemas/audit.schema';

function calcDias(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

@Injectable()
export class AbsencesService {
  constructor(
    @InjectModel(Absence.name) private absenceModel: Model<AbsenceDocument>,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateAbsenceDto, userId: string, userName: string): Promise<AbsenceDocument> {
    const start = new Date(dto.fechaInicio);
    const end   = new Date(dto.fechaFin);
    if (end < start) throw new BadRequestException('La fecha fin no puede ser anterior a la fecha inicio');
    const absence = await new this.absenceModel({
      ...dto,
      empleado:     new Types.ObjectId(dto.empleado),
      fechaInicio:  start,
      fechaFin:     end,
      cantidadDias: calcDias(start, end),
      creadoPor:    new Types.ObjectId(userId),
      deletedAt:    null,
    }).save();
    await absence.populate('empleado', 'legajo nombre apellido');
    await this.auditService.log({
      usuarioId: userId, usuarioNombre: userName,
      modulo: AuditModule.AUSENCIAS, accion: AuditAction.CREAR,
      entidadId: absence._id.toString(), valorNuevo: dto as any,
    });
    return absence;
  }

  async findAll(query?: { empleado?: string; anio?: number; mes?: number }): Promise<AbsenceDocument[]> {
    const filter: any = { deletedAt: null };
    if (query?.empleado) filter.empleado = new Types.ObjectId(query.empleado);
    if (query?.anio) {
      const { anio, mes } = query;
      const start = mes ? new Date(anio, mes - 1, 1)       : new Date(anio, 0, 1);
      const end   = mes ? new Date(anio, mes, 0, 23, 59, 59) : new Date(anio, 11, 31, 23, 59, 59);
      filter.$or = [{ fechaInicio: { $lte: end }, fechaFin: { $gte: start } }];
    }
    return this.absenceModel
      .find(filter)
      .populate('empleado', 'legajo nombre apellido')
      .sort({ fechaInicio: -1 })
      .exec();
  }

  async findById(id: string): Promise<AbsenceDocument> {
    const absence = await this.absenceModel
      .findOne({ _id: id, deletedAt: null })
      .populate('empleado', 'legajo nombre apellido')
      .exec();
    if (!absence) throw new NotFoundException('Ausencia no encontrada');
    return absence;
  }

  async update(id: string, dto: UpdateAbsenceDto, userId: string, userName: string): Promise<AbsenceDocument> {
    const before = await this.findById(id);
    if (dto.fechaInicio && dto.fechaFin) {
      const start = new Date(dto.fechaInicio);
      const end   = new Date(dto.fechaFin);
      if (end < start) throw new BadRequestException('La fecha fin no puede ser anterior a la fecha inicio');
      (dto as any).cantidadDias = calcDias(start, end);
    }
    const absence = await this.absenceModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('empleado', 'legajo nombre apellido')
      .exec();
    if (!absence) throw new NotFoundException('Ausencia no encontrada');
    await this.auditService.log({
      usuarioId: userId, usuarioNombre: userName,
      modulo: AuditModule.AUSENCIAS, accion: AuditAction.EDITAR,
      entidadId: id, valorAnterior: before.toObject(), valorNuevo: dto as any,
    });
    return absence;
  }

  async remove(id: string, userId: string, userName: string): Promise<void> {
    const before = await this.findById(id);
    const result = await this.absenceModel.findByIdAndUpdate(id, { deletedAt: new Date() }).exec();
    if (!result) throw new NotFoundException('Ausencia no encontrada');
    await this.auditService.log({
      usuarioId: userId, usuarioNombre: userName,
      modulo: AuditModule.AUSENCIAS, accion: AuditAction.ELIMINAR,
      entidadId: id, valorAnterior: before.toObject(),
    });
  }

  async findByEmployeeAndYear(empleadoId: string, anio: number): Promise<AbsenceDocument[]> {
    const start = new Date(anio, 0, 1);
    const end   = new Date(anio, 11, 31, 23, 59, 59);
    return this.absenceModel
      .find({ empleado: new Types.ObjectId(empleadoId), fechaInicio: { $lte: end }, fechaFin: { $gte: start }, deletedAt: null })
      .sort({ fechaInicio: 1 })
      .exec();
  }
}

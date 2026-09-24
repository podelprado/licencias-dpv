import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Holiday, HolidayDocument } from './schemas/holiday.schema';
import { CreateHolidayDto, UpdateHolidayDto } from './dto/holiday.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditModule } from '../audit/schemas/audit.schema';

@Injectable()
export class HolidaysService {
  constructor(
    @InjectModel(Holiday.name) private holidayModel: Model<HolidayDocument>,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateHolidayDto, userId?: string, userName?: string): Promise<HolidayDocument> {
    const fecha = new Date(dto.fecha);
    const exists = await this.holidayModel.findOne({ fecha, deletedAt: null });
    if (exists) throw new ConflictException('Ya existe un feriado en esa fecha');
    const h = await this.holidayModel.create({ ...dto, fecha, deletedAt: null });
    if (userId && userName) {
      await this.auditService.log({
        usuarioId: userId, usuarioNombre: userName,
        modulo: AuditModule.FERIADOS, accion: AuditAction.CREAR,
        entidadId: h._id.toString(), valorNuevo: dto as any,
      });
    }
    return h;
  }

  async bulkCreate(dtos: CreateHolidayDto[], userId?: string, userName?: string): Promise<{ created: number; skipped: number }> {
    let created = 0, skipped = 0;
    for (const dto of dtos) {
      try { await this.create(dto, userId, userName); created++; }
      catch { skipped++; }
    }
    return { created, skipped };
  }

  async findAll(anio?: number): Promise<HolidayDocument[]> {
    const filter: any = { deletedAt: null };
    if (anio) filter.fecha = { $gte: new Date(anio, 0, 1), $lte: new Date(anio, 11, 31) };
    return this.holidayModel.find(filter).sort({ fecha: 1 }).exec();
  }

  async getHolidaySet(anio: number): Promise<Set<string>> {
    const holidays = await this.findAll(anio);
    return new Set(holidays.filter(h => h.activo).map(h => h.fecha.toISOString().slice(0, 10)));
  }

  async update(id: string, dto: UpdateHolidayDto, userId: string, userName: string): Promise<HolidayDocument> {
    const before = await this.holidayModel.findOne({ _id: id, deletedAt: null }).exec();
    if (!before) throw new NotFoundException('Feriado no encontrado');
    const h = await this.holidayModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    await this.auditService.log({
      usuarioId: userId, usuarioNombre: userName,
      modulo: AuditModule.FERIADOS, accion: AuditAction.EDITAR,
      entidadId: id, valorAnterior: before.toObject(), valorNuevo: dto as any,
    });
    return h!;
  }

  async remove(id: string, userId: string, userName: string): Promise<void> {
    const before = await this.holidayModel.findOne({ _id: id, deletedAt: null }).exec();
    if (!before) throw new NotFoundException('Feriado no encontrado');
    await this.holidayModel.findByIdAndUpdate(id, { deletedAt: new Date() }).exec();
    await this.auditService.log({
      usuarioId: userId, usuarioNombre: userName,
      modulo: AuditModule.FERIADOS, accion: AuditAction.ELIMINAR,
      entidadId: id, valorAnterior: before.toObject(),
    });
  }
}

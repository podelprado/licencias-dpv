import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LicenseType, LicenseTypeDocument } from './schemas/license-type.schema';
import { CreateLicenseTypeDto } from './dto/create-license-type.dto';
import { UpdateLicenseTypeDto } from './dto/update-license-type.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditModule } from '../audit/schemas/audit.schema';

@Injectable()
export class LicenseTypesService {
  constructor(
    @InjectModel(LicenseType.name) private licenseTypeModel: Model<LicenseTypeDocument>,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateLicenseTypeDto, userId: string, userName: string): Promise<LicenseTypeDocument> {
    const exists = await this.licenseTypeModel.findOne({ nombre: dto.nombre, deletedAt: null });
    if (exists) throw new ConflictException(`Tipo de licencia '${dto.nombre}' ya existe`);
    const type = await new this.licenseTypeModel({ ...dto, deletedAt: null }).save();
    await this.auditService.log({
      usuarioId: userId, usuarioNombre: userName,
      modulo: AuditModule.TIPOS_LICENCIA, accion: AuditAction.CREAR,
      entidadId: type._id.toString(), valorNuevo: dto as any,
    });
    return type;
  }

  async findAll(onlyActive = false): Promise<LicenseTypeDocument[]> {
    const filter: any = { deletedAt: null };
    if (onlyActive) filter.activo = true;
    return this.licenseTypeModel.find(filter).sort({ nombre: 1 }).exec();
  }

  async findById(id: string): Promise<LicenseTypeDocument> {
    const type = await this.licenseTypeModel.findOne({ _id: id, deletedAt: null }).exec();
    if (!type) throw new NotFoundException('Tipo de licencia no encontrado');
    return type;
  }

  async update(id: string, dto: UpdateLicenseTypeDto, userId: string, userName: string): Promise<LicenseTypeDocument> {
    const before = await this.findById(id);
    const type = await this.licenseTypeModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!type) throw new NotFoundException('Tipo de licencia no encontrado');
    await this.auditService.log({
      usuarioId: userId, usuarioNombre: userName,
      modulo: AuditModule.TIPOS_LICENCIA, accion: AuditAction.EDITAR,
      entidadId: id, valorAnterior: before.toObject(), valorNuevo: dto as any,
    });
    return type;
  }

  async remove(id: string, userId: string, userName: string): Promise<void> {
    const before = await this.findById(id);
    const result = await this.licenseTypeModel.findByIdAndUpdate(id, { deletedAt: new Date() }).exec();
    if (!result) throw new NotFoundException('Tipo de licencia no encontrado');
    await this.auditService.log({
      usuarioId: userId, usuarioNombre: userName,
      modulo: AuditModule.TIPOS_LICENCIA, accion: AuditAction.ELIMINAR,
      entidadId: id, valorAnterior: before.toObject(),
    });
  }

  async seedDefaults(): Promise<void> {
    const count = await this.licenseTypeModel.countDocuments();
    if (count === 0) {
      const defaults = [
        { nombre: 'Vacaciones',             descripcion: 'Vacaciones anuales',                      color: '#4CAF50', categoria: 'vacaciones',           diasMaximosPorAnio: 0 },
        { nombre: 'Enfermedad C/R',         descripcion: 'Parte médico por enfermedad con reposo',  color: '#F44336', categoria: 'partemedico',           diasMaximosPorAnio: 0, requiereJustificacion: true },
        { nombre: 'Enfermedad L/O',         descripcion: 'Parte médico por enfermedad leve/observación', color: '#FF7043', categoria: 'partemedico',      diasMaximosPorAnio: 0, requiereJustificacion: true },
        { nombre: 'Accidente',              descripcion: 'Parte médico por accidente',               color: '#FF9800', categoria: 'partemedicoaccidente', diasMaximosPorAnio: 0, requiereJustificacion: true },
        { nombre: 'Estudios',               descripcion: 'Licencia por examen o estudio',            color: '#2196F3', categoria: 'normal',               diasMaximosPorAnio: 10 },
        { nombre: 'Inciso 9',               descripcion: 'Justificación de falta sin aviso previo',  color: '#9C27B0', categoria: 'inciso9',              diasMaximosPorAnio: 0 },
        { nombre: 'Familiar Enfermedad',    descripcion: 'Licencia por enfermedad de familiar',      color: '#00BCD4', categoria: 'normal',               diasMaximosPorAnio: 0 },
        { nombre: 'Maternidad/Paternidad',  descripcion: 'Licencia por nacimiento',                  color: '#E91E63', categoria: 'normal',               diasMaximosPorAnio: 0 },
        { nombre: 'Fallecimiento familiar', descripcion: 'Licencia por duelo',                       color: '#607D8B', categoria: 'normal',               diasMaximosPorAnio: 0 },
        { nombre: 'Casamiento',             descripcion: 'Licencia por matrimonio',                  color: '#795548', categoria: 'normal',               diasMaximosPorAnio: 0 },
        { nombre: 'Sin goce de sueldo',     descripcion: 'Licencia sin retribución',                 color: '#9E9E9E', categoria: 'normal',               diasMaximosPorAnio: 0 },
        { nombre: 'Ley 9274',               descripcion: 'Licencia Ley 9274',                        color: '#3F51B5', categoria: 'normal',               diasMaximosPorAnio: 0 },
      ];
      await this.licenseTypeModel.insertMany(defaults);
      console.log('✅ Tipos de licencia por defecto creados');
    }
  }
}

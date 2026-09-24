import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument, AuditAction, AuditModule } from './schemas/audit.schema';

export interface LogParams {
  usuarioId: string;
  usuarioNombre: string;
  modulo: AuditModule;
  accion: AuditAction;
  entidadId: string;
  valorAnterior?: Record<string, any>;
  valorNuevo?: Record<string, any>;
}

@Injectable()
export class AuditService {
  constructor(@InjectModel(AuditLog.name) private auditModel: Model<AuditLogDocument>) {}

  async log(params: LogParams): Promise<void> {
    await this.auditModel.create({
      usuario:       new Types.ObjectId(params.usuarioId),
      usuarioNombre: params.usuarioNombre,
      modulo:        params.modulo,
      accion:        params.accion,
      entidadId:     params.entidadId,
      valorAnterior: params.valorAnterior,
      valorNuevo:    params.valorNuevo,
    });
  }

  async findAll(query?: { modulo?: string; usuarioId?: string; desde?: string; hasta?: string }) {
    const filter: any = {};
    if (query?.modulo)    filter.modulo  = query.modulo;
    if (query?.usuarioId) filter.usuario = new Types.ObjectId(query.usuarioId);
    if (query?.desde || query?.hasta) {
      filter.createdAt = {};
      if (query.desde) filter.createdAt.$gte = new Date(query.desde);
      if (query.hasta) filter.createdAt.$lte = new Date(query.hasta + 'T23:59:59');
    }
    return this.auditModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(500)
      .exec();
  }
}

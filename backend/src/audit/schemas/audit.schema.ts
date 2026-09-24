import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

export enum AuditAction {
  CREAR   = 'crear',
  EDITAR  = 'editar',
  ELIMINAR = 'eliminar',
}

export enum AuditModule {
  EMPLEADOS     = 'Empleados',
  LICENCIAS     = 'Licencias',
  TIPOS_LICENCIA = 'Tipos de Licencia',
  USUARIOS      = 'Usuarios',
  FERIADOS      = 'Feriados',
  AUSENCIAS     = 'Ausencias',
}

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  usuario: Types.ObjectId;

  @Prop({ required: true })
  usuarioNombre: string;

  @Prop({ type: String, enum: AuditModule, required: true })
  modulo: AuditModule;

  @Prop({ type: String, enum: AuditAction, required: true })
  accion: AuditAction;

  @Prop({ required: true })
  entidadId: string;

  @Prop({ type: Object })
  valorAnterior?: Record<string, any>;

  @Prop({ type: Object })
  valorNuevo?: Record<string, any>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ usuario: 1, createdAt: -1 });
AuditLogSchema.index({ modulo: 1, createdAt: -1 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LicenseDocument = License & Document;

export enum LicenseStatus {
  PENDIENTE = 'pendiente',
  APROBADA = 'aprobada',
  RECHAZADA = 'rechazada',
}

@Schema({ timestamps: true })
export class License {
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  empleado: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'LicenseType', required: true })
  tipoLicencia: Types.ObjectId;

  @Prop({ required: true })
  fechaInicio: Date;

  @Prop({ required: true })
  fechaFin: Date;

  @Prop({ default: 0 })
  cantidadDias: number;

  @Prop({ trim: true })
  observaciones: string;

  @Prop({ trim: true })
  nroExpediente: string;

  @Prop({ default: false })
  llegadaTarde: boolean;

  @Prop({ default: false })
  esAccidente: boolean; // solo aplica para categoria partemedico

  @Prop({ type: String, enum: LicenseStatus, default: LicenseStatus.APROBADA })
  estado: LicenseStatus;

  @Prop({ trim: true })
  justificacion: string; // archivo adjunto path o descripción

  @Prop({ type: Types.ObjectId, ref: 'User' })
  creadoPor: Types.ObjectId;

  @Prop({ default: null })
  deletedAt: Date | null;
}

export const LicenseSchema = SchemaFactory.createForClass(License);

// Índice para consultas por empleado + año/mes
LicenseSchema.index({ empleado: 1, fechaInicio: 1, fechaFin: 1 });

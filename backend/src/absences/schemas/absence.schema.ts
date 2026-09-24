import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AbsenceDocument = Absence & Document;

export enum AbsenceType {
  FALTA = 'falta',
  INASISTENCIA = 'inasistencia',
}

@Schema({ timestamps: true })
export class Absence {
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  empleado: Types.ObjectId;

  @Prop({ type: String, enum: AbsenceType, required: true })
  tipo: AbsenceType;

  @Prop({ required: true })
  fechaInicio: Date;

  @Prop({ required: true })
  fechaFin: Date;

  @Prop({ default: 1 })
  cantidadDias: number;

  @Prop({ trim: true })
  observaciones: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  creadoPor: Types.ObjectId;

  @Prop({ default: null })
  deletedAt: Date | null;
}

export const AbsenceSchema = SchemaFactory.createForClass(Absence);
AbsenceSchema.index({ empleado: 1, fechaInicio: 1 });

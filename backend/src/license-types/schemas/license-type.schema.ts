import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LicenseTypeDocument = LicenseType & Document;

export enum LicenseTypeCategoria {
  NORMAL = 'normal',
  PARTE_MEDICO = 'partemedico',
  PARTE_MEDICO_ACCIDENTE = 'partemedicoaccidente',
  INCISO_9 = 'inciso9',
  VACACIONES = 'vacaciones',
}

@Schema({ timestamps: true })
export class LicenseType {
  @Prop({ required: true, trim: true, unique: true })
  nombre: string;

  @Prop({ trim: true })
  descripcion: string;

  @Prop({ required: true })
  color: string; // Hex color para el grid, ej: "#4CAF50"

  @Prop({ default: true })
  activo: boolean;

  @Prop({ default: false })
  requiereJustificacion: boolean;

  @Prop({ default: 0 })
  diasMaximosPorAnio: number; // 0 = sin límite

  @Prop({ type: String, enum: LicenseTypeCategoria, default: LicenseTypeCategoria.NORMAL })
  categoria: LicenseTypeCategoria;

  @Prop({ default: null })
  deletedAt: Date | null;
}

export const LicenseTypeSchema = SchemaFactory.createForClass(LicenseType);

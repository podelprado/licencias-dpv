import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type HolidayDocument = Holiday & Document;

@Schema({ timestamps: true })
export class Holiday {
  @Prop({ required: true })
  fecha: Date;

  @Prop({ required: true, trim: true })
  descripcion: string;

  @Prop({ default: true })
  activo: boolean;

  @Prop({ default: null })
  deletedAt: Date | null;
}

export const HolidaySchema = SchemaFactory.createForClass(Holiday);
HolidaySchema.index({ fecha: 1 }, { unique: true });

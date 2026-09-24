import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ImportReportDocument = ImportReport & Document;

export interface ImportRowResult {
  fila: number;
  legajo: string;
  nombre: string;
  accion: 'creado' | 'actualizado' | 'error';
  detalle?: string;
}

@Schema({ timestamps: true })
export class ImportReport {
  @Prop({ required: true })
  archivo: string;

  @Prop({ required: true })
  usuario: string;

  @Prop({ required: true })
  usuarioNombre: string;

  @Prop({ default: 0 })
  totalFilas: number;

  @Prop({ default: 0 })
  creados: number;

  @Prop({ default: 0 })
  actualizados: number;

  @Prop({ default: 0 })
  errores: number;

  @Prop({ type: Array, default: [] })
  detalle: ImportRowResult[];
}

export const ImportReportSchema = SchemaFactory.createForClass(ImportReport);

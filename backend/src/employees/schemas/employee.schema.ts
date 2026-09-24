import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EmployeeDocument = Employee & Document;

@Schema({ timestamps: true })
export class Employee {
  @Prop({ required: true, trim: true })
  legajo: string;

  @Prop({ required: true, trim: true })
  nombre: string;

  @Prop({ required: true, trim: true })
  apellido: string;

  @Prop({ trim: true })
  dni: string;

  @Prop({ trim: true })
  cargo: string;

  @Prop({ trim: true })
  sector: string;

  @Prop({ trim: true })
  email: string;

  @Prop()
  fechaIngreso: Date;

  // Campos del formulario físico
  @Prop({ trim: true })
  funcion: string;

  @Prop({ trim: true })
  dpto: string;

  @Prop({ trim: true })
  zona: string;

  @Prop({ trim: true })
  division: string;

  @Prop({ trim: true })
  adscripto: string;

  @Prop({ trim: true })
  campania: string;

  @Prop({ trim: true })
  relacionLaboral: string;

  @Prop({ trim: true })
  regimen: string;

  @Prop({ trim: true })
  desarraigo: string;

  @Prop({ trim: true })
  fechaClave: string;

  @Prop({ trim: true })
  dedicacion: string;

  @Prop({ trim: true })
  viatico: string;

  @Prop({ trim: true })
  viaticoA: string;

  @Prop({ trim: true })
  viaticoB: string;

  @Prop({ default: true })
  activo: boolean;

  @Prop({ default: null })
  deletedAt: Date | null;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);
EmployeeSchema.index({ legajo: 1 }, { unique: true });
EmployeeSchema.index({ deletedAt: 1 });

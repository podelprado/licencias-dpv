import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AppConfigDocument = AppConfig & Document;

@Schema()
export class AppConfig {
  @Prop({ required: true, unique: true })
  clave: string;

  @Prop({ required: true })
  expira: Date;
}

export const AppConfigSchema = SchemaFactory.createForClass(AppConfig);

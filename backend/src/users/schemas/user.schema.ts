import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '../../common/decorators/roles.decorator';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.VIEWER })
  role: UserRole;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: null })
  deletedAt: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);

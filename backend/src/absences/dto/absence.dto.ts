import { IsDateString, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AbsenceType } from '../schemas/absence.schema';

export class CreateAbsenceDto {
  @IsMongoId()
  @IsNotEmpty()
  empleado: string;

  @IsEnum(AbsenceType)
  @IsNotEmpty()
  tipo: AbsenceType;

  @IsDateString()
  @IsNotEmpty()
  fechaInicio: string;

  @IsDateString()
  @IsNotEmpty()
  fechaFin: string;

  @IsString()
  @IsOptional()
  observaciones?: string;
}

export class UpdateAbsenceDto {
  @IsEnum(AbsenceType)
  @IsOptional()
  tipo?: AbsenceType;

  @IsDateString()
  @IsOptional()
  fechaInicio?: string;

  @IsDateString()
  @IsOptional()
  fechaFin?: string;

  @IsString()
  @IsOptional()
  observaciones?: string;
}

import { IsDateString, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { LicenseStatus } from '../schemas/license.schema';

export class CreateLicenseDto {
  @IsMongoId()
  @IsNotEmpty()
  empleado: string;

  @IsMongoId()
  @IsNotEmpty()
  tipoLicencia: string;

  @IsDateString()
  @IsNotEmpty()
  fechaInicio: string;

  @IsDateString()
  @IsNotEmpty()
  fechaFin: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  cantidadDias?: number;

  @IsString()
  @IsOptional()
  observaciones?: string;

  @IsString()
  @IsOptional()
  nroExpediente?: string;

  @IsOptional()
  llegadaTarde?: boolean;

  @IsOptional()
  esAccidente?: boolean;

  @IsEnum(LicenseStatus)
  @IsOptional()
  estado?: LicenseStatus;

  @IsString()
  @IsOptional()
  justificacion?: string;
}

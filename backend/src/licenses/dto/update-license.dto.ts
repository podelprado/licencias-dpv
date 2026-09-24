import { IsDateString, IsEnum, IsMongoId, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { LicenseStatus } from '../schemas/license.schema';

export class UpdateLicenseDto {
  @IsMongoId()
  @IsOptional()
  tipoLicencia?: string;

  @IsDateString()
  @IsOptional()
  fechaInicio?: string;

  @IsDateString()
  @IsOptional()
  fechaFin?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  cantidadDias?: number;

  @IsString()
  @IsOptional()
  observaciones?: string;

  @IsEnum(LicenseStatus)
  @IsOptional()
  estado?: LicenseStatus;

  @IsString()
  @IsOptional()
  justificacion?: string;
}

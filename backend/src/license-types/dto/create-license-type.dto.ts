import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { LicenseTypeCategoria } from '../schemas/license-type.schema';

export class CreateLicenseTypeDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsNotEmpty()
  color: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @IsBoolean()
  @IsOptional()
  requiereJustificacion?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  diasMaximosPorAnio?: number;

  @IsEnum(LicenseTypeCategoria)
  @IsOptional()
  categoria?: LicenseTypeCategoria;
}

import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateLicenseTypeDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  color?: string;

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
}

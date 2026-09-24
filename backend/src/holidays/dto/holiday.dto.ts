import { IsDateString, IsNotEmpty, IsOptional, IsString, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHolidayDto {
  @IsDateString() @IsNotEmpty()
  fecha: string;

  @IsString() @IsNotEmpty()
  descripcion: string;

  @IsBoolean() @IsOptional()
  activo?: boolean;
}

export class CreateHolidayBulkDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateHolidayDto)
  feriados: CreateHolidayDto[];
}

export class UpdateHolidayDto {
  @IsDateString() @IsOptional()
  fecha?: string;

  @IsString() @IsOptional()
  descripcion?: string;

  @IsBoolean() @IsOptional()
  activo?: boolean;
}

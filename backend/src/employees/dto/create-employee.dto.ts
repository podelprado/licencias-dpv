import { IsBoolean, IsDateString, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEmployeeDto {
  @IsString() @IsNotEmpty()
  legajo: string;

  @IsString() @IsNotEmpty()
  nombre: string;

  @IsString() @IsNotEmpty()
  apellido: string;

  @IsString() @IsOptional()
  dni?: string;

  @IsString() @IsOptional()
  cargo?: string;

  @IsString() @IsOptional()
  sector?: string;

  @IsEmail() @IsOptional()
  email?: string;

  @IsDateString() @IsOptional()
  fechaIngreso?: string;

  @IsString() @IsOptional()
  funcion?: string;

  @IsString() @IsOptional()
  dpto?: string;

  @IsString() @IsOptional()
  zona?: string;

  @IsString() @IsOptional()
  division?: string;

  @IsString() @IsOptional()
  adscripto?: string;

  @IsString() @IsOptional()
  campania?: string;

  @IsString() @IsOptional()
  relacionLaboral?: string;

  @IsString() @IsOptional()
  regimen?: string;

  @IsString() @IsOptional()
  desarraigo?: string;

  @IsString() @IsOptional()
  fechaClave?: string;

  @IsString() @IsOptional()
  dedicacion?: string;

  @IsString() @IsOptional()
  viatico?: string;

  @IsString() @IsOptional()
  viaticoA?: string;

  @IsString() @IsOptional()
  viaticoB?: string;

  @IsBoolean() @IsOptional()
  activo?: boolean;
}

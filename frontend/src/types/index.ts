export type UserRole = 'admin' | 'manager' | 'viewer';

export interface User {
  _id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: string;
}

export interface Employee {
  _id: string;
  legajo: string;
  nombre: string;
  apellido: string;
  dni?: string;
  cargo?: string;
  sector?: string;
  email?: string;
  fechaIngreso?: string;
  // Campos del formulario físico
  funcion?: string;
  division?: string;
  dpto?: string;
  zona?: string;
  adscripto?: string;
  campania?: string;
  relacionLaboral?: string;
  regimen?: string;
  desarraigo?: string;
  fechaClave?: string;
  dedicacion?: string;
  viatico?: string;
  viaticoA?: string;
  viaticoB?: string;
  activo: boolean;
  createdAt?: string;
}

export type LicenseTypeCategoria = 'normal' | 'partemedico' | 'partemedicoaccidente' | 'inciso9' | 'vacaciones';

export interface LicenseType {
  _id: string;
  nombre: string;
  descripcion?: string;
  color: string;
  activo: boolean;
  requiereJustificacion: boolean;
  diasMaximosPorAnio: number;
  categoria: LicenseTypeCategoria;
}

export type LicenseStatus = 'pendiente' | 'aprobada' | 'rechazada';

export interface License {
  _id: string;
  empleado: Employee | string;
  tipoLicencia: LicenseType | string;
  fechaInicio: string;
  fechaFin: string;
  cantidadDias: number;
  observaciones?: string;
  nroExpediente?: string;
  llegadaTarde?: boolean;
  estado: LicenseStatus;
  esAccidente?: boolean;
  justificacion?: string;
  creadoPor?: string;
  createdAt?: string;
}

export interface LicenseSummary {
  nombre: string;
  color: string;
  dias: number;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface ApiError {
  message: string;
  statusCode: number;
}

export type AbsenceType = 'falta' | 'inasistencia';

export interface Absence {
  _id: string;
  empleado: Employee | string;
  tipo: AbsenceType;
  fechaInicio: string;
  fechaFin: string;
  cantidadDias: number;
  observaciones?: string;
  creadoPor?: string;
  createdAt?: string;
}

export interface PresentismoMes {
  mes: number;
  tienePresentismo: boolean;
  motivo: string | null;
}

export interface ImportRowResult {
  fila: number;
  legajo: string;
  nombre: string;
  accion: 'creado' | 'actualizado' | 'error';
  detalle?: string;
}

export interface ImportReport {
  _id: string;
  archivo: string;
  usuario: string;
  usuarioNombre: string;
  totalFilas: number;
  creados: number;
  actualizados: number;
  errores: number;
  detalle: ImportRowResult[];
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  usuario: string;
  usuarioNombre: string;
  modulo: string;
  accion: 'crear' | 'editar' | 'eliminar';
  entidadId: string;
  valorAnterior?: Record<string, any>;
  valorNuevo?: Record<string, any>;
  createdAt: string;
}

export interface Holiday {
  _id: string;
  fecha: string;
  descripcion: string;
  activo: boolean;
}

export interface SaldoPool {
  pool: number;
  tomados: number;
  restantes: number;
}

export interface Saldo {
  sinFechaIngreso: boolean;
  aniosAntiguedad?: number;
  diasPool?: number;
  vacaciones?: SaldoPool;
  licencias?: SaldoPool;
}

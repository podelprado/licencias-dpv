import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as XLSX from 'xlsx';
import { Employee, EmployeeDocument } from './schemas/employee.schema';
import { ImportReport, ImportReportDocument, ImportRowResult } from './schemas/import-report.schema';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditModule } from '../audit/schemas/audit.schema';

const COLUMN_MAP: Record<string, string> = {
  'legajo': 'legajo', 'nombre': 'nombre', 'apellido': 'apellido', 'dni': 'dni',
  'cargo': 'cargo', 'sector': 'sector', 'email': 'email',
  'fechaingreso': 'fechaIngreso', 'fecha ingreso': 'fechaIngreso',
  'funcion': 'funcion', 'función': 'funcion',
  'division': 'division', 'división': 'division',
  'dpto': 'dpto',
  'zona': 'zona',
  'adscripo': 'adscripto', 'adscripto': 'adscripto',
  'relacion laboral': 'relacionLaboral', 'relación laboral': 'relacionLaboral', 'relacionlaboral': 'relacionLaboral',
  'regimen': 'regimen', 'régimen': 'regimen',
  'campania': 'campania', 'camaña': 'campania',
  'desarraigo': 'desarraigo',
  'fechaclave': 'fechaClave', 'fecha clave': 'fechaClave',
  'dedicacion': 'dedicacion', 'dedicación': 'dedicacion',
  'viatico': 'viatico', 'viático': 'viatico',
  'viatico a': 'viaticoA', 'viático a': 'viaticoA', 'viaticoa': 'viaticoA',
  'viatico b': 'viaticoB', 'viático b': 'viaticoB', 'viaticob': 'viaticoB',
};

@Injectable()
export class EmployeesService {
  constructor(
    @InjectModel(Employee.name) private employeeModel: Model<EmployeeDocument>,
    @InjectModel(ImportReport.name) private importReportModel: Model<ImportReportDocument>,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateEmployeeDto, userId: string, userName: string): Promise<EmployeeDocument> {
    const exists = await this.employeeModel.findOne({ legajo: dto.legajo, deletedAt: null });
    if (exists) throw new ConflictException(`Legajo ${dto.legajo} ya existe`);
    const employee = await new this.employeeModel({ ...dto, deletedAt: null }).save();
    await this.auditService.log({
      usuarioId: userId, usuarioNombre: userName,
      modulo: AuditModule.EMPLEADOS, accion: AuditAction.CREAR,
      entidadId: employee._id.toString(), valorNuevo: dto as any,
    });
    return employee;
  }

  async findAll(query?: { activo?: boolean; search?: string }): Promise<EmployeeDocument[]> {
    const filter: any = { deletedAt: null };
    if (query?.activo !== undefined) filter.activo = query.activo;
    if (query?.search) {
      const rx = new RegExp(query.search, 'i');
      filter.$or = [{ nombre: rx }, { apellido: rx }, { legajo: rx }, { dni: rx }];
    }
    return this.employeeModel.find(filter).sort({ apellido: 1, nombre: 1 }).exec();
  }

  async findById(id: string): Promise<EmployeeDocument> {
    const employee = await this.employeeModel.findOne({ _id: id, deletedAt: null }).exec();
    if (!employee) throw new NotFoundException('Empleado no encontrado');
    return employee;
  }

  async findByLegajo(legajo: string): Promise<EmployeeDocument> {
    const employee = await this.employeeModel.findOne({ legajo, deletedAt: null }).exec();
    if (!employee) throw new NotFoundException('Empleado no encontrado');
    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto, userId: string, userName: string): Promise<EmployeeDocument> {
    const before = await this.findById(id);
    const employee = await this.employeeModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!employee) throw new NotFoundException('Empleado no encontrado');
    await this.auditService.log({
      usuarioId: userId, usuarioNombre: userName,
      modulo: AuditModule.EMPLEADOS, accion: AuditAction.EDITAR,
      entidadId: id, valorAnterior: before.toObject(), valorNuevo: dto as any,
    });
    return employee;
  }

  async remove(id: string, userId: string, userName: string): Promise<void> {
    const before = await this.findById(id);
    const result = await this.employeeModel.findByIdAndUpdate(id, { deletedAt: new Date() }).exec();
    if (!result) throw new NotFoundException('Empleado no encontrado');
    await this.auditService.log({
      usuarioId: userId, usuarioNombre: userName,
      modulo: AuditModule.EMPLEADOS, accion: AuditAction.ELIMINAR,
      entidadId: id, valorAnterior: before.toObject(),
    });
  }

  async importFromBuffer(buffer: Buffer, fileName: string, userId: string, userName: string): Promise<ImportReportDocument> {
    const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

    const detalle: ImportRowResult[] = [];
    let creados = 0, actualizados = 0, errores = 0;

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i];
      // Normalizar claves
      const data: any = {};
      for (const [k, v] of Object.entries(raw)) {
        const mapped = COLUMN_MAP[k.toLowerCase().trim()];
        if (mapped) data[mapped] = v;
      }

      const legajo = String(data.legajo || '').trim();
      const nombre = String(data.nombre || '').trim();
      const apellido = String(data.apellido || '').trim();

      if (!legajo || !nombre || !apellido) {
        errores++;
        detalle.push({ fila: i + 2, legajo: legajo || '?', nombre: `${apellido} ${nombre}`.trim(), accion: 'error', detalle: 'Legajo, nombre y apellido son requeridos' });
        continue;
      }

      // Parsear fechaIngreso si viene como string
      if (data.fechaIngreso && !(data.fechaIngreso instanceof Date)) {
        const d = new Date(data.fechaIngreso);
        data.fechaIngreso = isNaN(d.getTime()) ? undefined : d;
      }

      try {
        const existing = await this.employeeModel.findOne({ legajo, deletedAt: null });
        if (existing) {
          await this.employeeModel.findByIdAndUpdate(existing._id, data);
          actualizados++;
          detalle.push({ fila: i + 2, legajo, nombre: `${apellido}, ${nombre}`, accion: 'actualizado' });
        } else {
          await new this.employeeModel({ ...data, deletedAt: null }).save();
          creados++;
          detalle.push({ fila: i + 2, legajo, nombre: `${apellido}, ${nombre}`, accion: 'creado' });
        }
      } catch (e: any) {
        errores++;
        detalle.push({ fila: i + 2, legajo, nombre: `${apellido}, ${nombre}`, accion: 'error', detalle: e.message });
      }
    }

    return this.importReportModel.create({
      archivo: fileName, usuario: userId, usuarioNombre: userName,
      totalFilas: rows.length, creados, actualizados, errores, detalle,
    });
  }

  async getImportReports(): Promise<ImportReportDocument[]> {
    return this.importReportModel.find().sort({ createdAt: -1 }).limit(50).exec();
  }

  async getImportReport(id: string): Promise<ImportReportDocument> {
    const report = await this.importReportModel.findById(id).exec();
    if (!report) throw new NotFoundException('Reporte no encontrado');
    return report;
  }

  generateTemplate(): Buffer {
    const headers = [
      'legajo', 'nombre', 'apellido', 'dni', 'cargo', 'sector', 'email',
      'fechaIngreso', 'funcion', 'division', 'dpto', 'zona', 'adscripo',
      'Relacion Laboral', 'Regimen', 'desarraigo', 'fechaClave', 'dedicacion', 'viatico A', 'viatico B',
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      headers,
      ['EJ001', 'Juan', 'Pérez', '12345678', 'Técnico', 'Sistemas', 'juan@ejemplo.com', '2020-01-15', '', '', '', '', '', 'Activo', 'Casa Central', '', '', '', '', ''],
    ]);
    ws['!cols'] = headers.map(() => ({ wch: 18 }));
    XLSX.utils.book_append_sheet(wb, ws, 'Empleados');
    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }
}

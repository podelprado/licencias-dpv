import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditModule } from '../audit/schemas/audit.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateUserDto, userId?: string, userName?: string): Promise<UserDocument> {
    const exists = await this.userModel.findOne({
      $or: [{ username: dto.username }, { email: dto.email }], deletedAt: null,
    });
    if (exists) throw new ConflictException('Usuario o email ya existe');
    const hash = await bcrypt.hash(dto.password, 10);
    const user = await new this.userModel({ ...dto, password: hash, deletedAt: null }).save();
    if (userId && userName) {
      const { password: _, ...safe } = dto as any;
      await this.auditService.log({
        usuarioId: userId, usuarioNombre: userName,
        modulo: AuditModule.USUARIOS, accion: AuditAction.CREAR,
        entidadId: user._id.toString(), valorNuevo: safe,
      });
    }
    return user;
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find({ deletedAt: null }).select('-password').exec();
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ _id: id, deletedAt: null }).select('-password').exec();
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username, isActive: true, deletedAt: null }).exec();
  }

  async update(id: string, dto: UpdateUserDto, userId: string, userName: string): Promise<UserDocument> {
    const before = await this.findById(id);
    if (dto.password) dto.password = await bcrypt.hash(dto.password, 10);
    const user = await this.userModel.findByIdAndUpdate(id, dto, { new: true }).select('-password').exec();
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const { password: _, ...safe } = dto as any;
    await this.auditService.log({
      usuarioId: userId, usuarioNombre: userName,
      modulo: AuditModule.USUARIOS, accion: AuditAction.EDITAR,
      entidadId: id, valorAnterior: before.toObject(), valorNuevo: safe,
    });
    return user;
  }

  async remove(id: string, userId: string, userName: string): Promise<void> {
    const before = await this.findById(id);
    const result = await this.userModel.findByIdAndUpdate(id, { deletedAt: new Date() }).exec();
    if (!result) throw new NotFoundException('Usuario no encontrado');
    await this.auditService.log({
      usuarioId: userId, usuarioNombre: userName,
      modulo: AuditModule.USUARIOS, accion: AuditAction.ELIMINAR,
      entidadId: id, valorAnterior: before.toObject(),
    });
  }

  async seedAdmin(): Promise<void> {
    const admin = await this.userModel.findOne({ username: 'admin' });
    if (!admin) {
      const hash = await bcrypt.hash('Admin1234!', 10);
      await this.userModel.create({
        username: 'admin', password: hash, fullName: 'Administrador',
        email: 'admin@licencias.local', role: 'admin', isActive: true, deletedAt: null,
      });
      console.log('✅ Usuario admin creado: admin / Admin1234!');
    }
  }
}

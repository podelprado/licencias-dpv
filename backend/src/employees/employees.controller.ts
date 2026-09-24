import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post()
  create(@Body() dto: CreateEmployeeDto, @CurrentUser() user: any) {
    return this.employeesService.create(dto, user._id.toString(), user.fullName);
  }

  @Get()
  findAll(@Query('search') search?: string, @Query('activo') activo?: string) {
    const query: any = {};
    if (activo !== undefined) query.activo = activo === 'true';
    if (search) query.search = search;
    return this.employeesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeesService.findById(id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto, @CurrentUser() user: any) {
    return this.employeesService.update(id, dto, user._id.toString(), user.fullName);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.employeesService.remove(id, user._id.toString(), user.fullName);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    return this.employeesService.importFromBuffer(file.buffer, file.originalname, user._id.toString(), user.fullName);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Get('imports')
  getImportReports() {
    return this.employeesService.getImportReports();
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Get('imports/:id')
  getImportReport(@Param('id') id: string) {
    return this.employeesService.getImportReport(id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Get('import/template')
  downloadTemplate(@Res() res: Response) {
    const buffer = this.employeesService.generateTemplate();
    res.setHeader('Content-Disposition', 'attachment; filename=plantilla_empleados.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  }
}

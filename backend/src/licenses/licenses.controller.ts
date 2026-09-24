import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LicensesService } from './licenses.service';
import { CreateLicenseDto } from './dto/create-license.dto';
import { UpdateLicenseDto } from './dto/update-license.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('licenses')
export class LicensesController {
  constructor(private readonly licensesService: LicensesService) {}

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post()
  create(@Body() dto: CreateLicenseDto, @CurrentUser() user: any) {
    return this.licensesService.create(dto, user._id.toString(), user.fullName);
  }

  @Get()
  findAll(
    @Query('empleado') empleado?: string,
    @Query('anio') anio?: string,
    @Query('mes') mes?: string,
    @Query('estado') estado?: string,
  ) {
    return this.licensesService.findAll({
      empleado,
      anio: anio ? parseInt(anio) : undefined,
      mes: mes ? parseInt(mes) : undefined,
      estado,
    });
  }

  @Get('summary/:empleadoId/:anio')
  getSummary(@Param('empleadoId') empleadoId: string, @Param('anio') anio: string) {
    return this.licensesService.getSummaryByYear(empleadoId, parseInt(anio));
  }

  @Get('saldo/:empleadoId/:anio')
  getSaldo(
    @Param('empleadoId') empleadoId: string,
    @Param('anio') anio: string,
    @Query('fechaIngreso') fechaIngreso?: string,
  ) {
    return this.licensesService.getSaldo(
      empleadoId,
      parseInt(anio),
      fechaIngreso ? new Date(fechaIngreso) : undefined,
    );
  }

  @Get('presentismo/:empleadoId/:anio')
  getPresentismo(
    @Param('empleadoId') empleadoId: string,
    @Param('anio') anio: string,
  ) {
    return this.licensesService.getPresentismo(empleadoId, parseInt(anio));
  }

  @Get('employee/:empleadoId/month/:anio/:mes')
  findByMonth(
    @Param('empleadoId') empleadoId: string,
    @Param('anio') anio: string,
    @Param('mes') mes: string,
  ) {
    return this.licensesService.findByEmployeeAndMonth(
      empleadoId,
      parseInt(anio),
      parseInt(mes),
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.licensesService.findById(id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLicenseDto, @CurrentUser() user: any) {
    return this.licensesService.update(id, dto, user._id.toString(), user.fullName);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.licensesService.remove(id, user._id.toString(), user.fullName);
  }
}

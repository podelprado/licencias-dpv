import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AbsencesService } from './absences.service';
import { CreateAbsenceDto, UpdateAbsenceDto } from './dto/absence.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('absences')
export class AbsencesController {
  constructor(private readonly absencesService: AbsencesService) {}

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post()
  create(@Body() dto: CreateAbsenceDto, @CurrentUser() user: any) {
    return this.absencesService.create(dto, user._id.toString(), user.fullName);
  }

  @Get()
  findAll(@Query('empleado') empleado?: string, @Query('anio') anio?: string, @Query('mes') mes?: string) {
    return this.absencesService.findAll({
      empleado,
      anio: anio ? parseInt(anio) : undefined,
      mes: mes ? parseInt(mes) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.absencesService.findById(id); }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAbsenceDto, @CurrentUser() user: any) {
    return this.absencesService.update(id, dto, user._id.toString(), user.fullName);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.absencesService.remove(id, user._id.toString(), user.fullName);
  }
}

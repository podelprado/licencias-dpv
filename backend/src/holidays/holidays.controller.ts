import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { HolidaysService } from './holidays.service';
import { CreateHolidayDto, CreateHolidayBulkDto, UpdateHolidayDto } from './dto/holiday.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('holidays')
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post()
  create(@Body() dto: CreateHolidayDto, @CurrentUser() user: any) {
    return this.holidaysService.create(dto, user._id.toString(), user.fullName);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post('bulk')
  bulkCreate(@Body() dto: CreateHolidayBulkDto, @CurrentUser() user: any) {
    return this.holidaysService.bulkCreate(dto.feriados, user._id.toString(), user.fullName);
  }

  @Get()
  findAll(@Query('anio') anio?: string) {
    return this.holidaysService.findAll(anio ? parseInt(anio) : undefined);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateHolidayDto, @CurrentUser() user: any) {
    return this.holidaysService.update(id, dto, user._id.toString(), user.fullName);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.holidaysService.remove(id, user._id.toString(), user.fullName);
  }
}

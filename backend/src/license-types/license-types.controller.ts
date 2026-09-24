import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LicenseTypesService } from './license-types.service';
import { CreateLicenseTypeDto } from './dto/create-license-type.dto';
import { UpdateLicenseTypeDto } from './dto/update-license-type.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('license-types')
export class LicenseTypesController {
  constructor(private readonly licenseTypesService: LicenseTypesService) {}

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateLicenseTypeDto, @CurrentUser() user: any) {
    return this.licenseTypesService.create(dto, user._id.toString(), user.fullName);
  }

  @Get()
  findAll(@Query('activo') activo?: string) {
    return this.licenseTypesService.findAll(activo === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.licenseTypesService.findById(id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLicenseTypeDto, @CurrentUser() user: any) {
    return this.licenseTypesService.update(id, dto, user._id.toString(), user.fullName);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.licenseTypesService.remove(id, user._id.toString(), user.fullName);
  }
}

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll(
    @Query('modulo')    modulo?: string,
    @Query('usuarioId') usuarioId?: string,
    @Query('desde')     desde?: string,
    @Query('hasta')     hasta?: string,
  ) {
    return this.auditService.findAll({ modulo, usuarioId, desde, hasta });
  }
}

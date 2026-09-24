import { Body, Controller, Get, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AppConfigService } from './app-config.service';
import { IS_PUBLIC_KEY } from '../common/guards/jwt-auth.guard';
import { SetMetadata } from '@nestjs/common';

const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Controller('admin')
export class AppConfigController {
  constructor(private readonly service: AppConfigService) {}

  @Public()
  @Get('status')
  getStatus() {
    return this.service.getStatus();
  }

  @Public()
  @Post('unlock')
  @HttpCode(HttpStatus.OK)
  async unlock(@Body() body: { clave: string; dias?: number }) {
    const ok = await this.service.unlock(body.clave, body.dias ?? 15);
    if (!ok) return { ok: false, mensaje: 'Clave incorrecta' };
    return { ok: true, mensaje: `App habilitada por ${body.dias ?? 15} días` };
  }
}

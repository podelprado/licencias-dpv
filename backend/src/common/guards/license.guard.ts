import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { AppConfigService } from '../../app-config/app-config.service';

const PUBLIC_PATHS = ['/api/auth/login', '/api/admin/status', '/api/admin/unlock'];

@Injectable()
export class LicenseGuard implements CanActivate {
  constructor(private readonly appConfigService: AppConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const path: string = request.path;

    if (PUBLIC_PATHS.some((p) => path.startsWith(p))) return true;

    const activa = await this.appConfigService.isActiva();
    if (!activa) {
      throw new HttpException('Licencia expirada', HttpStatus.PAYMENT_REQUIRED);
    }
    return true;
  }
}

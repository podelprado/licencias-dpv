import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { LicenseTypesService } from './license-types/license-types.service';
import { AppConfigService } from './app-config/app-config.service';
import { LicenseGuard } from './common/guards/license.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS para el frontend React (Electron)
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'app://.' ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Guard global de licencia
  const appConfigService = app.get(AppConfigService);
  app.useGlobalGuards(new LicenseGuard(appConfigService));

  app.setGlobalPrefix('api');

  // Seed datos iniciales
  const usersService = app.get(UsersService);
  const licenseTypesService = app.get(LicenseTypesService);
  await usersService.seedAdmin();
  await licenseTypesService.seedDefaults();

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Backend corriendo en http://localhost:${port}/api`);
}

bootstrap();

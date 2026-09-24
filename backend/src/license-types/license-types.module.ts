import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LicenseTypesService } from './license-types.service';
import { LicenseTypesController } from './license-types.controller';
import { LicenseType, LicenseTypeSchema } from './schemas/license-type.schema';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: LicenseType.name, schema: LicenseTypeSchema }]),
    AuditModule,
  ],
  providers: [LicenseTypesService],
  controllers: [LicenseTypesController],
  exports: [LicenseTypesService],
})
export class LicenseTypesModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LicensesService } from './licenses.service';
import { LicensesController } from './licenses.controller';
import { License, LicenseSchema } from './schemas/license.schema';
import { HolidaysModule } from '../holidays/holidays.module';
import { AbsencesModule } from '../absences/absences.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: License.name, schema: LicenseSchema }]),
    HolidaysModule,
    AbsencesModule,
    AuditModule,
  ],
  providers: [LicensesService],
  controllers: [LicensesController],
  exports: [LicensesService],
})
export class LicensesModule {}

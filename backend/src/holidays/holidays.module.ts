import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Holiday, HolidaySchema } from './schemas/holiday.schema';
import { HolidaysService } from './holidays.service';
import { HolidaysController } from './holidays.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Holiday.name, schema: HolidaySchema }]), AuditModule],
  providers: [HolidaysService],
  controllers: [HolidaysController],
  exports: [HolidaysService],
})
export class HolidaysModule {}

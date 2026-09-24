import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Absence, AbsenceSchema } from './schemas/absence.schema';
import { AbsencesService } from './absences.service';
import { AbsencesController } from './absences.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Absence.name, schema: AbsenceSchema }]), AuditModule],
  controllers: [AbsencesController],
  providers: [AbsencesService],
  exports: [AbsencesService],
})
export class AbsencesModule {}

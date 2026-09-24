import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EmployeesModule } from './employees/employees.module';
import { LicensesModule } from './licenses/licenses.module';
import { LicenseTypesModule } from './license-types/license-types.module';
import { AuditModule } from './audit/audit.module';
import { AppConfigModule } from './app-config/app-config.module';
import { AbsencesModule } from './absences/absences.module';
import { HolidaysModule } from './holidays/holidays.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI', 'mongodb://localhost:27017/licencias-dpv'),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    EmployeesModule,
    LicensesModule,
    LicenseTypesModule,
    HolidaysModule,
    AbsencesModule,
    AuditModule,
    AppConfigModule,
  ],
})
export class AppModule {}

import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createHmac } from 'crypto';
import { AppConfig, AppConfigDocument } from './schemas/app-config.schema';

const SECRET_BASE = process.env.LICENSE_SECRET || 'DPV-Licencias-XK92';
const CONFIG_KEY = 'licencia';

@Injectable()
export class AppConfigService implements OnModuleInit {
  constructor(
    @InjectModel(AppConfig.name) private model: Model<AppConfigDocument>,
  ) {}

  async onModuleInit() {
    // Si no existe el documento, crear con expiración en 7 días desde ahora
    const existing = await this.model.findOne({ clave: CONFIG_KEY });
    if (!existing) {
      const expira = new Date();
      expira.setDate(expira.getDate() + 7);
      await this.model.create({ clave: CONFIG_KEY, expira });
    }
  }

  async getStatus(): Promise<{ activa: boolean; expira: Date }> {
    const config = await this.model.findOne({ clave: CONFIG_KEY });
    if (!config) return { activa: false, expira: new Date(0) };
    return { activa: config.expira > new Date(), expira: config.expira };
  }

  async isActiva(): Promise<boolean> {
    const { activa } = await this.getStatus();
    return activa;
  }

  generateClave(): string {
    const now = new Date();
    const year = now.getFullYear();
    // Número de semana ISO
    const startOfYear = new Date(year, 0, 1);
    const week = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    const payload = `${SECRET_BASE}:${year}:${week}`;
    return createHmac('sha256', SECRET_BASE).update(payload).digest('hex').substring(0, 12).toUpperCase();
  }

  async unlock(clave: string, dias = 15): Promise<boolean> {
    const expected = this.generateClave();
    if (clave.toUpperCase() !== expected) return false;
    const expira = new Date();
    expira.setDate(expira.getDate() + dias);
    await this.model.updateOne({ clave: CONFIG_KEY }, { expira }, { upsert: true });
    return true;
  }
}

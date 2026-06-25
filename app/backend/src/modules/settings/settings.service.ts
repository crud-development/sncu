import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Settings, SettingsDocument } from './schemas/settings.schema';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Settings.name)
    private readonly model: Model<SettingsDocument>,
  ) {}

  /** Returnează singletonul de setări, creându-l cu default-uri dacă lipsește. */
  async get(): Promise<SettingsDocument> {
    const existing = await this.model.findOne().exec();
    if (existing) {
      return existing;
    }
    return this.model.create({});
  }

  async update(data: Partial<Settings>): Promise<SettingsDocument> {
    const settings = await this.get();
    Object.assign(settings, data);
    await settings.save();
    return settings;
  }

  /**
   * Alocă atomic următorul număr de contract și returnează seria + numărul.
   */
  async allocateContractNumber(): Promise<{ series: string; number: number }> {
    await this.get(); // asigură existența documentului.
    const updated = await this.model
      .findOneAndUpdate({}, { $inc: { contractNextNumber: 1 } }, { new: false })
      .exec();
    return {
      series: updated!.contractSeries,
      number: updated!.contractNextNumber,
    };
  }

  /** Alocă atomic următorul număr de comandă. */
  async allocateOrderNumber(): Promise<{ series: string; number: number }> {
    await this.get();
    const updated = await this.model
      .findOneAndUpdate({}, { $inc: { orderNextNumber: 1 } }, { new: false })
      .exec();
    return {
      series: updated!.orderSeries,
      number: updated!.orderNextNumber,
    };
  }
}

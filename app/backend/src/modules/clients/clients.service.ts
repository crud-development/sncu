import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Client, ClientDocument } from './schemas/client.schema';

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client.name) private readonly model: Model<ClientDocument>,
  ) {}

  create(data: Partial<Client>): Promise<ClientDocument> {
    return this.model.create(data);
  }

  findByEmail(email: string): Promise<ClientDocument | null> {
    return this.model.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  findById(id: string): Promise<ClientDocument | null> {
    return this.model.findById(id).exec();
  }

  findByActivationToken(token: string): Promise<ClientDocument | null> {
    return this.model.findOne({ activationToken: token }).exec();
  }

  async getOrFail(id: string): Promise<ClientDocument> {
    const doc = await this.findById(id);
    if (!doc) {
      throw new NotFoundException('Client inexistent');
    }
    return doc;
  }

  findAll(): Promise<ClientDocument[]> {
    return this.model.find().sort({ createdAt: -1 }).exec();
  }

  async updateProfile(
    id: string,
    data: Partial<Client>,
  ): Promise<ClientDocument> {
    const client = await this.getOrFail(id);
    Object.assign(client, data);
    await client.save();
    return client;
  }
}

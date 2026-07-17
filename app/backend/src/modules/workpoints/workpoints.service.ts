import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ClientsService } from '../clients/clients.service';
import { CreateWorkpointDto, UpdateWorkpointDto } from './dto/workpoint.dto';
import { Workpoint, WorkpointDocument } from './schemas/workpoint.schema';

@Injectable()
export class WorkpointsService {
  constructor(
    @InjectModel(Workpoint.name)
    private readonly model: Model<WorkpointDocument>,
    private readonly clients: ClientsService,
  ) {}

  list(clientId: string): Promise<WorkpointDocument[]> {
    return this.model.find({ clientId }).sort({ createdAt: 1 }).exec();
  }

  count(clientId: string): Promise<number> {
    return this.model.countDocuments({ clientId }).exec();
  }

  async create(
    clientId: string,
    dto: CreateWorkpointDto,
  ): Promise<WorkpointDocument> {
    const client = await this.clients.getOrFail(clientId);

    // Precompletare contact din cont dacă lipsește.
    const contactPerson =
      dto.contactPerson ??
      [client.contactFirstName, client.contactLastName]
        .filter(Boolean)
        .join(' ');

    return this.model.create({
      clientId: new Types.ObjectId(clientId),
      ...dto,
      contactPerson,
      contactPhone: dto.contactPhone ?? client.phone,
    });
  }

  async getOwned(
    clientId: string,
    id: string,
  ): Promise<WorkpointDocument> {
    const wp = await this.model.findById(id).exec();
    if (!wp) {
      throw new NotFoundException('Punct de lucru inexistent');
    }
    if (wp.clientId.toString() !== clientId) {
      throw new ForbiddenException('Acces interzis');
    }
    return wp;
  }

  async update(
    clientId: string,
    id: string,
    dto: UpdateWorkpointDto,
  ): Promise<WorkpointDocument> {
    const wp = await this.getOwned(clientId, id);
    Object.assign(wp, dto);
    await wp.save();
    return wp;
  }

  async remove(clientId: string, id: string): Promise<void> {
    const wp = await this.getOwned(clientId, id);
    if (wp.hasContract) {
      throw new BadRequestException(
        'Punctul are un contract asociat și nu poate fi șters.',
      );
    }
    await wp.deleteOne();
  }

  /** Returnează punctele fără contract (pentru pop-up-ul de generare). */
  listWithoutContract(clientId: string): Promise<WorkpointDocument[]> {
    return this.model
      .find({ clientId, hasContract: false })
      .sort({ createdAt: 1 })
      .exec();
  }

  async markContracted(ids: string[], value: boolean): Promise<void> {
    await this.model
      .updateMany({ _id: { $in: ids } }, { $set: { hasContract: value } })
      .exec();
  }
}

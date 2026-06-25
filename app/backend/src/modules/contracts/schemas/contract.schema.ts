import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type ContractDocument = HydratedDocument<Contract>;

export enum ContractStatus {
  DRAFT = 'Draft',
  SEMNAT = 'Semnat',
  ANULAT = 'Anulat',
  EXPIRAT = 'Expirat',
}

/** Snapshot al datelor la momentul generării, ca PDF-ul să rămână stabil. */
export interface ContractSnapshot {
  company: {
    companyName: string;
    cui: string;
    regCom?: string;
    address?: string;
    city?: string;
    judet?: string;
  };
  admin: {
    name?: string;
    idSeries?: string;
    idNumber?: string;
  };
  contact: {
    person?: string;
    email?: string;
    phone?: string;
  };
  workpoints: {
    denumire?: string;
    address: string;
    tipActivitate: string;
    sanitaryAuthNumber: string;
    contactPerson?: string;
    contactPhone?: string;
  }[];
}

@Schema({ timestamps: true })
export class Contract {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true,
  })
  clientId: Types.ObjectId;

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'Workpoint', default: [] })
  workpointIds: Types.ObjectId[];

  @Prop({ enum: ContractStatus, default: ContractStatus.DRAFT, index: true })
  status: ContractStatus;

  @Prop()
  series?: string;

  @Prop()
  number?: number;

  /** Serie + număr, alocat doar la semnare (ex: BEL-12). */
  @Prop()
  contractNo?: string;

  @Prop()
  signedAt?: Date;

  @Prop()
  expiresAt?: Date;

  /** Semnătura ca data URL PNG (base64). */
  @Prop()
  signatureDataUrl?: string;

  @Prop({ type: Object, required: true })
  snapshot: ContractSnapshot;
}

export const ContractSchema = SchemaFactory.createForClass(Contract);

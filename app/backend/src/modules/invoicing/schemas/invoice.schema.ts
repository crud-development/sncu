import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type InvoiceDocument = HydratedDocument<Invoice>;

export enum InvoiceStatus {
  ISSUED = 'issued',
  FAILED = 'failed',
}

export enum InvoiceKind {
  REGISTRATION = 'registration',
  EXTENSION = 'extension',
}

/** Factură Oblio (sau mock) — păstrată local pentru listă / retry din admin. */
@Schema({ timestamps: true })
export class Invoice {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Client',
    index: true,
  })
  clientId?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  companyName: string;

  @Prop({ required: true, trim: true, index: true })
  cui: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ enum: InvoiceKind, required: true, index: true })
  kind: InvoiceKind;

  @Prop({ enum: InvoiceStatus, required: true, index: true })
  status: InvoiceStatus;

  @Prop({ default: 1 })
  periodYears: number;

  @Prop({ required: true })
  amountNoVat: number;

  @Prop({ required: true })
  amountVat: number;

  @Prop({ required: true })
  amountTotal: number;

  @Prop()
  series?: string;

  @Prop()
  number?: string;

  @Prop()
  link?: string;

  @Prop({ default: false })
  mock: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Payment' })
  paymentId?: Types.ObjectId;

  @Prop()
  error?: string;

  @Prop()
  emailedAt?: Date;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);

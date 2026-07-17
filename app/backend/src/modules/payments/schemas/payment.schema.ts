import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type PaymentDocument = HydratedDocument<Payment>;

export enum PaymentRecordType {
  OP = 'OP',
  CARD = 'Card',
}

export enum PaymentKind {
  REGISTRATION = 'registration',
  EXTENSION = 'extension',
}

/** Înregistrare plată (OP manuală sau Card) — ex. prelungire contract. */
@Schema({ timestamps: true })
export class Payment {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true,
  })
  clientId: Types.ObjectId;

  @Prop({ enum: PaymentRecordType, required: true, index: true })
  type: PaymentRecordType;

  @Prop({ enum: PaymentKind, required: true })
  kind: PaymentKind;

  /** Durata prelungirii în ani. */
  @Prop({ required: true })
  periodYears: number;

  @Prop({ required: true })
  amountNoVat: number;

  @Prop({ required: true })
  amountTotal: number;

  @Prop()
  previousExpiresAt?: Date;

  @Prop({ required: true })
  newExpiresAt: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Contract' })
  contractId?: Types.ObjectId;

  @Prop()
  note?: string;

  @Prop({ required: true, default: () => new Date() })
  paidAt: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

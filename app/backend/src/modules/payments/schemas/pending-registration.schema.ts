import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PendingRegistrationDocument = HydratedDocument<PendingRegistration>;

/** Datele de înregistrare reținute între create-intent și confirmarea plății. */
@Schema({ timestamps: true })
export class PendingRegistration {
  @Prop({ required: true, unique: true, index: true })
  paymentIntentId: string;

  /** Stripe Subscription (abonament anual). */
  @Prop({ index: true })
  subscriptionId?: string;

  @Prop({ index: true })
  customerId?: string;

  @Prop({ type: Object, required: true })
  data: Record<string, unknown>;

  @Prop({ required: true })
  amountNoVat: number;

  @Prop({ required: true })
  amountTotal: number;

  @Prop({ default: false })
  completed: boolean;
}

export const PendingRegistrationSchema =
  SchemaFactory.createForClass(PendingRegistration);

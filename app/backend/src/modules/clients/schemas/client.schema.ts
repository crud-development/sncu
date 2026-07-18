import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ClientDocument = HydratedDocument<Client>;

export enum AccountStatus {
  INACTIV = 'inactiv',
  ACTIV = 'activ',
}

export enum PaymentType {
  CARD = 'Card',
  OP = 'OP',
}

export enum UserRole {
  CLIENT = 'client',
  ADMIN = 'admin',
}

@Schema({ timestamps: true })
export class Client {
  // ─── Date firmă ───
  @Prop({ required: true, trim: true })
  companyName: string;

  @Prop({ required: true, trim: true, index: true })
  cui: string;

  @Prop({ trim: true })
  regCom?: string;

  @Prop({ trim: true })
  address?: string;

  @Prop({ trim: true })
  city?: string;

  @Prop({ trim: true })
  judet?: string;

  @Prop({ trim: true })
  tipActivitate?: string;

  @Prop({ trim: true })
  ansvsaAuthorization?: string;

  // ─── Persoană de contact ───
  @Prop({ trim: true })
  contactFirstName?: string;

  @Prop({ trim: true })
  contactLastName?: string;

  @Prop({ required: true, lowercase: true, trim: true, unique: true, index: true })
  email: string;

  @Prop({ trim: true })
  phone?: string;

  // ─── Administrator (pt. contract) ───
  @Prop({ trim: true })
  adminName?: string;

  @Prop({ trim: true })
  adminIdSeries?: string;

  @Prop({ trim: true })
  adminIdNumber?: string;

  // ─── Cont ───
  @Prop()
  passwordHash?: string;

  @Prop({ enum: UserRole, default: UserRole.CLIENT })
  role: UserRole;

  @Prop({ enum: AccountStatus, default: AccountStatus.INACTIV })
  status: AccountStatus;

  @Prop({ enum: PaymentType, default: PaymentType.CARD })
  paymentType: PaymentType;

  /** Numărul de puncte de lucru plătite la înregistrare. */
  @Prop({ default: 1 })
  workpointsAllowed: number;

  @Prop()
  contractExpiresAt?: Date;

  /** Stripe Customer / Subscription (abonament anual Card). */
  @Prop({ index: true })
  stripeCustomerId?: string;

  @Prop({ index: true })
  stripeSubscriptionId?: string;

  // ─── Token activare / reset parolă ───
  @Prop({ index: true })
  activationToken?: string;

  @Prop()
  activationExpiresAt?: Date;
}

export const ClientSchema = SchemaFactory.createForClass(Client);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

export enum OrderStatus {
  PLASATA = 'Plasată',
  CONFIRMATA = 'Confirmată',
  ONORATA = 'Onorată',
  ANULATA = 'Anulată',
}

@Schema({ timestamps: true })
export class Order {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true,
  })
  clientId: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Workpoint',
    required: true,
  })
  workpointId: Types.ObjectId;

  /** Număr unic de referință (ex: CMD-12), alocat la plasare. */
  @Prop({ required: true, unique: true, index: true })
  orderNo: string;

  @Prop({ enum: OrderStatus, default: OrderStatus.PLASATA, index: true })
  status: OrderStatus;

  // ─── Detalii ridicare (US-06) ───
  @Prop({ required: true })
  desiredDate: Date;

  @Prop()
  timeInterval?: string;

  @Prop({ required: true })
  wasteName: string;

  @Prop({ required: true })
  origin: string;

  @Prop({ required: true })
  sncuCategory: string;

  @Prop({ required: true })
  estimatedQuantityKg: number;

  @Prop({ required: true })
  exactAddress: string;

  @Prop({ required: true })
  productState: string;

  @Prop()
  accountingValue?: number;

  @Prop()
  countryOfOrigin?: string;

  @Prop()
  producer?: string;

  @Prop()
  distributor?: string;

  @Prop({ required: true })
  packagingType: string;

  @Prop()
  activity?: string;

  @Prop()
  sanitaryAuthNumber?: string;

  @Prop()
  contactPerson?: string;

  @Prop()
  contactPhone?: string;

  @Prop()
  contactEmail?: string;

  /** Nr. Certificat CSV / Document Sechestru / Proces Verbal / Sigiliu / Emis de. */
  @Prop()
  csvDoc?: string;

  @Prop()
  observations?: string;

  // ─── Denormalizat pentru afișare în admin ───
  @Prop()
  companyName?: string;

  @Prop()
  cui?: string;

  /** Cost estimat completat manual de admin (US-07 / secțiunea 4). */
  @Prop()
  estimatedCost?: number;

  @Prop()
  cancelReason?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

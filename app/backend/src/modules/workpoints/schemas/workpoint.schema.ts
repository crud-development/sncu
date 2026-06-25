import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type WorkpointDocument = HydratedDocument<Workpoint>;

@Schema({ timestamps: true })
export class Workpoint {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true,
  })
  clientId: Types.ObjectId;

  /** Denumire — opțional (US-05). */
  @Prop({ trim: true })
  denumire?: string;

  /** Adresă completă — obligatoriu. */
  @Prop({ required: true, trim: true })
  address: string;

  /** Tip activitate (listă extinsă) — obligatoriu. */
  @Prop({ required: true, trim: true })
  tipActivitate: string;

  /** Persoană de contact — preluată din cont, modificabilă. */
  @Prop({ trim: true })
  contactPerson?: string;

  @Prop({ trim: true })
  contactPhone?: string;

  /** Nr. autorizație / document de înregistrare sanitar-veterinară — obligatoriu. */
  @Prop({ required: true, trim: true })
  sanitaryAuthNumber: string;

  /** True cât timp punctul nu are un contract activ/draft. */
  @Prop({ default: false })
  hasContract: boolean;
}

export const WorkpointSchema = SchemaFactory.createForClass(Workpoint);

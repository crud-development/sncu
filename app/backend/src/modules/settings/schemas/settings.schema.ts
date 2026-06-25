import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SettingsDocument = HydratedDocument<Settings>;

/** Document singleton cu setările platformei (editabile din panoul admin). */
@Schema({ timestamps: true })
export class Settings {
  @Prop({ default: 'BEL' })
  contractSeries: string;

  /** Următorul număr de contract de alocat la semnare. */
  @Prop({ default: 1 })
  contractNextNumber: number;

  @Prop({ default: () => new Date() })
  contractStartDate: Date;

  @Prop({ default: 'CMD' })
  orderSeries: string;

  /** Următorul număr de comandă de alocat la plasare. */
  @Prop({ default: 1 })
  orderNextNumber: number;

  // Linkuri template Google Docs (din analiză).
  @Prop({
    default:
      'https://docs.google.com/document/d/1MXxrJ92DTz60b2IEbr58eedXGrXOBMibI9QIBZnMRKE/edit',
  })
  contractTemplateUrl: string;

  @Prop({
    default:
      'https://docs.google.com/document/d/1kvCr8oaE2jszarXvsq-DvRfA4omWX9FI/edit',
  })
  orderTemplateUrl: string;

  @Prop({ default: '' })
  pvTemplateUrl: string;

  /** Corpul template-ului de contract folosit la randarea PDF. {{placeholder}}. */
  @Prop({ default: '' })
  contractTemplateText: string;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);

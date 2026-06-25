import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer | string; contentType?: string }[];
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('mail.host');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.config.get<number>('mail.port'),
        secure: this.config.get<number>('mail.port') === 465,
        auth: {
          user: this.config.get<string>('mail.user'),
          pass: this.config.get<string>('mail.pass'),
        },
      });
    } else {
      this.logger.warn(
        'SMTP neconfigurat — emailurile vor fi doar logate în consolă (mod dev).',
      );
    }
  }

  async send(msg: MailMessage): Promise<void> {
    const from = this.config.get<string>('mail.from');
    if (!this.transporter) {
      this.logger.log(`[MAIL→${msg.to}] ${msg.subject}`);
      return;
    }
    await this.transporter.sendMail({ from, ...msg });
  }

  /** Email de activare cont cu link unic. */
  async sendActivation(to: string, companyName: string, link: string): Promise<void> {
    await this.send({
      to,
      subject: 'Activează-ți contul BioEcoLab',
      html: this.layout(
        'Activează-ți contul',
        `<p>Bună, ${companyName}!</p>
         <p>Plata a fost confirmată. Pentru a-ți activa contul și a-ți seta parola, apasă butonul de mai jos. Linkul este valabil 24 de ore.</p>
         ${this.button(link, 'Activează contul')}`,
      ),
    });
  }

  /** Email de resetare parolă. */
  async sendPasswordReset(to: string, link: string): Promise<void> {
    await this.send({
      to,
      subject: 'Resetare parolă BioEcoLab',
      html: this.layout(
        'Resetare parolă',
        `<p>Ai cerut resetarea parolei. Apasă butonul de mai jos pentru a seta o parolă nouă.</p>
         ${this.button(link, 'Setează parola nouă')}
         <p style="color:#64748b;font-size:13px">Dacă nu tu ai cerut acest lucru, ignoră emailul.</p>`,
      ),
    });
  }

  /** Notificare către admin la semnarea unui contract. */
  async notifyAdminContractSigned(
    adminEmail: string,
    companyName: string,
    link: string,
  ): Promise<void> {
    await this.send({
      to: adminEmail,
      subject: `${companyName} a semnat contractul`,
      html: this.layout(
        'Contract semnat',
        `<p><strong>${companyName}</strong> a semnat contractul cadru.</p>
         ${this.button(link, 'Vezi contractul')}`,
      ),
    });
  }

  /** Trimite factura emisă (cu PDF atașat dacă există). */
  async sendInvoice(
    to: string,
    invoiceNo: string,
    total: number,
    pdf?: Buffer,
  ): Promise<void> {
    await this.send({
      to,
      subject: `Factura ${invoiceNo} — BioEcoLab`,
      html: this.layout(
        'Factura ta',
        `<p>Îți mulțumim! Plata a fost confirmată.</p>
         <p>Am emis factura <strong>${invoiceNo}</strong> în valoare de <strong>${total.toFixed(2)} lei</strong>.</p>
         <p>Vei primi separat și emailul de activare a contului.</p>`,
      ),
      attachments: pdf
        ? [{ filename: `${invoiceNo}.pdf`, content: pdf, contentType: 'application/pdf' }]
        : undefined,
    });
  }

  /** Confirmare plasare comandă către client. */
  async sendOrderPlaced(
    to: string,
    orderNo: string,
    details: string,
  ): Promise<void> {
    await this.send({
      to,
      subject: `Comandă ${orderNo} înregistrată`,
      html: this.layout(
        `Comanda ${orderNo} a fost plasată`,
        `<p>Am înregistrat comanda ta de ridicare SNCU. Statusul curent este <strong>Plasată</strong>.</p>
         <p>${details}</p>
         <p>Vei primi notificări pe email la fiecare schimbare de status.</p>`,
      ),
    });
  }

  /** Notificare schimbare status comandă. */
  async sendOrderStatus(
    to: string,
    orderNo: string,
    status: string,
    note?: string,
  ): Promise<void> {
    await this.send({
      to,
      subject: `Comandă ${orderNo} — ${status}`,
      html: this.layout(
        `Comanda ${orderNo}: ${status}`,
        `<p>Statusul comenzii tale s-a schimbat în <strong>${status}</strong>.</p>
         ${note ? `<p>${note}</p>` : ''}`,
      ),
    });
  }

  private button(href: string, label: string): string {
    return `<p style="margin:28px 0">
      <a href="${href}" style="background:#16a34a;color:#04130c;font-weight:700;text-decoration:none;padding:14px 26px;border-radius:999px;display:inline-block">${label}</a>
    </p>`;
  }

  private layout(title: string, body: string): string {
    return `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
      <div style="background:#04130c;color:#fff;padding:22px 28px;border-radius:14px 14px 0 0;font-weight:800;font-size:18px">BIOECOLAB</div>
      <div style="border:1px solid #e2e8f0;border-top:0;border-radius:0 0 14px 14px;padding:28px">
        <h2 style="margin:0 0 12px">${title}</h2>
        ${body}
      </div>
    </div>`;
  }
}

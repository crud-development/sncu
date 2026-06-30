import { Injectable, Logger } from '@nestjs/common';
import puppeteer from 'puppeteer-core';

/** Randează HTML → PDF folosind Chromium (puppeteer-core). */
@Injectable()
export class HtmlPdfService {
  private readonly logger = new Logger(HtmlPdfService.name);

  private executablePath(): string {
    if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
    if (process.platform === 'darwin') {
      return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    }
    return '/usr/bin/chromium';
  }

  async toPdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      executablePath: this.executablePath(),
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });
    try {
      const page = await browser.newPage();
      // `load` așteaptă imaginile (antet/logo) fără a se bloca pe conexiuni idle,
      // spre deosebire de `networkidle0` care poate atârna până la timeout.
      await page.setContent(html, { waitUntil: 'load', timeout: 20000 });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close().catch(() => undefined);
    }
  }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    env: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '3000', 10),
    appUrl: process.env.APP_URL ?? 'http://localhost:3000',
    publicSiteUrl: process.env.PUBLIC_SITE_URL ?? 'https://www.bioecolab.ro',
    mongoUri: process.env.MONGO_URI ??
        'mongodb://sncu:sncu@localhost:27017/sncu?authSource=admin',
    jwt: {
        secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
        expires: process.env.JWT_EXPIRES ?? '30d',
    },
    activationTtlHours: parseInt(process.env.ACTIVATION_TTL_HOURS ?? '24', 10),
    stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY ?? '',
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? '',
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
    },
    oblio: {
        email: process.env.OBLIO_EMAIL ?? '',
        apiToken: process.env.OBLIO_API_TOKEN ?? '',
        cif: process.env.OBLIO_CIF ?? '',
        invoiceSeries: process.env.OBLIO_INVOICE_SERIES ?? '',
    },
    mail: {
        host: process.env.SMTP_HOST ?? '',
        port: parseInt(process.env.SMTP_PORT ?? '587', 10),
        user: process.env.SMTP_USER ?? '',
        pass: process.env.SMTP_PASS ?? '',
        from: process.env.MAIL_FROM ?? 'BioEcoLab <noreply@bioecolab.ro>',
        adminEmail: process.env.ADMIN_EMAIL ?? 'office@bioecolab.ro',
    },
    pricing: {
        base: parseFloat(process.env.PRICE_BASE ?? '330'),
        extraWorkpoint: parseFloat(process.env.PRICE_EXTRA_WORKPOINT ?? '49.49'),
        includedWorkpoints: parseInt(process.env.INCLUDED_WORKPOINTS ?? '3', 10),
        vatRate: parseFloat(process.env.VAT_RATE ?? '0.19'),
    },
});
//# sourceMappingURL=configuration.js.map
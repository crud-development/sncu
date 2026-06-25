"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const express_1 = require("express");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use('/api/payments/webhook', (0, express_1.raw)({ type: '*/*' }));
    app.use((0, express_1.json)());
    app.setGlobalPrefix('api', { exclude: ['/'] });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    app.enableCors({ origin: true, credentials: true });
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    console.log(`SNCU API + SPA pe http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map
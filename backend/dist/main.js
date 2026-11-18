"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    app.enableCors({
        origin: configService.get('FRONTEND_ORIGIN', 'http://localhost:5173'),
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const port = Number(configService.get('PORT', '3000'));
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error('PORT precisa ser um número entre 1 e 65535.');
    }
    await app.listen(port);
}
void bootstrap();
//# sourceMappingURL=main.js.map
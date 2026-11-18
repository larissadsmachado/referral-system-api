import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: configService.get<string>(
      'FRONTEND_ORIGIN',
      'http://localhost:5173',
    ),
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(configService.get<string>('PORT', '3000'));
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT precisa ser um número entre 1 e 65535.');
  }

  await app.listen(port);
}
void bootstrap();

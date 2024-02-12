import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';

export const settings = {
  MONGO_URI:
    process.env.mongoURI ||
    'mongodb+srv://fsklever:popova12345@cluster0.su82uvr.mongodb.net/blog-dev?retryWrites=true&w=majority',
  JWT_SECRET: process.env.JWT_SECRET || '123',
};
export const accessTokenSecret1 = process.env.ACCESS_TOKEN || '123';
export const refreshTokenSecret2 = process.env.REFRESH_TOKEN || '789';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  await app.listen(3338);
}
bootstrap();

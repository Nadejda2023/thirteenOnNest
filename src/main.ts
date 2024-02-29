import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './exception.filter';
import cookieParser from 'cookie-parser';
import { useContainer } from 'class-validator';

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
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      stopAtFirstError: true,
      exceptionFactory: (errors: any[]) => {
        const errorsForResponse: { message: string; field: string }[] = [];

        errors.forEach((e) => {
          const constraintsKeys = Object.keys(e.constraints);
          constraintsKeys.forEach((ckey) => {
            errorsForResponse.push({
              message: e.constraints[ckey],
              field: e.property,
            });
          });
        });
        throw new BadRequestException(errorsForResponse);
      },
    }),
  ); //добавила глобально здесь пайп{ transform: true }
  app.useGlobalFilters(new HttpExceptionFilter());
  app.use(cookieParser());
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  //app.useGlobalGuards();
  await app.listen(3338);
}
bootstrap();

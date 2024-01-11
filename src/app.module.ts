import { Module } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { AppController } from './app.controller';
import { AppService } from './app.service';
//import { ConfigModule } from '@nestjs/config';
import { UsersController } from './users/users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogSchema, Blogs } from './blogs/dto/blogSchems';
import { BlogService } from './blogs/blogs.service';
import { BlogsController } from './blogs/blogs.controller';
import { BlogsRepository } from './blogs/blogs.repository';
import { BlogQueryRepo } from './blogs/blogs.query-repository';

dotenv.config();
@Module({
  imports: [
    // ConfigModule.forRoot({
    //   isGlobal: true, // Делаем доступным во всем приложении
    // }),
    MongooseModule.forRoot(process.env.MONGO_URL),
    MongooseModule.forFeature([
      {
        name: Blogs.name,
        schema: BlogSchema,
      },
    ]),
  ],
  controllers: [AppController, UsersController, BlogsController],
  providers: [AppService, BlogService, BlogsRepository, BlogQueryRepo],
})
export class AppModule {}

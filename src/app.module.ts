import { Module } from '@nestjs/common';
import dotenv from 'dotenv';
import { AppController } from './app.controller';
import { AppService } from './app.service';
//import { ConfigModule } from '@nestjs/config';
import { UsersController } from './users/users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogSchema, Blogs } from './models/blogSchems';
import { BlogService } from './blogs/blogs.service';
import { BlogsController } from './blogs/blogs.controller';
import { BlogsRepository } from './blogs/blogs.repository';
import { BlogQueryRepo } from './blogs/blogs.query-repository';
import { Posts, PostSchema } from './models/postSchema';
import { User, UserSchema } from './models/usersSchemas';
import { Comment, CommentSchema } from './models/commentSchemas';
import { PostsController } from './posts/posts.controller';
import { PostService } from './posts/posts.service';
import { PostsQueryRepository } from './posts/posts.query-repository';
import { PostsRepository } from './posts/posts.repository';
import { CommentController } from './comment/comment.controller';
import { CommentService } from './comment/comment.service';
import { UsersQueryRepository } from './users/users.queryRepository';
import { UserRepository } from './users/users.repository';
import { UserService } from './users/users.service';
import { EmailService } from './adapters/email-adapter';
import { CommentRepository } from './comment/comment.repository';
import { TestingService } from './Test-All-Data/testing.service';
import { TestingRepository } from './Test-All-Data/test-all-data.repository';
import { TestingController } from './Test-All-Data/testing.controller';
import { AuthService } from './auth/auth.service';
import { AuthRepository } from './auth/auth.repository';
import { AuthController } from './auth/auth.controller';
import { AuthGuard } from './guards/auth.middleware';
import { Auth, AuthSchema } from './models/authSchemas';
import { JwtService } from './application/jwt.service';
import { AuthorizationGuard } from './guards/auth.basic.guard';
import { UserEmailExistsValidator } from './customValidate/user.email.exists.validator';
import { UserLoginExistsValidator } from './customValidate/user.login.exist.valdator';
import { ThrottlerModule } from '@nestjs/throttler';

dotenv.config();
// export class AppModule {}
// export class CommentModule {}
// export class EmailModule {}
@Module({
  imports: [
    // ConfigModule.forRoot({
    //   isGlobal: true, // Делаем доступным во всем приложении
    // }),
    MongooseModule.forRoot(process.env.MONGO_URL || ''),
    MongooseModule.forFeature([
      {
        name: Blogs.name,
        schema: BlogSchema,
      },
    ]),
    MongooseModule.forFeature([{ name: Posts.name, schema: PostSchema }]),
    MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Auth.name, schema: AuthSchema }]),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 5,
      },
    ]),
  ],
  controllers: [
    AppController,
    UsersController,
    BlogsController,
    PostsController,
    CommentController,
    TestingController,
    UsersController,
    AuthController,
  ],
  providers: [
    AppService,
    BlogService,
    BlogsRepository,
    BlogQueryRepo,
    PostsRepository,
    PostService,
    PostsQueryRepository,
    CommentService,
    CommentRepository,
    UserService,
    UserRepository,
    UsersQueryRepository,
    TestingRepository,
    TestingService,
    AuthRepository,
    AuthService,
    EmailService,
    AuthGuard,
    JwtService,
    AuthorizationGuard,
    UserLoginExistsValidator,
    UserEmailExistsValidator,
  ],
  exports: [EmailService, CommentRepository],
})
export class AppModule {}
export class CommentModule {}
export class EmailModule {}

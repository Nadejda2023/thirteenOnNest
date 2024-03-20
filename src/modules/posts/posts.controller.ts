import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';

import {
  LikeStatus,
  LikeStatusTypePost,
  NewestLikeTypePost,
  PaginatedPost,
  PostViewModel2,
  PostsDBModels,
} from '../../models/postSchema';
import { PostService } from './posts.service';
import { PostsQueryRepository } from './posts.query-repository';
import { User, UsersModel } from '../../models/usersSchemas';
import { PostsRepository } from './posts.repository';
import { BlogQueryRepo } from '../blogs/blogs.query-repository';
import { BlogsRepository } from '../blogs/blogs.repository';
import { getPaginationFromQuery } from '../../hellpers/pagination';
import { CommandBus } from '@nestjs/cqrs';
import { UpdatePostLikeStatusCommand } from './usecase/post_like_status_use_case';
import { AuthGuard } from '../../guards/auth.middleware';
import { LikeStatusDto } from '../comment/dto/postslike_status_reaction_status.dto';
import { CommentRepository } from '../comment/comment.repository';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { AuthorizationGuard } from '../../guards/auth.basic.guard';
import { UserDecorator } from '../../infastructure/decorators/param/user.decorator';
import { CreateAndUpdatePostDto } from '../comment/dto/create.posts.dto';
import { UserSoftGuard } from '../../guards/user.middleware';
import { CreateCommentDto } from '../comment/dto/create.comment.dto';

@Controller('posts')
export class PostsController {
  constructor(
    //@InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel('User') private readonly userModel: Model<UsersModel>,
    private commandBus: CommandBus,
    protected postsService: PostService,
    private postsRepository: PostsRepository,
    protected blogQueryRepo: BlogQueryRepo,
    private postsQueryRepository: PostsQueryRepository,
    protected blogsRepository: BlogsRepository,
    //protected updatePostLikeStatusUseCase: UpdatePostLikeStatusUseCase,
    protected commentRepository: CommentRepository,
  ) {}
  @Put(':postId/like-status')
  @UseGuards(AuthGuard)
  @HttpCode(204)
  async updatePostWithLikeStatus(
    @Param('postId') postId: string,
    // @UserDecorator() user: User,
    @Req() req: Request,
    @Body() likeStatusDto: LikeStatusDto,
  ) {
    const user = (req as any).user;
    const existingPost: PostsDBModels | null =
      await this.postsService.findPostById(postId, user);
    if (!existingPost) {
      throw new NotFoundException();
    }

    const isReactionExist = existingPost.extendedLikesInfo.statuses.find(
      (s: LikeStatusTypePost) => s.userId === user!.id,
    );
    console.log('isReactionExist:', isReactionExist);

    if (isReactionExist) {
      if (
        likeStatusDto.likeStatus === 'Like' &&
        isReactionExist.myStatus === 'None'
      ) {
        isReactionExist.myStatus = LikeStatus.Like;
        existingPost.extendedLikesInfo.likesCount += 1;
      } else if (
        likeStatusDto.likeStatus === 'Like' &&
        isReactionExist.myStatus === 'Dislike'
      ) {
        isReactionExist.myStatus = LikeStatus.Like;
        existingPost.extendedLikesInfo.likesCount += 1;
        existingPost.extendedLikesInfo.dislikesCount -= 1;
      } else if (
        likeStatusDto.likeStatus === 'Dislike' &&
        isReactionExist.myStatus === 'None'
      ) {
        isReactionExist.myStatus = LikeStatus.Dislike;
        existingPost.extendedLikesInfo.dislikesCount += 1;
      } else if (
        likeStatusDto.likeStatus === 'Dislike' &&
        isReactionExist.myStatus === 'Like'
      ) {
        isReactionExist.myStatus = LikeStatus.Dislike;
        existingPost.extendedLikesInfo.likesCount -= 1;
        existingPost.extendedLikesInfo.dislikesCount += 1;
      } else if (
        likeStatusDto.likeStatus === 'None' &&
        isReactionExist.myStatus === 'Dislike'
      ) {
        isReactionExist.myStatus = LikeStatus.None;
        existingPost.extendedLikesInfo.dislikesCount -= 1;
      } else if (
        likeStatusDto.likeStatus === 'None' &&
        isReactionExist.myStatus === 'Like'
      ) {
        isReactionExist.myStatus = LikeStatus.None;
        existingPost.extendedLikesInfo.likesCount -= 1;
      }
    } else {
      if (likeStatusDto.likeStatus === 'Like') {
        existingPost.extendedLikesInfo.likesCount += 1;
        existingPost.extendedLikesInfo.statuses.push({
          myStatus: LikeStatus.Like,
          userId: user!.id,
          createdAt: new Date().toISOString(),
        });
      } else if (likeStatusDto.likeStatus === 'Dislike') {
        existingPost.extendedLikesInfo.dislikesCount += 1;
        existingPost.extendedLikesInfo.statuses.push({
          myStatus: LikeStatus.Dislike,
          userId: user!.id,
          createdAt: new Date().toISOString(),
        });
      } else if (likeStatusDto.likeStatus === 'None') {
        existingPost.extendedLikesInfo.statuses.push({
          myStatus: LikeStatus.None,
          userId: user!.id,
          createdAt: new Date().toISOString(),
        });
      }
    }

    const latestLikes = await Promise.all(
      existingPost.extendedLikesInfo.statuses
        .filter((like: LikeStatusTypePost) => like.myStatus === LikeStatus.Like)
        .sort(
          (a: LikeStatusTypePost, b: LikeStatusTypePost) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 3)
        .map(
          async (
            latestLikes: LikeStatusTypePost,
          ): Promise<NewestLikeTypePost> => {
            const user = await this.userModel.findOne(
              { id: latestLikes.userId },
              {
                projection: {
                  'extendedLikesInfo._id': 0,
                  'extendedLikesInfo.statuses._id': 0,
                  'extendedLikesInfo.newestLikes._id': 0,
                }, //PostsDBModels.getViewModel(user, foundPost)
              },
            );
            return {
              addedAt: latestLikes.createdAt,
              userId: latestLikes.userId,
              login: user?.login || 'Unknown',
            };
          },
        ),
    );

    const updatedPost = await this.commandBus.execute(
      new UpdatePostLikeStatusCommand(existingPost, latestLikes),
    );
    console.log('updatedPost:', updatedPost);
    if (!updatedPost) {
      //   return { status: 'updated' };
      // } else {
      throw new HttpException(
        'Unable to update post',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':postId/comments')
  @UseGuards(AuthGuard)
  async createCommentsPost(
    @Param('postId') postId: string,
    @Body() content: CreateCommentDto,
    @Req() req,
    @Res() res,
    @UserDecorator() user: User,
  ) {
    try {
      const postWithId = await this.postsRepository.findPostById(postId, user);

      if (!postWithId) {
        return res.sendStatus(HttpStatus.NOT_FOUND);
      }

      const comment = await this.postsService.createPostComment(
        postWithId.id,
        req.body.content,
        { userId: req.user.id, userLogin: req.user.login },
      );

      if (!comment) {
        return res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return res.status(HttpStatus.CREATED).json(comment);
    } catch (error) {
      return res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get()
  @UseGuards(UserSoftGuard) // soft bearer aut
  async getPostWithPagination(
    @Query('page') page: number,
    @Req() req,
    @Res() res,
    @UserDecorator() user: User,
  ) {
    const pagination = getPaginationFromQuery(req.query);

    try {
      const foundPost: PaginatedPost<PostViewModel2> =
        await this.blogQueryRepo.findAllPosts(pagination, user);

      if (!foundPost) {
        return res.sendStatus(404);
      } else {
        return res.status(200).json(foundPost);
      }
    } catch (error) {
      return res.sendStatus(500);
    }
  }

  @Get(':id')
  @UseGuards(UserSoftGuard)
  async getPostById(
    @Param('id') id: string,
    @Req() req,
    @Res() res,
    @UserDecorator() user: User,
  ) {
    const foundPost: PostsDBModels | null =
      await this.postsService.findPostById(id, user);

    if (foundPost !== null) {
      return res.status(200).json(PostsDBModels.getViewModel(user, foundPost));
    } else {
      return res.status(404).json({ message: 'Post not found' });
    }
  }
  @Post()
  @UseGuards(AuthorizationGuard)
  @HttpCode(201)
  async createPost(
    @Body() createPostDto: CreateAndUpdatePostDto,
    @Req() req,
    @UserDecorator() user: User,
  ): Promise<PostViewModel2 | null> {
    const blogId = createPostDto.blogId;
    await this.blogsRepository.findBlogById(blogId);

    // if (!findBlogforPosts) {
    //   throw new HttpException(
    //     'Unable to create a new post',
    //     HttpStatus.NOT_FOUND,
    //   );
    // }

    const newPost = await this.postsService.createPost(createPostDto, user);

    if (!newPost) {
      throw new BadRequestException([
        {
          message: 'failed to create posts',
          field: 'create posts',
        },
      ]);
    }

    return newPost;
  }
  @Put(':id')
  @UseGuards(AuthorizationGuard)
  async updatePost(
    @Param('id') id: string,
    @Body() updateData: CreateAndUpdatePostDto,
    @Res() res,
  ) {
    //const { title, shortDescription, content, blogId } = updateData;
    const updatePost = await this.postsService.updatePost(
      id,
      updateData.title,
      updateData.shortDescription,
      updateData.content,
      updateData.blogId,
    );

    if (!updatePost) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    }
    res.sendStatus(HttpStatus.NO_CONTENT);
  }

  @Delete(':id')
  @UseGuards(AuthorizationGuard)
  async deletePostById(@Param('id') id: string, @Req() req, @Res() res) {
    const foundPost = await this.postsService.deletePost(id);

    if (!foundPost) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    res.sendStatus(204);
  }
}

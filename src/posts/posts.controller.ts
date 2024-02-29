import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';

import {
  CreateAndUpdatePostDto,
  LikeStatus,
  LikeStatusTypePost,
  NewestLikeTypePost,
  PaginatedPost,
  PostViewModel2,
  PostsDBModels,
} from '../models/postSchema';
import { PostService } from './posts.service';
import { PostsQueryRepository } from './posts.query-repository';
import { getPaginationFromQuery } from 'src/hellpers/pagination';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../models/usersSchemas';
import { PostsRepository } from './posts.repository';
import { BlogQueryRepo } from '../blogs/blogs.query-repository';
import { BlogsRepository } from '../blogs/blogs.repository';

@Controller('posts')
export class PostsController {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    protected postsService: PostService,
    private postsRepository: PostsRepository,
    protected blogQueryRepo: BlogQueryRepo,
    private postsQueryRepository: PostsQueryRepository,
    protected blogsRepository: BlogsRepository,
    //protected commentRepository:CommentRepository,
  ) {}
  @Put(':postId/likes')
  async updatePostWithLikeStatus(
    @Param('postId') postId: string,
    @Req() req: any,
  ) {
    const user = req.user;
    const likeStat = req.body;

    const existingPost = await this.postsService.findPostById(postId, user);
    if (!existingPost) {
      throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    }

    const isReactionExist = existingPost.extendedLikesInfo.statuses.find(
      (s: LikeStatusTypePost) => s.userId === user!.id,
    );
    console.log('isReactionExist:', isReactionExist);

    if (isReactionExist) {
      if (
        likeStat.likeStatus === 'Like' &&
        isReactionExist.myStatus === 'None'
      ) {
        isReactionExist.myStatus = LikeStatus.Like;
        existingPost.extendedLikesInfo.likesCount += 1;
      } else if (
        likeStat.likeStatus === 'Like' &&
        isReactionExist.myStatus === 'Dislike'
      ) {
        isReactionExist.myStatus = LikeStatus.Like;
        existingPost.extendedLikesInfo.likesCount += 1;
        existingPost.extendedLikesInfo.dislikesCount -= 1;
      } else if (
        likeStat.likeStatus === 'Dislike' &&
        isReactionExist.myStatus === 'None'
      ) {
        isReactionExist.myStatus = LikeStatus.Dislike;
        existingPost.extendedLikesInfo.dislikesCount += 1;
      } else if (
        likeStat.likeStatus === 'Dislike' &&
        isReactionExist.myStatus === 'Like'
      ) {
        isReactionExist.myStatus = LikeStatus.Dislike;
        existingPost.extendedLikesInfo.likesCount -= 1;
        existingPost.extendedLikesInfo.dislikesCount += 1;
      } else if (
        likeStat.likeStatus === 'None' &&
        isReactionExist.myStatus === 'Dislike'
      ) {
        isReactionExist.myStatus = LikeStatus.None;
        existingPost.extendedLikesInfo.dislikesCount -= 1;
      } else if (
        likeStat.likeStatus === 'None' &&
        isReactionExist.myStatus === 'Like'
      ) {
        isReactionExist.myStatus = LikeStatus.None;
        existingPost.extendedLikesInfo.likesCount -= 1;
      }
    } else {
      if (likeStat.likeStatus === 'Like') {
        existingPost.extendedLikesInfo.likesCount += 1;
        existingPost.extendedLikesInfo.statuses.push({
          myStatus: LikeStatus.Like,
          userId: user!.id,
          createdAt: new Date().toISOString(),
        });
      } else if (likeStat.likeStatus === 'Dislike') {
        existingPost.extendedLikesInfo.dislikesCount += 1;
        existingPost.extendedLikesInfo.statuses.push({
          myStatus: LikeStatus.Dislike,
          userId: user!.id,
          createdAt: new Date().toISOString(),
        });
      } else if (likeStat.likeStatus === 'None') {
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

    const updatedPost = await this.postsService.updatePostLikeStatus(
      existingPost,
      latestLikes,
    );
    if (updatedPost) {
      return { status: 'updated' };
    } else {
      throw new HttpException(
        'Unable to update post',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':postId/comments')
  async createCommentsPost(
    @Param('postId') postId: string,
    @Body() content: string,
    @Req() req,
    @Res() res,
  ) {
    try {
      const user = req.user;
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
  async getPostWithPagination(
    @Query('page') page: number,
    @Req() req,
    @Res() res,
  ) {
    const user = req.user;
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
  async getPostById(@Param('id') id: string, @Req() req, @Res() res) {
    const user = req.user;
    const foundPost: PostsDBModels | null =
      await this.postsService.findPostById(id, user);

    if (foundPost !== null) {
      return res.status(200).json(PostsDBModels.getViewModel(user, foundPost));
    } else {
      return res.status(404).json({ message: 'Post not found' });
    }
  }
  @Post()
  async createPost(
    @Body() createPostDto: CreateAndUpdatePostDto,
    @Req() req,
  ): Promise<PostViewModel2 | null> {
    const blogId = createPostDto.blogId;
    await this.blogsRepository.findBlogById(blogId);
    const user = req.user;

    // if (!findBlogById) {
    //   throw new HttpException(
    //     'Unable to create a new post',
    //     HttpStatus.NOT_FOUND,
    //   );
    // }

    const newPost = await this.postsService.createPost(createPostDto, user);
    console.log('newPost:', newPost);

    if (!newPost) {
      throw new HttpException(
        'Unable to create a new post',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return newPost;
  }
  @Put(':id')
  async updatePost(@Param('id') id: string, @Body() updateData, @Res() res) {
    const { title, shortDescription, content, blogId } = updateData;
    const updatePost = await this.postsService.updatePost(
      id,
      title,
      shortDescription,
      content,
      blogId,
    );

    if (!updatePost) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    }
    res.sendStatus(HttpStatus.NO_CONTENT);
  }

  @Delete(':id')
  async deletePostById(@Param('id') id: string, @Req() req, @Res() res) {
    const foundPost = await this.postsService.deletePost(id);

    if (!foundPost) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    res.sendStatus(204);
  }
}

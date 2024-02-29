import { Injectable } from '@nestjs/common';
import { PostsRepository } from './posts.repository';
import { BlogsRepository } from '../blogs/blogs.repository';
import {
  CreateAndUpdatePostDto,
  LikeStatus,
  NewestLikeTypePost,
  PostDocument,
  PostViewModel2,
  Posts,
  PostsDBModels,
} from '../models/postSchema';
import { UsersModel } from '../models/usersSchemas';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PostsQueryRepository } from './posts.query-repository';
import { randomUUID } from 'crypto';
import {
  Comment,
  CommentDocument,
  commentViewType,
} from '../models/commentSchemas';

@Injectable()
export class PostService {
  constructor(
    @InjectModel(Posts.name) private postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    protected postsRepository: PostsRepository,
    protected blogsRepository: BlogsRepository,
    protected postsQueryRepository: PostsQueryRepository,
  ) {}

  async findAllPosts(): Promise<PostViewModel2[]> {
    return this.postsRepository.findAllPosts();
  }

  async findPostById(
    id: string,
    user: UsersModel | null,
  ): Promise<PostsDBModels | null> {
    return this.postsRepository.findPostById(id, user);
  }

  async createPost(
    createPostDto: CreateAndUpdatePostDto,
    user: UsersModel | null,
  ): Promise<PostViewModel2 | null> {
    const blog = await this.blogsRepository.findBlogById(createPostDto.blogId);
    if (!blog) {
      return null;
    }
    const newPost: PostViewModel2 = {
      id: randomUUID(),
      title: createPostDto.title,
      shortDescription: createPostDto.shortDescription,
      content: createPostDto.content,
      blogId: createPostDto.blogId,
      blogName: blog.name,
      createdAt: new Date().toISOString(),
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: LikeStatus.None,
        newestLikes: user
          ? [
              {
                addedAt: new Date().toISOString(),
                userId: user.id,
                login: user.login,
              },
            ]
          : [],
      },
    };
    const createdPost = await this.postsRepository.createPost(newPost, user);
    return createdPost;
  }

  async updatePost(
    id: string,
    title: string,
    shortDescription: string,
    content: string,
    blogId: string,
  ): Promise<boolean | undefined> {
    const result = await this.postModel.findOneAndUpdate(
      { id: id },
      {
        $set: {
          title: title,
          shortDescription: shortDescription,
          content: content,
          blogId: blogId,
        },
      },
      { new: true },
    );

    return result ? true : false;
  }
  async createPostComment(
    postId: string,
    content: string,
    commentatorInfo: { userId: string; userLogin: string },
  ): Promise<commentViewType> {
    const createCommentForPost = {
      id: randomUUID(),
      content,
      commentatorInfo,
      createdAt: new Date().toISOString(),
      postId,
      likesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: 'None',
      },
    };
    await this.commentModel.create(createCommentForPost);
    return {
      id: createCommentForPost.id,
      content: createCommentForPost.content,
      commentatorInfo: createCommentForPost.commentatorInfo,
      createdAt: createCommentForPost.createdAt,
      likesInfo: {
        likesCount: createCommentForPost.likesInfo.likesCount,
        dislikesCount: createCommentForPost.likesInfo.dislikesCount,
        myStatus: createCommentForPost.likesInfo.myStatus,
      },
    };
  }
  async updatePostLikeStatus(
    existingPost: PostsDBModels,
    latestLikes: NewestLikeTypePost[],
  ) {
    console.log(JSON.stringify(existingPost));
    try {
      const result = await this.postModel.updateOne(
        { id: existingPost.id },
        {
          $set: {
            'extendedLikesInfo.likesCount':
              existingPost.extendedLikesInfo.likesCount,
            'extendedLikesInfo.dislikesCount':
              existingPost.extendedLikesInfo.dislikesCount,
            'extendedLikesInfo.statuses':
              existingPost.extendedLikesInfo.statuses,
            'extendedLikesInfo.newestLikes': latestLikes,
          },
        },
      );
      console.log('result:', result);
      if (result === undefined) {
        return undefined;
      }
      return result.modifiedCount === 1;
    } catch (error) {
      console.error('Error updating post:', error);

      return undefined;
    }
  }
  async deletePost(id: string): Promise<boolean> {
    return this.postsRepository.deletePost(id);
  }

  async deleteAll(): Promise<boolean> {
    return await this.postsRepository.deleteAll();
  }
}

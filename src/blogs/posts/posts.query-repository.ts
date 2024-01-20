import { Injectable } from '@nestjs/common';
import {
  NewestLikeTypePost,
  PaginatedPost,
  PostDocument,
  PostViewModel2,
  Posts,
  PostsDBModels,
} from '../dto/postSchema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment } from '../dto/commentSchemas';
import {
  CommentDB,
  CommentDocument,
  PaginatedCommentViewModel,
  commentViewType,
} from '../dto/commentSchemas';
import { WithId } from 'mongodb';
import { TPagination } from 'src/hellpers/pagination';
import { randomUUID } from 'crypto';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectModel(Posts.name) private postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
  ) {}

  async findPosts(
    pagination: TPagination,
  ): Promise<PaginatedPost<PostViewModel2>> {
    const filter = {
      name: { $regex: pagination.searchNameTerm, $options: 'i' },
    };
    const result: WithId<WithId<PostViewModel2>>[] = await this.postModel
      .find(filter, { projection: { _id: 0 } })
      .sort({ [pagination.sortBy]: pagination.sortDirection })
      .skip(pagination.skip)
      .limit(pagination.pageSize)
      .lean();
    const totalCount = await this.postModel.countDocuments(filter);
    const pageCount = Math.ceil(totalCount / pagination.pageSize);

    return {
      pagesCount: pageCount,
      page: pagination.pageNumber,
      pageSize: pagination.pageSize,
      totalCount: totalCount,
      items: result,
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

  async getAllCommentsForPost(
    pagination: TPagination,
  ): Promise<PaginatedCommentViewModel<CommentDB>> {
    const filter = {
      name: { $regex: pagination.searchNameTerm, $options: 'i' },
    };
    const result: WithId<WithId<CommentDB>>[] = await this.commentModel
      .find(filter, { projection: { _id: 0 } })

      .sort({ [pagination.sortBy]: pagination.sortDirection })
      .skip(pagination.skip)
      .limit(pagination.pageSize)
      .lean();
    const totalCount: number = await this.commentModel.countDocuments(filter);
    const pageCount: number = Math.ceil(totalCount / pagination.pageSize);

    return {
      pagesCount: pageCount,
      page: pagination.pageNumber,
      pageSize: pagination.pageSize,
      totalCount: totalCount,
      items: result,
    };
  }
}

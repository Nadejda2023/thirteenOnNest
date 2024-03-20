import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { WithId } from 'mongodb';
import { InjectModel } from '@nestjs/mongoose';
import { TPagination } from '../../hellpers/pagination';
import {
  CommentDocument,
  PaginatedCommentViewModel,
  commentViewType,
  CommentDB,
} from '../../models/commentSchemas';
import { UsersModel } from '../../models/usersSchemas';

@Injectable()
export class CommentRepository {
  constructor(
    @InjectModel('Comment')
    private readonly commentModel: Model<CommentDocument>,
  ) {}

  async getAllCommentsForPost(
    postId: string,
    pagination: TPagination,
    user: UsersModel | null,
  ): Promise<PaginatedCommentViewModel<commentViewType>> {
    const result: WithId<CommentDB>[] = await this.commentModel
      .find({ postId }, { _id: 0, postId: 0 }) // filter
      .sort({ [pagination.sortBy]: pagination.sortDirection })
      .skip(pagination.skip)
      .limit(pagination.pageSize)
      .lean();

    const totalCount: number = await this.commentModel.countDocuments({
      postId,
    });
    const pageCount: number = Math.ceil(totalCount / pagination.pageSize);

    const response: PaginatedCommentViewModel<commentViewType> = {
      pagesCount: pageCount,
      page: pagination.pageNumber,
      pageSize: pagination.pageSize,
      totalCount: totalCount,
      items: result.map((item) => CommentDB.getViewModel(user, item)),
    };

    return response;
  }
  async findCommentById(commentId: string): Promise<CommentDB | null> {
    const comment: CommentDB | null = await this.commentModel.findOne({
      id: commentId,
    });
    if (!comment) {
      throw new NotFoundException('Комментарий не найден');
    }
    return comment;
  }
  async deleteAll(): Promise<boolean> {
    try {
      const result = await this.commentModel.deleteMany({});

      return result.acknowledged;
    } catch (e) {
      return false;
    }
  }
  async updateCommentLikeStatus(
    existingComment: CommentDB,
  ): Promise<CommentDB | undefined | boolean> {
    try {
      const result = await this.commentModel.updateOne(
        { id: existingComment.id },
        {
          $set: {
            'likesInfo.likesCount': existingComment.likesInfo.likesCount,
            'likesInfo.dislikesCount': existingComment.likesInfo.dislikesCount,
            'likesInfo.statuses': existingComment.likesInfo.statuses,
          },
        },
      );

      if (result === undefined) {
        return undefined;
      }
      return result.modifiedCount === 1;
    } catch (error) {
      console.error('Error updating comment:', error);

      return undefined;
    }
  }
  async updateComment(
    commentId: string,
    content: string,
  ): Promise<CommentDB | undefined | boolean> {
    const foundComment = await this.commentModel.findOne(
      { id: commentId },
      { projection: { _id: 0, postId: 0 } },
    );
    if (foundComment) {
      const result = await this.commentModel.updateOne(
        { id: commentId },
        { $set: { content: content } },
      ); //comentatorInfo: comentatorInfo
      return result.matchedCount === 1;
    }
  }
  async deleteComment(commentId: string) {
    const result = await this.commentModel.deleteOne({ id: commentId });
    return result.deletedCount === 1;
  }
}

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
  async findCommentById(commentId: string): Promise<commentViewType> {
    const comment: commentViewType | null = await this.commentModel.findOne({
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
}

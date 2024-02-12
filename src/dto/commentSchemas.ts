import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LikeStatus, LikeStatusType } from './postSchema';
import mongoose, { HydratedDocument } from 'mongoose';
import { UsersModel } from './usersSchemas';

@Schema()
export class Comment {
  //   @Prop({ required: true })
  //   id: string;
  @Prop({ required: true, unique: true, type: String })
  id: string;

  @Prop({ required: true })
  content: string;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
  })
  postId: string;

  @Prop({ required: true, type: Object })
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };

  @Prop({ required: true })
  createdAt: string;

  @Prop({
    required: true,
    type: [
      {
        myStatus: String,
        userId: String,
        createdAt: String,
      },
    ],
  })
  likesInfo: {
    likesCount: number;
    dislikesCount: number;
    statuses: LikeStatusType[];
  };
}

export type CommentDocument = HydratedDocument<Comment>;
export const CommentSchema = SchemaFactory.createForClass(Comment);

export type commentViewModel = {
  //id: string;
  content: string;
  postId: string;
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
  createdAt: string;
};

export interface commentViewType {
  id: string;
  content: string;
  //postId: string,
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
  createdAt: string;
  likesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: string;
  };
}

export class CommentDB {
  constructor(
    public id: string,
    public content: string,
    public postId: string,
    public commentatorInfo: {
      userId: string;
      userLogin: string;
    },
    public createdAt: string,
    public likesInfo: {
      statuses: LikeStatusType[];
      likesCount: number;
      dislikesCount: number;
      myStatus: string;
    },
  ) {}
  static getViewModel(
    user: UsersModel | null,
    comment: CommentDB,
  ): commentViewType {
    return {
      id: comment.id,
      content: comment.content,
      //postId: string,
      commentatorInfo: {
        userId: comment.commentatorInfo.userId,
        userLogin: comment.commentatorInfo.userLogin,
      },
      createdAt: comment.createdAt,
      likesInfo: {
        likesCount: comment.likesInfo.likesCount,
        dislikesCount: comment.likesInfo.dislikesCount,
        myStatus: user
          ? comment.likesInfo.statuses.find(
              (s: LikeStatusType) => s.userId === user!.id,
            )?.myStatus || LikeStatus.None
          : LikeStatus.None,
      },
    };
  }
  getViewModel(user: UsersModel | null): commentViewType {
    return {
      id: this.id,
      content: this.content,
      //postId: string,
      commentatorInfo: {
        userId: this.commentatorInfo.userId,
        userLogin: this.commentatorInfo.userLogin,
      },
      createdAt: this.createdAt,
      likesInfo: {
        likesCount: this.likesInfo.likesCount,
        dislikesCount: this.likesInfo.dislikesCount,
        myStatus: user
          ? this.likesInfo.statuses.find(
              (s: LikeStatusType) => s.userId === user!.id,
            )?.myStatus || LikeStatus.None
          : LikeStatus.None,
      },
    };
  }
}

export type PaginatedCommentViewModel<T> = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: T[];
};

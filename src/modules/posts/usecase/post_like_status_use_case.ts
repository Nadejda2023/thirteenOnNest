import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import {
  NewestLikeTypePost,
  PostDocument,
  Posts,
  PostsDBModels,
} from '../../../models/postSchema';
import { Model } from 'mongoose';

export class UpdatePostLikeStatusCommand {
  constructor(
    public existingPost: PostsDBModels,
    public latestLikes: NewestLikeTypePost[],
  ) {}
}

@Injectable()
export class UpdatePostLikeStatusUseCase {
  constructor(
    @InjectModel(Posts.name) private postModel: Model<PostDocument>,
    // @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
  ) {}

  async execute(
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
}

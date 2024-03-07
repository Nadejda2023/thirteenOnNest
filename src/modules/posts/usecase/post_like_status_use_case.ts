import { InjectModel } from '@nestjs/mongoose';

import {
  NewestLikeTypePost,
  PostDocument,
  Posts,
  PostsDBModels,
} from '../../../models/postSchema';
import { Model } from 'mongoose';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class UpdatePostLikeStatusCommand {
  constructor(
    public existingPost: PostsDBModels,
    public latestLikes: NewestLikeTypePost[],
  ) {}
}

@CommandHandler(UpdatePostLikeStatusCommand)
export class UpdatePostLikeStatusUseCase
  implements ICommandHandler<UpdatePostLikeStatusCommand>
{
  constructor(
    @InjectModel(Posts.name) private postModel: Model<PostDocument>,
    // @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
  ) {}

  async execute(command: UpdatePostLikeStatusCommand) {
    console.log(JSON.stringify(command.existingPost));
    try {
      const result = await this.postModel.updateOne(
        { id: command.existingPost.id },
        {
          $set: {
            'extendedLikesInfo.likesCount':
              command.existingPost.extendedLikesInfo.likesCount,
            'extendedLikesInfo.dislikesCount':
              command.existingPost.extendedLikesInfo.dislikesCount,
            'extendedLikesInfo.statuses':
              command.existingPost.extendedLikesInfo.statuses,
            'extendedLikesInfo.newestLikes': command.latestLikes,
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

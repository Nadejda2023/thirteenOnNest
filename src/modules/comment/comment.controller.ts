import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentRepository } from './comment.repository';
import { CommentDB } from '../../models/commentSchemas';
import { UserSoftGuard } from '../../guards/user.middleware';
import { AuthGuard } from '../../guards/auth.middleware';
import { LikeStatusDto } from './dto/postslike_status_reaction_status.dto';
import { LikeStatus, LikeStatusType } from '../../models/postSchema';

@Controller('comments')
export class CommentController {
  constructor(
    protected commentService: CommentService,
    protected commentRepository: CommentRepository,
  ) {}
  @UseGuards(UserSoftGuard)
  @Get(':commentId')
  async getCommentById(
    @Param('commentId', new ParseUUIDPipe()) commentId: string,
    @Req() req,
    @Res() res,
  ) {
    //const user = req.user;
    const foundComment: CommentDB | null =
      await this.commentRepository.findCommentById(commentId);

    if (foundComment) {
      return res.status(200).json(foundComment);
    } else {
      return res.status(404).send('Comment not found');
    }
  }
  @UseGuards(AuthGuard)
  @Put(':commentId/like-status')
  @HttpCode(204)
  async commentUpdateLikeStatus(
    @Param('commentId', new ParseUUIDPipe()) commentId: string,
    @Body() likeStatusDto: LikeStatusDto,
    @Req() req,
  ) {
    const user = req.user;

    //const existingComment = null
    const existingComment =
      await this.commentRepository.findCommentById(commentId);

    if (!existingComment) {
      throw new NotFoundException();
    }

    const isReactionExist = existingComment.likesInfo.statuses.find(
      (s: LikeStatusType) => s.userId === user!.id,
    );

    if (isReactionExist) {
      if (
        likeStatusDto.likeStatus === 'Like' &&
        isReactionExist.myStatus === 'None'
      ) {
        isReactionExist.myStatus = LikeStatus.Like;
        existingComment.likesInfo.likesCount += 1;
      } else if (
        likeStatusDto.likeStatus === 'Like' &&
        isReactionExist.myStatus === 'Dislike'
      ) {
        isReactionExist.myStatus = LikeStatus.Like;
        existingComment.likesInfo.likesCount += 1;
        existingComment.likesInfo.dislikesCount -= 1;
      } else if (
        likeStatusDto.likeStatus === 'Dislike' &&
        isReactionExist.myStatus === 'None'
      ) {
        isReactionExist.myStatus = LikeStatus.Dislike;
        existingComment.likesInfo.dislikesCount += 1;
      } else if (
        likeStatusDto.likeStatus === 'Dislike' &&
        isReactionExist.myStatus === 'Like'
      ) {
        isReactionExist.myStatus = LikeStatus.Dislike;
        existingComment.likesInfo.likesCount -= 1;
        existingComment.likesInfo.dislikesCount += 1;
      } else if (
        likeStatusDto.likeStatus === 'None' &&
        isReactionExist.myStatus === 'Dislike'
      ) {
        isReactionExist.myStatus = LikeStatus.None;
        existingComment.likesInfo.dislikesCount -= 1;
      } else if (
        likeStatusDto.likeStatus === 'None' &&
        isReactionExist.myStatus === 'Like'
      ) {
        isReactionExist.myStatus = LikeStatus.None;
        existingComment.likesInfo.likesCount -= 1;
      }
    } else {
      if (likeStatusDto.likeStatus === 'Like') {
        existingComment.likesInfo.likesCount += 1;
        existingComment.likesInfo.statuses.push({
          myStatus: LikeStatus.Like,
          userId: user!.id,
          createdAt: new Date().toISOString(),
        });
      } else if (likeStatusDto.likeStatus === 'Dislike') {
        existingComment.likesInfo.dislikesCount += 1;
        existingComment.likesInfo.statuses.push({
          myStatus: LikeStatus.Dislike,
          userId: user!.id,
          createdAt: new Date().toISOString(),
        });
      } else if (likeStatusDto.likeStatus === 'None') {
        existingComment.likesInfo.statuses.push({
          myStatus: LikeStatus.None,
          userId: user!.id,
          createdAt: new Date().toISOString(),
        });
      }
    }

    await this.commentService.updateCommentLikeStatus(existingComment);
  }
  @UseGuards(AuthGuard)
  @Put(':commentId')
  @HttpCode(204)
  async updateCommentById(
    @Param('commentId', new ParseUUIDPipe()) commentId: string,
    @Req() req,
    @Res() res,
  ) {
    const user = req.user!;

    const existingComment =
      await this.commentRepository.findCommentById(commentId);
    if (!existingComment) {
      throw new NotFoundException('Комментарий не найден');
    }

    if (existingComment.commentatorInfo.userId !== user.id) {
      return res.sendStatus(403);
    }

    return await this.commentService.updateComment(commentId, req.body.content);
  }
  @UseGuards(AuthGuard)
  @Delete(':commentId')
  @HttpCode(204)
  async deleteCommentById(
    @Param('commentId', new ParseUUIDPipe()) commentId: string,
    @Req() req,
    @Res() res,
  ) {
    const user = req.user!;
    const comment = await this.commentRepository.findCommentById(commentId);

    if (comment) {
      const commentUserId = comment.commentatorInfo.userId;
      if (commentUserId !== user.id) {
        return res.sendStatus(403);
      }
      await this.commentService.deleteComment(req.params.commentId);
    }
  }
}

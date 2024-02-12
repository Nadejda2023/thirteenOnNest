import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Req,
  Res,
} from '@nestjs/common';
import { commentViewType } from 'src/dto/commentSchemas';
import { CommentService } from './comment.service';
import { CommentRepository } from './comment.repository';

@Controller('comments')
export class CommentController {
  constructor(
    protected commentService: CommentService,
    protected commentRepository: CommentRepository,
  ) {}

  @Get(':commentId')
  async getCommentById(
    @Param('commentId', new ParseUUIDPipe()) commentId: string,
    @Req() req,
    @Res() res,
  ) {
    //const user = req.user;
    const foundComment: commentViewType =
      await this.commentRepository.findCommentById(commentId);

    if (foundComment) {
      return res.status(200).json(foundComment);
    } else {
      return res.status(404).send('Comment not found');
    }
  }
}

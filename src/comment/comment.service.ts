import { Injectable } from '@nestjs/common';
import { CommentRepository } from './comment.repository';
import { Comment, CommentDocument } from 'src/models/commentSchemas';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class CommentService {
  constructor(
    private readonly commentRepository: CommentRepository,
    @InjectModel(Comment.name) private blogModel: Model<CommentDocument>,
  ) {}
  async deleteAll(): Promise<boolean> {
    return await this.commentRepository.deleteAll();
  }
}

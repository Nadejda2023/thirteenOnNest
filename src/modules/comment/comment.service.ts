import { Injectable } from '@nestjs/common';
import { CommentRepository } from './comment.repository';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Comment } from '../../models/commentSchemas';
import { CommentDocument } from '../../models/commentSchemas';

@Injectable()
export class CommentService {
  constructor(
    private readonly commentRepository: CommentRepository,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
  ) {}
  async deleteAll(): Promise<boolean> {
    return await this.commentRepository.deleteAll();
  }
}

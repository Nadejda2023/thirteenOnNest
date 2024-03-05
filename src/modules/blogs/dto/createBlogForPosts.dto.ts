import { IsString, MaxLength } from 'class-validator';
import { Trim } from '../../../infastructure/decorators/transform/trim';

export class BlogPostDto {
  @MaxLength(30)
  @Trim()
  @IsString()
  title: string;
  @MaxLength(100)
  @Trim()
  @IsString()
  shortDescription: string;
  @MaxLength(1000)
  @Trim()
  @IsString()
  content: string;
}

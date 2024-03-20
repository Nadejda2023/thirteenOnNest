import { IsString, Length, MaxLength, MinLength } from 'class-validator';
import { Trim } from '../../../infastructure/decorators/transform/trim';

export class CreateAndUpdatePostDto {
  @MaxLength(30)
  @Trim()
  @IsString()
  title: string;
  @Length(1, 100)
  @Trim()
  @IsString()
  shortDescription: string;
  @Length(1, 1000)
  @Trim()
  @IsString()
  content: string;
  @MinLength(1)
  @Trim()
  @IsString()
  blogId: string;
}

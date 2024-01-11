import {
  Controller,
  HttpStatus,
  Injectable,
  Delete,
  HttpCode,
} from '@nestjs/common';
import { BlogService } from 'src/blogs/blogs.service';

@Injectable()
@Controller('testing')
export class TestingController {
  constructor(
    private readonly blogService: BlogService,
    //private readonly postService: PostService,
    //private readonly userService: UserService,
  ) {}

  @Delete('/all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAllData(): Promise<void> {
    await Promise.all([
      this.blogService.deleteAll(),
      //this.postService.deleteAll(),
    ]);
  }
}

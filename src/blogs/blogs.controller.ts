import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { BlogService } from './blogs.service';
import { BlogQueryRepo } from './blogs.query-repository';
import { BlogsViewModel, PaginatedBlog } from './dto/blogSchems';
import {
  getPaginationFromQuery,
  getSearchNameTermFromQuery,
} from 'src/hellpers/pagination';

@Controller('blogs')
export class BlogsController {
  constructor(
    private blogsService: BlogService,
    private blogQueryRepo: BlogQueryRepo,
  ) {}

  @Get()
  async getBlogs(@Query() query: any): Promise<PaginatedBlog<BlogsViewModel>> {
    const pagination = getPaginationFromQuery(query);
    const name = getSearchNameTermFromQuery(query.searchNameTerm);
    return this.blogQueryRepo.findBlogs({ ...pagination, ...name });
  }

  @Post()
  async createBlog(@Body() body: BlogsViewModel) {
    return this.blogsService.createBlog(
      body.name,
      body.description,
      body.websiteUrl,
    );
  }
  // @Get(':blogId/posts')
  // async getPostsByBlogId(
  //   @Param('blogId') blogId: string,
  //   @Query() query: any
  // ): Promise<PaginatedPost<PostViewModel2>> {
  //   const user = ...; // Получите пользователя, например, через Guard или другим способом
  //   const pagination = getPaginationFromQuery(query);

  //   return await this.blogQueryRepo.findPostForBlog(blogId, pagination, user);
  // }
  //     @Post()
  //     async createPostForBlog(@Req() req: Request, @Res() res: Response) {
  //       const blogWithId: BlogsViewModel| null = await blogsRepository.findBlogById(req.params.blogId)
  //       if(!blogWithId) {
  //         return res.sendStatus(404)

  //       }
  //       const user = req.user
  //         const blogsCreatePost: PostViewModel2 | null = await blogQueryRepo.createPostForBlog(req.body.title, req.body.shortDescription, req.body.content, req.params.blogId, user)
  //         if(blogsCreatePost) {
  //           return res.status(201).send(blogsCreatePost)

  //          }
  //       }
  @Get(':id')
  async getBlogById(@Param('id') id: string): Promise<BlogsViewModel | null> {
    console.log('Searching for blog with ID:', id);
    const foundBlog = await this.blogsService.findBlogById(id);
    if (!foundBlog) {
      throw new NotFoundException('Blog not found');
    }
    const blogViewModel: BlogsViewModel = {
      name: foundBlog.name,
      description: foundBlog.description,
      websiteUrl: foundBlog.websiteUrl,
      createdAt: foundBlog.createdAt,
      isMembership: foundBlog.isMembership,
      // Здесь копируются все необходимые свойства
    };

    return blogViewModel;
  }
  @Put(':id')
  async updateBlog(
    @Param('id') id: string,
    @Body() updateBlogDto: BlogsViewModel,
  ): Promise<boolean> {
    return await this.blogsService.updateBlog(
      id,
      updateBlogDto.name,
      updateBlogDto.description,
      updateBlogDto.websiteUrl,
    );
  }
  @Delete(':id')
  async deleteBlogById(@Param('id') id: string): Promise<void> {
    const success = await this.blogsService.deleteBlog(id);
    if (!success) {
      throw new NotFoundException('Blog not found');
    }
  }
}

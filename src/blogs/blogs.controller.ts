import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { BlogService } from './blogs.service';
import { BlogQueryRepo } from './blogs.query-repository';
import { BlogsViewModel, PaginatedBlog } from './dto/blogSchems';
import {
  getPaginationFromQuery,
  getSearchNameTermFromQuery,
} from 'src/hellpers/pagination';
import { PaginatedPost, PostViewModel2 } from './dto/postSchema';
import { BlogsRepository } from './blogs.repository';

@Controller('blogs')
export class BlogsController {
  constructor(
    private blogsService: BlogService,
    private blogQueryRepo: BlogQueryRepo,
    protected blogsRepository: BlogsRepository,
  ) {}

  @Get()
  async getBlogs(@Query() query: any): Promise<PaginatedBlog<BlogsViewModel>> {
    const pagination = getPaginationFromQuery(query);
    const name = getSearchNameTermFromQuery(query.searchNameTerm);
    return this.blogQueryRepo.findBlogs({ ...pagination, ...name });
  }

  @Post()
  async createBlog(@Body() body: BlogsViewModel) {
    const newBlog = await this.blogsService.createBlog(
      body.name,
      body.description,
      body.websiteUrl,
    );
    return newBlog;
  }

  @Get(':blogId/posts')
  async getPostsByBlogId(
    @Param('blogId') blogId: string,
    @Query() query: any,
    @Req() req,
  ): Promise<PaginatedPost<PostViewModel2>> {
    const user = req.user!;
    const blogPost: BlogsViewModel | null =
      await this.blogsRepository.findBlogById(req.params.blogId);
    if (!blogPost) {
      throw new NotFoundException(`Blog with ID ${blogId} not found`);
    }
    const pagination = getPaginationFromQuery(query);

    return await this.blogQueryRepo.findPostForBlog(blogId, pagination, user);
  }
  //@Post(':blogId')
  @Post(':blogId/posts')
  async createPostForBlog(
    @Param('blogId') blogId: string,
    @Req() req,
    @Res() res,
  ) {
    try {
      const blogWithId: BlogsViewModel | null =
        await this.blogsRepository.findBlogById(req.params.blogId);
      if (!blogWithId) {
        return res.sendStatus(HttpStatus.NOT_FOUND);
      }

      const user = req.user;
      const { title, shortDescription, content } = req.body;

      const blogsCreatePost = await this.blogsService.createPostForBlog(
        title,
        shortDescription,
        content,
        blogId,
        user,
      );

      if (blogsCreatePost) {
        return res.status(HttpStatus.CREATED).json(blogsCreatePost);
      } else {
        return res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
      }
    } catch (error) {
      console.log(error);
      throw new NotFoundException(`Blog with ID ${blogId} not found`);
    }
  }

  @Get(':id')
  async getBlogById(@Param('id') id: string): Promise<BlogsViewModel | null> {
    const foundBlog = await this.blogsService.findBlogById(id);
    if (!foundBlog) {
      throw new NotFoundException('Blog not found');
    }
    const blog: BlogsViewModel = {
      id: foundBlog.id,
      name: foundBlog.name,
      description: foundBlog.description,
      websiteUrl: foundBlog.websiteUrl,
      createdAt: foundBlog.createdAt,
      isMembership: foundBlog.isMembership,
    };

    return blog;
  }
  @Put(':id')
  async updateBlog(@Param('id') id: string, @Req() req, @Res() res) {
    const { name, description, websiteUrl } = req.body;

    const updatedBlog = await this.blogsService.updateBlog(
      id,
      name,
      description,
      websiteUrl,
    );

    if (!updatedBlog) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    }
    res.sendStatus(HttpStatus.NO_CONTENT);
  }

  @Delete(':id')
  async deleteBlogById(@Param('id') id: string, @Res() res) {
    const foundBlog = await this.blogsService.deleteBlog(id);
    if (!foundBlog) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    } else {
      return res.sendStatus(HttpStatus.NO_CONTENT);
    }
  }
}

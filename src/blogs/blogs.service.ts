import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { BlogDocument, Blogs, BlogsViewModel } from './dto/blogSchems';
import { BlogsRepository } from './blogs.repository';
import { BlogQueryRepo } from './blogs.query-repository';
import { randomUUID } from 'crypto';

@Injectable()
export class BlogService {
  constructor(
    @InjectModel(Blogs.name) private blogModel: Model<BlogDocument>,
    protected blogsRepository: BlogsRepository,
    protected blogQueryRepo: BlogQueryRepo,
  ) {}

  // async create(createBlogDto: any): Promise<Blogs> {
  //   const createdBlog = new this.blogModel(createBlogDto);
  //   return createdBlog.save();
  // }

  // async findAll(): Promise<Blogs[]> {
  //   return this.blogModel.find().exec();
  // }

  async findAllBlogs(title: string | null | undefined): Promise<Blogs[]> {
    const filter = {};
    if (title) {
      filter['title'] = { $regex: title, $options: 'i' };
    }
    return this.blogModel.find(filter).lean();
  }

  async findBlogById(id: string): Promise<BlogsViewModel | null> {
    return this.blogsRepository.findBlogById(id);
  }

  async createBlog(name: string, description: string, website: string) {
    const newBlog: Blogs = {
      id: randomUUID(),
      name: name,
      description: description,
      websiteUrl: website,
      createdAt: new Date().toISOString(),
      isMembership: false,
    };

    const createdBlog: Blogs = await this.blogsRepository.createBlog(newBlog);
    const resultBlog: BlogsViewModel = {
      id: createdBlog.id,
      name: createdBlog.name,
      description: createdBlog.description,
      websiteUrl: createdBlog.websiteUrl,
      createdAt: createdBlog.createdAt,
      isMembership: createdBlog.isMembership,
    };
    return resultBlog;
  }

  async updateBlog(
    id: string,
    name: string,
    description: string,
    website: string,
  ): Promise<boolean | undefined> {
    return await this.blogsRepository.updateBlog(
      id,
      name,
      description,
      website,
    );
  }

  async deleteBlog(_id: string) {
    return await this.blogsRepository.deleteBlog(_id);
  }

  async deleteAll(): Promise<boolean> {
    return await this.blogsRepository.deleteAll();
  }
}

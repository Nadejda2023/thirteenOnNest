import { Injectable } from '@nestjs/common';
import { BlogDocument, Blogs, BlogsViewModel } from './dto/blogSchems';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class BlogsRepository {
  constructor(
    @InjectModel(Blogs.name) private blogModel: Model<BlogDocument>,
  ) {}

  async findAllBlogs(
    title: string | null | undefined,
  ): Promise<BlogsViewModel[]> {
    const filter: any = {};

    if (title) {
      filter.title = { $regex: title };
    }
    return this.blogModel.find(filter, { projection: { _id: 0 } }).lean();
  }

  async findBlogById(id: string): Promise<BlogsViewModel | null> {
    return this.blogModel
      .findById({ _id: id }, { projection: { __v: 0 } })
      .lean();
  }

  async createBlog(newBlog: BlogsViewModel) {
    const blog = await this.blogModel.insertMany([{ ...newBlog }]);
    //const newBlogId = await this.blogModel.findOne({ _id: new});
    return blog;
  }

  async updateBlog(
    id: string,
    name: string,
    description: string,
    website: string,
  ): Promise<boolean | undefined> {
    const result = await this.blogModel.updateOne(
      { _id: id },
      { $set: { name, description, website } },
    );
    return result.matchedCount === 1;
  }

  async deleteBlog(_id: string) {
    const result = this.blogModel.deleteOne({ _id: _id });

    return (await result).deletedCount === 1;
  }

  async deleteAll(): Promise<boolean> {
    try {
      const result = await this.blogModel.deleteMany({});

      return result.acknowledged;
    } catch (e) {
      return false;
    }
  }
}

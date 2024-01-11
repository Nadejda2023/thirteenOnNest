import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BlogDocument = HydratedDocument<Blogs>;
@Schema()
export class Blogs {
  // @Prop({ required: true })
  //_id: ObjectId;
  @Prop({ required: true })
  name: string;
  @Prop({ required: true })
  description: string;
  @Prop({ required: true })
  websiteUrl: string;
  @Prop({ required: true })
  createdAt: string;
  @Prop({ required: true })
  isMembership: boolean;
}

export const BlogSchema = SchemaFactory.createForClass(Blogs);

// BlogSchema.virtual('id').get(function () {
//   return this._id.toString();
// });

// BlogSchema.set('toJSON', {
//   virtuals: true,
//   transform: (doc, ret) => {
//     delete ret._id;
//   },
// });

export interface BlogsViewModel {
  //_id: ObjectId;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
}

export class BlogsViewModelType {
  constructor(
    public name: string,
    public description: string,
    public websiteUrl: string,
    public createdAt: string,
    public isMembership: boolean,
  ) {}
}

export type PaginatedBlog<T> = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: T[];
};

export type blogsType = {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
};

export type BlogsInputViewModel = {
  name: string;
  description: string;
  websiteUrl: string;
};

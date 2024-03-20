import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  PostDocument,
  PostViewModel2,
  Posts,
  PostsDBModels,
} from '../../models/postSchema';
import { Model } from 'mongoose';
import { UsersModel } from '../../models/usersSchemas';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectModel(Posts.name) private postModel: Model<PostDocument>,
  ) {}
  async findAllPosts(): Promise<PostViewModel2[]> {
    const filter: any = {};

    return this.postModel.find(filter, {
      projection: {
        _id: 0,
        'extendedLikesInfo._id': 0,
        'extendedLikesInfo.statuses._id': 0,
        'extendedLikesInfo.newestLikes._id': 0,
        'extendedLikesInfo.newestLikes.myStatus._id': 0,
      },
    });
  }
  async findPostById(
    id: string,
    user: UsersModel | null,
  ): Promise<PostsDBModels | null> {
    const foundPost = await this.postModel
      .findOne({ id: id })
      .select('-__v')
      .lean();
    if (!foundPost) {
      return null;
    }
    return {
      id: foundPost.id,
      title: foundPost.title,
      shortDescription: foundPost.shortDescription,
      content: foundPost.content,
      blogId: foundPost.blogId,
      blogName: foundPost.blogName,
      createdAt: foundPost.createdAt,
      extendedLikesInfo: {
        ...foundPost.extendedLikesInfo,
        newestLikes: user
          ? [
              {
                addedAt:
                  foundPost.extendedLikesInfo.newestLikes[0]?.addedAt || '',
                userId:
                  foundPost.extendedLikesInfo.newestLikes[0]?.userId || '',
                login: foundPost.extendedLikesInfo.newestLikes[0]?.login || '',
              },
            ]
          : [],
      },
    };
  }

  async createPost(newPost: PostViewModel2, user: UsersModel | null) {
    try {
      await this.postModel.create(newPost);
      //return result;

      return {
        id: newPost.id,
        title: newPost.title,
        shortDescription: newPost.shortDescription,
        content: newPost.content,
        blogId: newPost.blogId,
        blogName: newPost.blogName,
        createdAt: newPost.createdAt,
        extendedLikesInfo: {
          likesCount: newPost.extendedLikesInfo.likesCount,
          dislikesCount: newPost.extendedLikesInfo.dislikesCount,
          myStatus: newPost.extendedLikesInfo.myStatus,
          newestLikes: user
            ? [
                {
                  addedAt:
                    newPost.extendedLikesInfo.newestLikes[0]?.addedAt || '',
                  userId:
                    newPost.extendedLikesInfo.newestLikes[0]?.userId || '',
                  login: newPost.extendedLikesInfo.newestLikes[0]?.login || '',
                },
              ]
            : [],
        },
      };
    } catch (error) {
      console.error('Error creating post:', error);
      return null;
    }
  }

  async updatePost(
    id: string,
    title: string,
    shortDescription: string,
    content: string,
    blogId: string,
  ): Promise<boolean | undefined> {
    const foundPost = await this.postModel.findOne(
      { id: id },
      {
        projection: {
          _id: 0,
          'extendedLikesInfo._id': 0,
          'extendedLikesInfo.statuses._id': 0,
          'extendedLikesInfo.newestLikes._id': 0,
          'extendedLikesInfo.newestLikes.myStatus._id': 0,
        },
      },
    ); //PostsDBModels.getViewModel(user, foundPost))
    const foundBlogName = await this.postModel.findOne(
      { id: blogId },
      { projection: { _id: 0 } },
    );
    if (foundPost) {
      if (foundBlogName) {
        const result = await this.postModel.updateOne(
          { id: id },
          {
            $set: {
              title: title,
              shortDescription: shortDescription,
              content: content,
              blogId: blogId,
            },
          },
        );
        return result.matchedCount === 1;
      }
    }
  }
  async deletePost(id: string): Promise<boolean> {
    const result = await this.postModel.deleteOne({ id: id });
    return result.deletedCount === 1;
  }
  async deleteAll(): Promise<boolean> {
    try {
      const result = await this.postModel.deleteMany({});

      return result.acknowledged;
    } catch (e) {
      return false;
    }
  }
}

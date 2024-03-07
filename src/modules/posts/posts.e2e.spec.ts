import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import supertest from 'supertest';

describe('PostsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/posts/:id (GET) should return a post with the specified id', async () => {
    const postId = 'a6c1d8c4-0c10-4a5e-a081-baf380881455';
    const response = await supertest(app.getHttpServer()).get(
      `/posts/${postId}`,
    );

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toHaveProperty('id', postId);
  });

  it('/posts/:id (GET) should return 404 Not Found if the post does not exist', async () => {
    const nonExistentPostId = 'non-existent-id';
    const response = await supertest(app.getHttpServer()).get(
      `/posts/${nonExistentPostId}`,
    );
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });
});

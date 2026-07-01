import request from 'supertest';
import express, { Application } from 'express';
import { versionRouter } from '../endpoints/status/index';
import packageJson from '../../../../package.json';

describe('GET /version', () => {
  let app: Application;

  beforeEach(() => {
    app = express();
    app.use('/version', versionRouter);
  });

  it('should return version information with 200 status', async () => {
    const response = await request(app).get('/version');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      version: packageJson.version,
      name: packageJson.name,
    });
  });
});

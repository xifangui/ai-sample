import request from 'supertest';
import app from '../src/app';

describe('Products API', () => {
  it('GET /api/products should return success and data', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('GET /api/products/search should return keyword filtered results', async () => {
    const res = await request(app).get('/api/products/search').query({ keyword: 'nonexistent-keyword' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

import request from 'supertest';
import app from '../src/app';
import pool from '../src/db';

describe('Auth API', () => {
  const testEmail = `testuser_${Date.now()}@example.com`;
  const password = 'P@ssw0rd!';
  const name = 'テストユーザー';

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1', [testEmail]);
    await pool.end();
  });

  it('should register a user', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: testEmail, password, name });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testEmail);
  });

  it('should login with registered user', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: testEmail, password });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeTruthy();
  });
});

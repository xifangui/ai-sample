import bcrypt from 'bcrypt';
import pool from './db';

async function seed() {
  const accounts = [
    { email: 'admin@example.com', password: 'admin123', name: '管理者', role: 'admin' },
    { email: 'user@example.com',  password: 'user123',  name: 'テストユーザー', role: 'user' },
  ];

  for (const account of accounts) {
    const hash = await bcrypt.hash(account.password, 10);
    await pool.query(
      `INSERT INTO users (email, password_hash, name, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, now(), now())
       ON CONFLICT (email) DO NOTHING`,
      [account.email, hash, account.name, account.role]
    );
    console.log(`Inserted: ${account.email} / ${account.password} (role: ${account.role})`);
  }

  await pool.end();
  console.log('Done.');
}

seed().catch(console.error);

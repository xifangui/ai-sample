import bcrypt from 'bcrypt';
import pool from './db';

export async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(100) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'user',
      phone VARCHAR(20),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price NUMERIC(12,2) NOT NULL DEFAULT 0,
      category_id INT REFERENCES categories(id) ON DELETE SET NULL,
      image_url TEXT,
      stock INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity INT NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS addresses (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      postal_code VARCHAR(15) NOT NULL,
      prefecture VARCHAR(100) NOT NULL,
      city VARCHAR(100) NOT NULL,
      address_line1 VARCHAR(255) NOT NULL,
      address_line2 VARCHAR(255),
      phone VARCHAR(20),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      order_number VARCHAR(50) NOT NULL UNIQUE,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      address_id INT REFERENCES addresses(id) ON DELETE SET NULL,
      total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
      payment_method VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INT NOT NULL REFERENCES products(id) ON DELETE SET NULL,
      quantity INT NOT NULL DEFAULT 1,
      unit_price NUMERIC(12,2) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
  `);

  const accounts = [
    { email: 'admin@example.com', password: 'admin123', name: '管理者', role: 'admin' },
    { email: 'user@example.com', password: 'user123', name: 'テストユーザー', role: 'user' },
  ];

  for (const account of accounts) {
    const hash = await bcrypt.hash(account.password, 10);
    await pool.query(
      `INSERT INTO users (email, password_hash, name, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, now(), now())
       ON CONFLICT (email) DO NOTHING`,
      [account.email, hash, account.name, account.role]
    );
  }
}

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

  // ユーザー
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

  // カテゴリ
  const categories = [
    { name: '電子機器' },
    { name: 'ファッション' },
    { name: '書籍' },
    { name: '食品' },
  ];

  const categoryIds: { [key: string]: number } = {};
  for (const category of categories) {
    const result = await pool.query(
      `INSERT INTO categories (name) VALUES ($1) ON CONFLICT DO NOTHING RETURNING id, name`,
      [category.name]
    );
    if (result.rows.length > 0) {
      categoryIds[category.name] = result.rows[0].id;
    } else {
      const existing = await pool.query(
        `SELECT id FROM categories WHERE name = $1`,
        [category.name]
      );
      if (existing.rows.length > 0) {
        categoryIds[category.name] = existing.rows[0].id;
      }
    }
  }

  // 商品
  const products = [
    { name: 'ノートPC', description: '高性能ノートパソコン', price: 120000, category: '電子機器', stock: 5, image_url: 'https://via.placeholder.com/200?text=Laptop' },
    { name: 'マウス', description: 'ワイヤレスマウス', price: 3500, category: '電子機器', stock: 20, image_url: 'https://via.placeholder.com/200?text=Mouse' },
    { name: 'TシャツA', description: 'カジュアルTシャツ', price: 2500, category: 'ファッション', stock: 30, image_url: 'https://via.placeholder.com/200?text=Tshirt' },
    { name: 'ジーンズ', description: 'ブルージーンズ', price: 8000, category: 'ファッション', stock: 15, image_url: 'https://via.placeholder.com/200?text=Jeans' },
    { name: 'プログラミング入門', description: 'JavaScript基礎', price: 3500, category: '書籍', stock: 10, image_url: 'https://via.placeholder.com/200?text=Book' },
    { name: 'チョコレート', description: 'ダークチョコ200g', price: 1500, category: '食品', stock: 50, image_url: 'https://via.placeholder.com/200?text=Chocolate' },
  ];

  const productIds: number[] = [];
  for (const product of products) {
    const categoryId = categoryIds[product.category] || null;
    const result = await pool.query(
      `INSERT INTO products (name, description, price, category_id, image_url, stock, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, now(), now())
       ON CONFLICT DO NOTHING RETURNING id`,
      [product.name, product.description, product.price, categoryId, product.image_url, product.stock]
    );
    if (result.rows.length > 0) {
      productIds.push(result.rows[0].id);
    }
  }

  // サンプル注文データ
  const userId = (await pool.query('SELECT id FROM users WHERE email = $1', ['user@example.com'])).rows[0]?.id;
  if (userId && productIds.length > 0) {
    // 住所を作成
    const addressResult = await pool.query(
      `INSERT INTO addresses (user_id, postal_code, prefecture, city, address_line1, phone, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, now(), now())
       ON CONFLICT DO NOTHING RETURNING id`,
      [userId, '100-0001', '東京都', '千代田区', '丸の内1-1-1', '09012345678']
    );
    const addressId = addressResult.rows[0]?.id;

    // 過去の注文を作成（統計情報用）
    const orders = [
      { orderNumber: 'ORD-2026-001', totalAmount: 125500, paymentMethod: 'credit_card', status: 'completed' },
      { orderNumber: 'ORD-2026-002', totalAmount: 10500, paymentMethod: 'credit_card', status: 'completed' },
      { orderNumber: 'ORD-2026-003', totalAmount: 9000, paymentMethod: 'bank_transfer', status: 'completed' },
      { orderNumber: 'ORD-2026-004', totalAmount: 124000, paymentMethod: 'credit_card', status: 'completed' },
    ];

    for (const order of orders) {
      const orderResult = await pool.query(
        `INSERT INTO orders (order_number, user_id, address_id, total_amount, payment_method, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, now() - interval '1 day' * floor(random() * 30 + 1), now())
         ON CONFLICT (order_number) DO NOTHING RETURNING id`,
        [order.orderNumber, userId, addressId, order.totalAmount, order.paymentMethod, order.status]
      );

      if (orderResult.rows.length > 0) {
        const orderId = orderResult.rows[0].id;
        // 注文アイテムを追加
        const itemCount = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < itemCount && i < productIds.length; i++) {
          const productId = productIds[i];
          const quantity = Math.floor(Math.random() * 3) + 1;
          const productData = products.find(p => productIds[productIds.indexOf(productId)] === productId);
          const unitPrice = productData?.price || 1000;

          await pool.query(
            `INSERT INTO order_items (order_id, product_id, quantity, unit_price, created_at, updated_at)
             VALUES ($1, $2, $3, $4, now(), now())
             ON CONFLICT DO NOTHING`,
            [orderId, productId, quantity, unitPrice]
          );
        }
      }
    }
  }
}

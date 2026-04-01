import bcrypt from 'bcrypt';
import pool from './db';

function makeSvgDataUrl(label: string, bg: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="100%" height="100%" fill="${bg}"/><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="54" font-family="Arial, sans-serif">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

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

  await pool.query(`
    WITH category_keep AS (
      SELECT name, MIN(id) AS keep_id
      FROM categories
      GROUP BY name
    )
    UPDATE products p
    SET category_id = ck.keep_id
    FROM categories c
    JOIN category_keep ck ON ck.name = c.name
    WHERE p.category_id = c.id
      AND c.id <> ck.keep_id;
  `);

  await pool.query(`
    DELETE FROM categories c
    USING categories c2
    WHERE c.name = c2.name
      AND c.id > c2.id;
  `);

  await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS uq_categories_name ON categories(name);');

  await pool.query(`
    DELETE FROM addresses a
    USING addresses b
    WHERE a.user_id = b.user_id
      AND a.postal_code = b.postal_code
      AND a.prefecture = b.prefecture
      AND a.city = b.city
      AND a.address_line1 = b.address_line1
      AND COALESCE(a.address_line2, '') = COALESCE(b.address_line2, '')
      AND COALESCE(a.phone, '') = COALESCE(b.phone, '')
      AND a.id > b.id;
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_addresses_user_full
    ON addresses (
      user_id,
      postal_code,
      prefecture,
      city,
      address_line1,
      COALESCE(address_line2, ''),
      COALESCE(phone, '')
    );
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

  const categories = ['電子機器', 'ファッション', '書籍', '食品'];
  const categoryIds: Record<string, number> = {};

  for (const categoryName of categories) {
    const existing = await pool.query('SELECT id FROM categories WHERE name = $1 LIMIT 1', [categoryName]);
    if (existing.rows[0]?.id) {
      categoryIds[categoryName] = existing.rows[0].id;
      continue;
    }

    const inserted = await pool.query('INSERT INTO categories (name) VALUES ($1) RETURNING id', [categoryName]);
    categoryIds[categoryName] = inserted.rows[0].id;
  }

  const products = [
    { name: 'ノートPC', description: '高性能ノートパソコン', price: 120000, category: '電子機器', stock: 5, image_url: makeSvgDataUrl('Laptop', '#2f54eb') },
    { name: 'マウス', description: 'ワイヤレスマウス', price: 3500, category: '電子機器', stock: 20, image_url: makeSvgDataUrl('Mouse', '#13c2c2') },
    { name: 'TシャツA', description: 'カジュアルTシャツ', price: 2500, category: 'ファッション', stock: 30, image_url: makeSvgDataUrl('T-Shirt', '#eb2f96') },
    { name: 'ジーンズ', description: 'ブルージーンズ', price: 8000, category: 'ファッション', stock: 15, image_url: makeSvgDataUrl('Jeans', '#722ed1') },
    { name: 'プログラミング入門', description: 'JavaScript基礎', price: 3500, category: '書籍', stock: 10, image_url: makeSvgDataUrl('Book', '#fa8c16') },
    { name: 'チョコレート', description: 'ダークチョコ200g', price: 1500, category: '食品', stock: 50, image_url: makeSvgDataUrl('Choco', '#a0d911') },
  ];

  const productIdMap: Record<string, number> = {};
  for (const product of products) {
    const categoryId = categoryIds[product.category] || null;
    const existing = await pool.query('SELECT id FROM products WHERE name = $1 LIMIT 1', [product.name]);
    if (existing.rows[0]?.id) {
      productIdMap[product.name] = existing.rows[0].id;
      await pool.query(
        `UPDATE products
         SET description = $2, price = $3, category_id = $4, image_url = $5, stock = $6, updated_at = now()
         WHERE id = $1`,
        [existing.rows[0].id, product.description, product.price, categoryId, product.image_url, product.stock]
      );
      continue;
    }

    const inserted = await pool.query(
      `INSERT INTO products (name, description, price, category_id, image_url, stock, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, now(), now()) RETURNING id`,
      [product.name, product.description, product.price, categoryId, product.image_url, product.stock]
    );
    productIdMap[product.name] = inserted.rows[0].id;
  }

  const userId = (await pool.query('SELECT id FROM users WHERE email = $1', ['user@example.com'])).rows[0]?.id;
  if (userId) {
    let addressId = (await pool.query('SELECT id FROM addresses WHERE user_id = $1 LIMIT 1', [userId])).rows[0]?.id;
    if (!addressId) {
      const addressInsert = await pool.query(
        `INSERT INTO addresses (user_id, postal_code, prefecture, city, address_line1, phone, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, now(), now()) RETURNING id`,
        [userId, '100-0001', '東京都', '千代田区', '丸の内1-1-1', '09012345678']
      );
      addressId = addressInsert.rows[0].id;
    }

    const orders = [
      { orderNumber: 'ORD-2026-001', totalAmount: 125500, paymentMethod: 'credit_card', status: 'completed', items: [{ name: 'ノートPC', quantity: 1 }, { name: 'マウス', quantity: 1 }] },
      { orderNumber: 'ORD-2026-002', totalAmount: 10500, paymentMethod: 'credit_card', status: 'completed', items: [{ name: 'ジーンズ', quantity: 1 }, { name: 'TシャツA', quantity: 1 }] },
      { orderNumber: 'ORD-2026-003', totalAmount: 9000, paymentMethod: 'bank_transfer', status: 'completed', items: [{ name: 'プログラミング入門', quantity: 2 }, { name: 'チョコレート', quantity: 1 }] },
      { orderNumber: 'ORD-2026-004', totalAmount: 124000, paymentMethod: 'credit_card', status: 'completed', items: [{ name: 'ノートPC', quantity: 1 }] },
    ];

    for (const order of orders) {
      const upsertedOrder = await pool.query(
        `INSERT INTO orders (order_number, user_id, address_id, total_amount, payment_method, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, now() - interval '1 day' * floor(random() * 30 + 1), now())
         ON CONFLICT (order_number)
         DO UPDATE SET total_amount = EXCLUDED.total_amount, payment_method = EXCLUDED.payment_method, status = EXCLUDED.status, updated_at = now()
         RETURNING id`,
        [order.orderNumber, userId, addressId, order.totalAmount, order.paymentMethod, order.status]
      );

      const orderId = upsertedOrder.rows[0].id;
      await pool.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);

      for (const item of order.items) {
        const productId = productIdMap[item.name];
        if (!productId) {
          continue;
        }

        const productRow = await pool.query('SELECT price FROM products WHERE id = $1', [productId]);
        const unitPrice = Number(productRow.rows[0]?.price || 0);

        await pool.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price, created_at, updated_at)
           VALUES ($1, $2, $3, $4, now(), now())`,
          [orderId, productId, item.quantity, unitPrice]
        );
      }
    }
  }

  const adminId = (await pool.query('SELECT id FROM users WHERE email = $1', ['admin@example.com'])).rows[0]?.id;
  if (adminId) {
    const adminAddress = (await pool.query('SELECT id FROM addresses WHERE user_id = $1 LIMIT 1', [adminId])).rows[0]?.id;
    if (!adminAddress) {
      await pool.query(
        `INSERT INTO addresses (user_id, postal_code, prefecture, city, address_line1, phone, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, now(), now())`,
        [adminId, '150-0001', '東京都', '渋谷区', '神宮前1-2-3', '09011112222']
      );
    }
  }
}

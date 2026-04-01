import { Router } from 'express';
import pool from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// 管理者権限チェックミドルウェア（簡易版）
function requireAdmin(req: AuthRequest, res: any, next: any) {
  // 実際のシステムではロールベースの権限チェックを実装
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  // ここでは全ユーザーを管理者として扱う（実際のシステムではロールチェック）
  next();
}

router.use(authenticateToken);
router.use(requireAdmin);

// 統計情報取得
router.get('/stats/users', async (req, res) => {
  const result = await pool.query('SELECT COUNT(*) as count FROM users');
  return res.json({ success: true, data: { count: Number(result.rows[0].count) } });
});

router.get('/stats/products', async (req, res) => {
  const result = await pool.query('SELECT COUNT(*) as count FROM products');
  return res.json({ success: true, data: { count: Number(result.rows[0].count) } });
});

router.get('/stats/orders', async (req, res) => {
  const ordersResult = await pool.query('SELECT COUNT(*) as count FROM orders');
  const revenueResult = await pool.query('SELECT SUM(total_amount) as revenue FROM orders WHERE status IN (\'completed\', \'shipped\')');
  return res.json({
    success: true,
    data: {
      count: Number(ordersResult.rows[0].count),
      revenue: Number(revenueResult.rows[0].revenue || 0)
    }
  });
});

// 最近の注文取得（adminは全注文、userは自分の注文のみ）
router.get('/orders/recent', async (req: AuthRequest, res: any) => {
  const userId = req.user?.userId;
  const role = req.user?.role;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'User not authenticated' });
  }

  let query = `
    SELECT o.id, o.order_number, o.total_amount, o.status, o.created_at,
           u.name as user_name
    FROM orders o
    JOIN users u ON o.user_id = u.id
  `;
  const params: any[] = [];

  // adminロールの場合は全注文、それ以外は自分の注文のみ
  if (role !== 'admin') {
    query += `WHERE o.user_id = $1`;
    params.push(userId);
  }

  query += `ORDER BY o.created_at DESC LIMIT 10`;

  const result = await pool.query(query, params);
  return res.json({ success: true, data: result.rows });
});

// 商品管理
router.get('/products', async (req, res) => {
  const result = await pool.query(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.created_at DESC
  `);
  return res.json({ success: true, data: result.rows });
});

router.post('/products', async (req, res) => {
  const { name, description, price, category_id, stock } = req.body;
  const result = await pool.query(
    'INSERT INTO products (name, description, price, category_id, stock, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, now(), now()) RETURNING *',
    [name, description, price, category_id, stock]
  );
  return res.status(201).json({ success: true, data: result.rows[0] });
});

router.put('/products/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, price, category_id, stock } = req.body;
  const result = await pool.query(
    'UPDATE products SET name = $1, description = $2, price = $3, category_id = $4, stock = $5, updated_at = now() WHERE id = $6 RETURNING *',
    [name, description, price, category_id, stock, id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  return res.json({ success: true, data: result.rows[0] });
});

router.delete('/products/:id', async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM products WHERE id = $1', [id]);
  return res.json({ success: true, message: 'Product deleted' });
});

// カテゴリ管理
router.get('/categories', async (req, res) => {
  const result = await pool.query('SELECT * FROM categories ORDER BY name');
  return res.json({ success: true, data: result.rows });
});

router.post('/categories', async (req, res) => {
  const { name } = req.body;
  const result = await pool.query('INSERT INTO categories (name) VALUES ($1) RETURNING *', [name]);
  return res.status(201).json({ success: true, data: result.rows[0] });
});

// カテゴリ別売上統計
router.get('/stats/by-category', async (req, res) => {
  const result = await pool.query(`
    SELECT c.id as category_id, c.name as category_name, 
           COALESCE(SUM(oi.quantity * oi.unit_price), 0)::numeric as total_amount,
           COALESCE(SUM(oi.quantity), 0)::integer as total_quantity
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id
    LEFT JOIN order_items oi ON p.id = oi.product_id
    LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('completed', 'shipped', 'pending')
    GROUP BY c.id, c.name
    ORDER BY total_amount DESC
  `);
  const data = result.rows.map(row => ({
    category_id: row.category_id,
    category_name: row.category_name,
    total_amount: Number(row.total_amount),
    total_quantity: Number(row.total_quantity)
  }));
  return res.json({ success: true, data });
});

// 月別売上統計
router.get('/stats/by-month', async (req, res) => {
  const result = await pool.query(`
    SELECT DATE_TRUNC('month', o.created_at) as month,
           COUNT(*)::integer as order_count,
           COALESCE(SUM(o.total_amount), 0)::numeric as total_amount
    FROM orders o
    WHERE o.status IN ('completed', 'shipped', 'pending')
    GROUP BY DATE_TRUNC('month', o.created_at)
    ORDER BY month DESC
    LIMIT 12
  `);
  const data = result.rows.map(row => ({
    month: row.month,
    order_count: Number(row.order_count),
    total_amount: Number(row.total_amount)
  }));
  return res.json({ success: true, data });
});

// 月別統計サマリー（テーブル表示用）
router.get('/stats/monthly-summary', async (req, res) => {
  const result = await pool.query(`
    WITH monthly_data AS (
      SELECT 
        DATE_TRUNC('month', o.created_at) as month,
        COUNT(*)::integer as order_count,
        COALESCE(SUM(o.total_amount), 0)::numeric as total_amount
      FROM orders o
      WHERE o.status IN ('completed', 'shipped', 'pending')
      GROUP BY DATE_TRUNC('month', o.created_at)
    ),
    user_count_by_month AS (
      SELECT 
        DATE_TRUNC('month', u.created_at) as month,
        COUNT(*)::integer as users_created
      FROM users u
      GROUP BY DATE_TRUNC('month', u.created_at)
    ),
    product_count_by_month AS (
      SELECT 
        DATE_TRUNC('month', p.created_at) as month,
        COUNT(*)::integer as products_created
      FROM products p
      GROUP BY DATE_TRUNC('month', p.created_at)
    ),
    all_months AS (
      SELECT DISTINCT DATE_TRUNC('month', created_at) as month
      FROM (
        SELECT created_at FROM users
        UNION ALL
        SELECT created_at FROM products
        UNION ALL
        SELECT created_at FROM orders
      ) t
      WHERE DATE_TRUNC('month', created_at) IS NOT NULL
      ORDER BY month DESC
      LIMIT 12
    )
    SELECT 
      am.month,
      COALESCE(ucm.users_created, 0)::integer as users_created,
      COALESCE(pcm.products_created, 0)::integer as products_created,
      COALESCE(md.order_count, 0)::integer as order_count,
      COALESCE(md.total_amount, 0)::numeric as total_amount
    FROM all_months am
    LEFT JOIN user_count_by_month ucm ON am.month = ucm.month
    LEFT JOIN product_count_by_month pcm ON am.month = pcm.month
    LEFT JOIN monthly_data md ON am.month = md.month
    ORDER BY am.month DESC
  `);
  const data = result.rows.map(row => ({
    month: row.month,
    users_created: Number(row.users_created),
    products_created: Number(row.products_created),
    order_count: Number(row.order_count),
    total_amount: Number(row.total_amount)
  }));
  return res.json({ success: true, data });
});

export default router;
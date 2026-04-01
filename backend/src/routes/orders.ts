import { Router } from 'express';
import pool from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.post('/', async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { shipping_address, payment_method, items } = req.body || {};
  if (!shipping_address || !payment_method) {
    return res.status(400).json({ success: false, message: 'Missing shipping address or payment method' });
  }

  let normalizedItems = Array.isArray(items) ? items : [];
  if (normalizedItems.length === 0) {
    const cartRows = (await pool.query(
      'SELECT product_id, quantity FROM cart_items WHERE user_id = $1 ORDER BY id',
      [req.user.userId],
    )).rows;
    normalizedItems = cartRows;
  }

  if (normalizedItems.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart is empty' });
  }

  await pool.query('BEGIN');
  try {
    const orderNumber = `ORD-${Date.now()}`;
    const orderRes = await pool.query(
      'INSERT INTO orders (order_number, user_id, total_amount, payment_method, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, now(), now()) RETURNING id',
      [orderNumber, req.user.userId, 0, payment_method, 'pending'],
    );
    const orderId = orderRes.rows[0].id;

    let totalAmount = 0;

    for (const item of normalizedItems) {
      const { product_id, quantity } = item;
      if (!product_id || !quantity || quantity <= 0) {
        throw new Error('Invalid order item');
      }
      const product = (await pool.query('SELECT id, price, stock FROM products WHERE id = $1', [product_id])).rows[0];
      if (!product) {
        throw new Error(`Product ${product_id} not found`);
      }
      if (product.stock < quantity) {
        throw new Error(`Product ${product_id} is out of stock`);
      }
      const lineTotal = product.price * quantity;
      totalAmount += lineTotal;
      await pool.query('INSERT INTO order_items (order_id, product_id, quantity, unit_price, created_at, updated_at) VALUES ($1, $2, $3, $4, now(), now())', [orderId, product_id, quantity, product.price]);
      await pool.query('UPDATE products SET stock = stock - $1, updated_at = now() WHERE id = $2', [quantity, product_id]);
    }

    await pool.query('UPDATE orders SET total_amount = $1, updated_at = now() WHERE id = $2', [totalAmount, orderId]);

    // Save shipping address (or use existing one)
    let addressId = shipping_address.address_id;
    if (!addressId) {
      const existingAddress = (await pool.query(
        `SELECT id
         FROM addresses
         WHERE user_id = $1
           AND postal_code = $2
           AND prefecture = $3
           AND city = $4
           AND address_line1 = $5
           AND COALESCE(address_line2, '') = COALESCE($6, '')
           AND COALESCE(phone, '') = COALESCE($7, '')
         LIMIT 1`,
        [
          req.user.userId,
          shipping_address.postal_code,
          shipping_address.prefecture,
          shipping_address.city,
          shipping_address.address_line1,
          shipping_address.address_line2 || '',
          shipping_address.phone || '',
        ],
      )).rows[0];

      if (existingAddress?.id) {
        addressId = existingAddress.id;
      } else {
        const addressRes = await pool.query(
          'INSERT INTO addresses (user_id, postal_code, prefecture, city, address_line1, address_line2, phone, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,now(),now()) RETURNING id',
          [req.user.userId, shipping_address.postal_code, shipping_address.prefecture, shipping_address.city, shipping_address.address_line1, shipping_address.address_line2, shipping_address.phone],
        );
        addressId = addressRes.rows[0].id;
      }
    }

    await pool.query('UPDATE orders SET address_id = $1 WHERE id = $2', [addressId, orderId]);

    await pool.query('COMMIT');

    return res.status(201).json({ success: true, data: { order_id: orderId, order_number: orderNumber, total_amount: totalAmount, status: 'pending' } });
  } catch (error: any) {
    await pool.query('ROLLBACK');
    return res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/', async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  let query = 'SELECT o.*, u.name as user_name FROM orders o JOIN users u ON o.user_id = u.id';
  const params: any[] = [];

  // adminロールの場合は全注文、それ以外は自分の注文のみ
  if (req.user.role !== 'admin') {
    query += ' WHERE o.user_id = $1';
    params.push(req.user.userId);
  }

  query += ' ORDER BY o.created_at DESC';

  const orders = (await pool.query(query, params)).rows;
  return res.json({ success: true, data: orders });
});

router.get('/:id', async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const orderId = Number(req.params.id);
  
  // adminロールの場合は全注文、それ以外は自分の注文のみ
  let query = 'SELECT * FROM orders WHERE id = $1';
  const params: any[] = [orderId];
  
  if (req.user.role !== 'admin') {
    query += ' AND user_id = $2';
    params.push(req.user.userId);
  }

  const order = (await pool.query(query, params)).rows[0];
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  const items = (await pool.query('SELECT oi.*, p.name, p.image_url FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1', [orderId])).rows;
  return res.json({ success: true, data: { order, items } });
});

router.get('/statistics', async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const period = req.query.period || 'month';

  const totals = (await pool.query(
    `SELECT date_trunc($1, created_at) AS period, SUM(total_amount) AS total
     FROM orders
     WHERE user_id = $2 AND status IN ('completed', 'pending', 'shipped')
     GROUP BY period
     ORDER BY period`,
    [period, req.user.userId],
  )).rows;

  return res.json({ success: true, data: totals });
});

export default router;

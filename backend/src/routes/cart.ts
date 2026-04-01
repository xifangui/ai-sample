import { Router } from 'express';
import pool from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const items = (await pool.query(
    'SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price, p.image_url FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.user_id = $1',
    [req.user.userId],
  )).rows;

  return res.json({ success: true, data: items });
});

router.post('/items', async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { product_id, quantity } = req.body;
  if (!product_id || quantity == null) {
    return res.status(400).json({ success: false, message: 'product_id and quantity required' });
  }

  const existing = await pool.query('SELECT id, quantity FROM cart_items WHERE user_id = $1 AND product_id = $2', [req.user.userId, product_id]);
  if (existing.rows.length > 0) {
    const updated = await pool.query('UPDATE cart_items SET quantity = quantity + $1 WHERE id = $2 RETURNING id, product_id, quantity', [quantity, existing.rows[0].id]);
    return res.json({ success: true, data: updated.rows[0] });
  }

  const inserted = await pool.query('INSERT INTO cart_items (user_id, product_id, quantity, created_at, updated_at) VALUES ($1, $2, $3, now(), now()) RETURNING id, product_id, quantity', [req.user.userId, product_id, quantity]);
  return res.status(201).json({ success: true, data: inserted.rows[0] });
});

router.put('/items/:id', async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const cartItemId = Number(req.params.id);
  const { quantity } = req.body;
  if (!quantity || quantity < 1) {
    return res.status(400).json({ success: false, message: 'quantity must be >= 1' });
  }

  const result = await pool.query('UPDATE cart_items SET quantity = $1, updated_at = now() WHERE id = $2 AND user_id = $3 RETURNING id, product_id, quantity', [quantity, cartItemId, req.user.userId]);
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Cart item not found' });
  }

  return res.json({ success: true, data: result.rows[0] });
});

router.delete('/items/:id', async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const cartItemId = Number(req.params.id);
  await pool.query('DELETE FROM cart_items WHERE id = $1 AND user_id = $2', [cartItemId, req.user.userId]);
  return res.json({ success: true, message: 'Cart item removed' });
});

router.delete('/', async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  await pool.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.userId]);
  return res.json({ success: true, message: 'Cart cleared' });
});

export default router;

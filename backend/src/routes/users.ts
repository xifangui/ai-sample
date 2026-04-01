import { Router } from 'express';
import pool from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/profile', authenticateToken, async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const result = await pool.query('SELECT id, email, name, phone, preferred_payment_method, created_at, updated_at FROM users WHERE id = $1', [req.user.userId]);
  const user = result.rows[0];
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  return res.json({ success: true, data: user });
});

router.put('/profile', authenticateToken, async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { name, phone, preferred_payment_method } = req.body;
  const result = await pool.query(
    'UPDATE users SET name = $1, phone = $2, preferred_payment_method = $3, updated_at = now() WHERE id = $4 RETURNING id, email, name, phone, preferred_payment_method, created_at, updated_at',
    [name, phone, preferred_payment_method, req.user.userId],
  );
  const user = result.rows[0];
  return res.json({ success: true, data: user });
});

// 配達先一覧取得
router.get('/addresses', authenticateToken, async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const result = await pool.query(
    'SELECT id, postal_code, prefecture, city, address_line1, address_line2, phone, created_at FROM addresses WHERE user_id = $1 ORDER BY created_at DESC',
    [req.user.userId]
  );
  return res.json({ success: true, data: result.rows });
});

// 配達先追加
router.post('/addresses', authenticateToken, async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { postal_code, prefecture, city, address_line1, address_line2, phone } = req.body;
  if (!postal_code || !prefecture || !city || !address_line1) {
    return res.status(400).json({ success: false, message: '必須項目を入力してください' });
  }

  const existing = (await pool.query(
    `SELECT id, postal_code, prefecture, city, address_line1, address_line2, phone, created_at
     FROM addresses
     WHERE user_id = $1
       AND postal_code = $2
       AND prefecture = $3
       AND city = $4
       AND address_line1 = $5
       AND COALESCE(address_line2, '') = COALESCE($6, '')
       AND COALESCE(phone, '') = COALESCE($7, '')
     LIMIT 1`,
    [req.user.userId, postal_code, prefecture, city, address_line1, address_line2 || '', phone || '']
  )).rows[0];

  if (existing) {
    return res.json({ success: true, data: existing });
  }

  const result = await pool.query(
    'INSERT INTO addresses (user_id, postal_code, prefecture, city, address_line1, address_line2, phone, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now()) RETURNING id, postal_code, prefecture, city, address_line1, address_line2, phone, created_at',
    [req.user.userId, postal_code, prefecture, city, address_line1, address_line2, phone]
  );
  return res.status(201).json({ success: true, data: result.rows[0] });
});

// 配達先削除
router.delete('/addresses/:id', authenticateToken, async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { id } = req.params;
  
  // 権限確認：自分の配達先のみ削除可能
  const checkResult = await pool.query('SELECT user_id FROM addresses WHERE id = $1', [id]);
  if (checkResult.rows.length === 0 || checkResult.rows[0].user_id !== req.user.userId) {
    return res.status(403).json({ success: false, message: 'This address does not belong to you' });
  }

  await pool.query('DELETE FROM addresses WHERE id = $1', [id]);
  return res.json({ success: true, message: 'Address deleted' });
});

export default router;

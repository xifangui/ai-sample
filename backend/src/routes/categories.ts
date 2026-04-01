import { Router } from 'express';
import pool from '../db';

const router = Router();

router.get('/', async (req, res) => {
  const result = await pool.query('SELECT id, name FROM categories ORDER BY name');
  return res.json({ success: true, data: result.rows });
});

export default router;

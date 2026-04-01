import { Router } from 'express';
import pool from '../db';

const router = Router();

router.get('/', async (req, res) => {
  const { category, keyword, page = '1', limit = '20', sort = 'created_desc' } = req.query;
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Number(limit));
  const offset = (pageNum - 1) * limitNum;

  const where: string[] = [];
  const params: any[] = [];

  if (category) {
    params.push(category);
    where.push(`category_id = $${params.length}`);
  }

  if (keyword) {
    params.push(`%${keyword}%`);
    where.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length})`);
  }

  const sortOptions: Record<string, string> = {
    price_asc: 'price ASC',
    price_desc: 'price DESC',
    name_asc: 'name ASC',
    name_desc: 'name DESC',
    created_desc: 'created_at DESC',
    created_asc: 'created_at ASC',
  };

  const orderBy = sortOptions[String(sort)] || 'created_at DESC';
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const productsQuery = `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ${whereClause} ORDER BY ${orderBy} LIMIT ${limitNum} OFFSET ${offset}`;
  const countQuery = `SELECT COUNT(*) AS total FROM products p ${whereClause}`;

  const products = (await pool.query(productsQuery, params)).rows;
  const total = Number((await pool.query(countQuery, params)).rows[0].total);

  return res.json({
    success: true,
    data: {
      products,
      pagination: {
        current_page: pageNum,
        total_pages: Math.ceil(total / limitNum),
        total_items: total,
        items_per_page: limitNum,
      },
    },
  });
});

router.get('/search', async (req, res) => {
  const { keyword, category } = req.query;
  const queryParams: any[] = [];
  const filters: string[] = [];

  if (keyword) {
    queryParams.push(`%${keyword}%`);
    filters.push(`(name ILIKE $${queryParams.length} OR description ILIKE $${queryParams.length})`);
  }

  if (category) {
    queryParams.push(category);
    filters.push(`category_id = $${queryParams.length}`);
  }

  const sql = `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ${filters.length ? 'WHERE ' + filters.join(' AND ') : ''} ORDER BY p.created_at DESC LIMIT 100`;
  const rows = (await pool.query(sql, queryParams)).rows;
  return res.json({ success: true, data: rows });
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = $1', [id]);
  const product = result.rows[0];
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  return res.json({ success: true, data: product });
});

export default router;

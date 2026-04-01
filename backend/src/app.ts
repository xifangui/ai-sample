import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import cartRoutes from './routes/cart';
import orderRoutes from './routes/orders';
import adminRoutes from './routes/admin';
import logsRoutes from './routes/logs';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// CORS Setup
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,https://xifangui.github.io').split(',').map(s => s.trim());
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

// Request logger
app.use((req: any, res: any, next: any) => {
  const start = Date.now();
  res.on('finish', () => {
    if (req.originalUrl === '/api/logs') {
      return;
    }
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'ERROR' : 'INFO';
    console.log(`[${level}] ${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    if (res.statusCode >= 400 && req.body && Object.keys(req.body).length > 0) {
      const safeBody = { ...req.body };
      if (safeBody.password) safeBody.password = '***';
      if (safeBody.password_hash) safeBody.password_hash = '***';
      console.log(`[BODY] ${JSON.stringify(safeBody)}`);
    }
  });
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/logs', logsRoutes);

app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok' }));

app.use((err: any, req: any, res: any, next: any) => {
  console.error(`[UNHANDLED ERROR] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  console.error(`[STACK] ${err.stack || err.message || err}`);
  return res.status(500).json({ success: false, message: 'Internal Server Error' });
});

export default app;


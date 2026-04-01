import app from './app';
import { initializeDatabase } from './bootstrap';

const port = process.env.PORT || 4000;

async function start() {
  await initializeDatabase();
  app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

const logDir = path.resolve(__dirname, '../../logs');
const logFile = path.join(logDir, 'frontend.log');

// logsディレクトリがなければ作成
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

router.post('/', (req, res) => {
  const { level = 'info', message, detail, url } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ success: false, message: 'message is required' });
  }

  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level.toUpperCase()}] [${url || '-'}] ${message}${detail ? `\n  ${detail.replace(/\n/g, '\n  ')}` : ''}\n`;

  // ファイルに追記
  fs.appendFile(logFile, line, { encoding: 'utf8' }, (err) => {
    if (err) console.error('[logs route] ファイル書き込みエラー:', err.message);
  });

  // コンソールにも出力
  const consoleFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  consoleFn(`[FRONTEND ${level.toUpperCase()}] [${url || '-'}] ${message}${detail ? ' | ' + detail.split('\n')[0] : ''}`);

  return res.json({ success: true });
});

export default router;

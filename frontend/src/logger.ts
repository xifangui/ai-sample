import axios from 'axios';

type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  detail?: string;
  url?: string;
  timestamp?: string;
}

function sendLog(entry: LogEntry): void {
  // /api/logs 送信は fetch を使って axios interceptor の再帰を避ける
  fetch('/api/logs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(entry),
    keepalive: true,
  }).catch(() => {});
}

const logger = {
  info(message: string, detail?: unknown): void {
    const detail_str = detail !== undefined ? String(detail) : undefined;
    console.log(`[INFO] ${message}`, detail ?? '');
    sendLog({ level: 'info', message, detail: detail_str, url: window.location.pathname });
  },

  warn(message: string, detail?: unknown): void {
    const detail_str = detail !== undefined ? String(detail) : undefined;
    console.warn(`[WARN] ${message}`, detail ?? '');
    sendLog({ level: 'warn', message, detail: detail_str, url: window.location.pathname });
  },

  error(message: string, detail?: unknown): void {
    const detail_str = detail instanceof Error
      ? `${detail.message}\n${detail.stack}`
      : detail !== undefined ? String(detail) : undefined;
    console.error(`[ERROR] ${message}`, detail ?? '');
    sendLog({ level: 'error', message, detail: detail_str, url: window.location.pathname });
  },
};

export default logger;

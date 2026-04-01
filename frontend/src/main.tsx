import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import App from './App';
import ErrorBoundary from './ErrorBoundary';
import logger from './logger';
import 'antd/dist/reset.css';

// 本番環境ではバックエンドURLをaxiosのデフォルトbaseURLに設定
if (import.meta.env.VITE_API_BASE_URL) {
  axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
}

// Axios グローバルエラーインターセプター
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase();
    const msg = error.response?.data?.message || error.message;

    // ログ送信API自身の失敗は再ログ化しない（再帰防止）
    if (typeof url === 'string' && url.includes('/api/logs')) {
      return Promise.reject(error);
    }

    if (status === 401) {
      logger.warn(`[API] 認証エラー: ${method} ${url}`, msg);
    } else if (status === 500) {
      logger.error(`[API] サーバーエラー: ${method} ${url}`, msg);
    } else {
      logger.error(`[API ERROR] ${method} ${url} → ${status}`, msg);
    }
    return Promise.reject(error);
  }
);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>,
);

# AI Sample - Domain Configuration Guide

## 概要
このプロジェクトは `ai-sample.com` ドメインで本番運用されるように設定されています。

## ファイル構造

### バックエンド設定
- `.env.example` - テンプレート設定
- `.env.production` - 本番環境設定
- `src/app.ts` - CORS設定で ai-sample.com を許可

### フロントエンド設定
- `.env.development` - 開発環境用（localhost:4000 に接続）
- `.env.production` - 本番環境用（api.ai-sample.com に接続）
- `src/api.ts` - API クライアント設定
- `vite.config.ts` - 環境変数ベースの proxy 設定

### インフラ設定
- `nginx.conf` - Nginx ウェブサーバー設定
- `docker-compose.yml` - Docker コンテナ設定

## セットアップ手順

### 1. 開発環境
```bash
# バックエンド
cd backend
npm install
npm run dev

# フロントエンド（別ターミナル）
cd frontend
npm install
npm run dev
```

### 2. 本番環境デプロイ

#### Nginx の場合
1. `nginx.conf` を確認し、SSL証明書パスを更新
2. ファイルを Nginx 設定ディレクトリにコピー
3. Nginx を再起動

```bash
sudo cp nginx.conf /etc/nginx/sites-available/ai-sample.com
sudo ln -s /etc/nginx/sites-available/ai-sample.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Docker の場合
1. `.env.production` を確認・設定
2. Docker Compose で起動

```bash
docker-compose -f docker-compose.yml up -d
```

### 3. 環境変数の設定

#### バックエンド (.env)
```
NODE_ENV=production
HOST=0.0.0.0
PORT=4000
DOMAIN=ai-sample.com
ALLOWED_ORIGINS=https://ai-sample.com,https://www.ai-sample.com
DATABASE_URL=postgresql://user:password@host:5432/ai_sample_db
JWT_SECRET=your_secret_here
```

#### フロントエンド (.env.production)
```
VITE_API_BASE_URL=https://api.ai-sample.com
VITE_DOMAIN=ai-sample.com
```

## DNS 設定

Route53、CloudFlare、または別の DNS プロバイダーで以下を設定：

```
ai-sample.com     A     <your-server-ip>
www.ai-sample.com CNAME ai-sample.com
api.ai-sample.com A     <your-api-server-ip>  (オプション)
```

## SSL/TLS 証明書

Let's Encrypt で無料の SSL 証明書を取得：

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d ai-sample.com -d www.ai-sample.com
```

## API エンドポイント

開発環境:
- API Base URL: `http://localhost:4000`
- Frontend: `http://localhost:3000`

本番環境:
- API Base URL: `https://api.ai-sample.com` (または `https://ai-sample.com/api`)
- Frontend: `https://ai-sample.com`

## CORS 設定

バックエンドは以下のオリジンからのリクエストを許可：
- 開発: `http://localhost:3000`
- 本番: `https://ai-sample.com`, `https://www.ai-sample.com`

## トラブルシューティング

### CORS エラーが発生
- `ALLOWED_ORIGINS` 環境変数を確認
- リクエストのオリジンが許可リストに含まれているか確認

### API に接続できない
- `VITE_API_BASE_URL` 環境変数を確認
- ファイアウォールルールを確認
- API サーバーが起動しているか確認（ポート 4000）

### SSL 証明書エラー
- 証明書の有効期限を確認
- Nginx の設定パスが正しいか確認

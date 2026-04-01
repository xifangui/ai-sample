# AI Sample 商品購入/履歴照会システム

このリポジトリは、`basic-design.md` に基づいて生成されたサンプルアプリケーションです。

## 構成
- **backend**: Node.js + Express + TypeScript + PostgreSQL
- **frontend**: React + TypeScript + Ant Design + Vite

## ローカルセットアップ

### Backend
```bash
cd backend
npm install
cp ../.env.example .env  # 編集: DATABASE_URL など設定
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

アクセス: `http://localhost:3000`

---

## デプロイ（課金ゼロ）

### 構成
- **フロント**: GitHub Pages（無料）
- **バック**: Render.com 無料枠（無料）

### デプロイ手順
詳細は [DEPLOY_GUIDE_RENDER.md](./DEPLOY_GUIDE_RENDER.md) を参照

**概要:**
1. GitHub にリポジトリ作成 & プッシュ
2. GitHub Pages を有効化（Settings → Pages）
3. Render.com で Web Service + PostgreSQL を作成
4. GitHub Actions が自動デプロイ

**結果:**
- フロント: `https://YOUR_USERNAME.github.io/ai-sample/`
- バック: `https://ai-sample-backend-xxxx.render.com`

---

## API List
- POST `/api/auth/register`
- POST `/api/auth/login`
- POST `/api/auth/logout`
- GET `/api/users/profile`
- PUT `/api/users/profile`
- GET `/api/products`
- GET `/api/products/search`
- GET `/api/products/:id`
- GET `/api/categories`
- GET `/api/cart`
- POST `/api/cart/items`
- PUT `/api/cart/items/:id`
- DELETE `/api/cart/items/:id`
- DELETE `/api/cart`
- POST `/api/orders`
- GET `/api/orders`
- GET `/api/orders/:id`
- GET `/api/orders/statistics`

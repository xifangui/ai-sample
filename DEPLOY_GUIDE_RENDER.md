# Render バックエンド デプロイ手順（課金ゼロ）

## 1. Render サインアップ
- [render.com](https://render.com) にアクセス
- GitHub でログイン

## 2. New Web Service を作成
1. Dashboard → **New +** → **Web Service**
2. GitHub リポジトリ選択：`ai-sample`
3. **Connect**

## 3. サービス設定
- **Name**: ai-sample-backend
- **Runtime**: Node
- **Build Command**: `cd backend && npm install && npm run build`
- **Start Command**: `cd backend && npm start`
- **Instance Type**: Free（重要：これで課金ゼロ）

## 4. Environment Variables 設定
以下を追加：

```
DATABASE_URL=postgresql://user:password@db_url:5432/ai_sample_db
JWT_SECRET=your-secure-random-key-here
NODE_ENV=production
ALLOWED_ORIGINS=https://YOUR_USERNAME.github.io/ai-sample
```

> **DB_URL は後述の PostgreSQL サービス URL を使用**

## 5. PostgreSQL を追加（無料）
1. Dashboard → **New +** → **PostgreSQL**
2. **Create**
3. 自動で DATABASE_URL が設定されます（上記をコピー）

## 6. Deploy Hook 取得
1. Web Service → **Settings** → **Deploy Hook**
2. コピー（例：`https://api.render.com/deploy/srv-xxx?key=xxx`）

## 7. GitHub Secrets 設定
リポジトリ → **Settings** → **Secrets and variables** → **Actions**

**新規追加：**
- **Secret 名**: `RENDER_DEPLOY_HOOK`
- **値**: 上記で取得したHook URL

## 8. GitHub Pages 設定
リポジトリ → **Settings** → **Pages**
- **Branch**: `gh-pages`
- **Save**

---

## 費用確認
- ✅ GitHub Pages：無料
- ✅ Render Web Service（Free）：無料（無操作15分後スリープ）
- ✅ Render PostgreSQL：無料
- **合計：$0**

---

## デプロイ完了後のアクセス
- **フロント**: `https://YOUR_USERNAME.github.io/ai-sample/`
- **バック API**: `https://ai-sample-backend-xxxx.render.com/api/...`
  （Render が自動生成したURL）

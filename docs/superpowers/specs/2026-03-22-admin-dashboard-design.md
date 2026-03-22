# Admin Dashboard Design

## Overview

ユーザー管理機能を備えた管理者用ダッシュボードを、既存のモノレポに独立した Next.js アプリ (`apps/admin`) として追加する。API は既存の `apps/api` に管理者用エンドポイントを追加して共有する。

## Requirements

- ユーザー向けアプリ (`apps/web`) とは完全に分離
- 同じ技術スタック（Next.js, shadcn/ui, TanStack Query, Better Auth）
- ユーザーテーブルに権限カラムを追加（`user` / `admin` / `super_admin`）
- 管理者権限を持つユーザーのみダッシュボードにログイン可能
- 初期スコープはユーザー管理のみ（一覧、詳細、権限変更、アカウント停止/有効化）

## Architecture

### Approach

`apps/admin` を独立 Next.js アプリとして追加し、API は既存の `apps/api` に管理者用ルートを追加する。

**選定理由:**
- ユーザーアプリとの完全分離（デプロイ・変更が独立）
- 既存の共有パッケージ（`@starter/ui`, `@starter/shared`, `@starter/db`）をそのまま活用
- Turborepo のワークスペースに自然に乗る
- 認証基盤は Better Auth を共有し、二重管理を避ける

**不採用案:**
- `apps/web` 内にルートグループで追加 → 分離要件に反する
- 管理者専用 API アプリも分離 → 現段階ではオーバーエンジニアリング

## Database Changes

### users テーブル — `role` カラム追加

```sql
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user';
```

- 型: `text`, NOT NULL, デフォルト `'user'`
- 値: `user` | `admin` | `super_admin`
- 既存ユーザーはすべて `user` がデフォルト
- Drizzle マイグレーションで追加

### users テーブル — `banned` の有効化

Better Auth の `banned` フィールドを有効化し、アカウント停止/有効化に使用する。

- `banned`: boolean (nullable)
- `bannedReason`: text (nullable)

## API Design

### 管理者用ルート構成

```
apps/api/src/routes/admin/
  ├── middleware.ts    # role チェックミドルウェア
  └── users.ts        # ユーザー管理 CRUD
```

### ミドルウェア (`middleware.ts`)

1. `auth.api.getSession()` でセッション取得 → 未認証なら 401
2. セッションの userId から DB で `role` を確認
3. `admin` または `super_admin` でなければ 403

### エンドポイント

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/users` | ユーザー一覧（ページネーション、検索） |
| GET | `/api/admin/users/:id` | ユーザー詳細 |
| PATCH | `/api/admin/users/:id/role` | 権限変更 |
| PATCH | `/api/admin/users/:id/status` | アカウント停止/有効化 |

**バリデーション:** リクエスト/レスポンスは `@starter/shared` の Zod schema で型安全に定義。OpenAPI (`@hono/zod-openapi`) 対応。

## Frontend — `apps/admin`

### 技術スタック

`apps/web` と同一:
- Next.js 15 (App Router, Turbopack)
- shadcn/ui (`@starter/ui`)
- TanStack Query
- Better Auth client
- Tailwind CSS

### ディレクトリ構成

```
apps/admin/
  ├── src/
  │   ├── app/
  │   │   ├── layout.tsx          # ルートレイアウト（Providers）
  │   │   ├── page.tsx            # / → /login にリダイレクト
  │   │   ├── login/
  │   │   │   └── page.tsx        # 管理者ログインページ
  │   │   └── (dashboard)/
  │   │       ├── layout.tsx      # 認証 + role チェックガード付きレイアウト
  │   │       ├── dashboard/
  │   │       │   └── page.tsx    # ダッシュボードホーム（将来の統計表示用）
  │   │       └── users/
  │   │           ├── page.tsx    # ユーザー一覧
  │   │           └── [id]/
  │   │               └── page.tsx # ユーザー詳細・編集
  │   ├── lib/
  │   │   ├── auth-client.ts      # Better Auth クライアント
  │   │   └── api.ts              # API クライアント（TanStack Query hooks）
  │   └── components/
  │       ├── sidebar.tsx          # サイドナビゲーション
  │       └── providers.tsx        # QueryClientProvider
  ├── next.config.ts
  ├── package.json
  └── tsconfig.json
```

### 認証フロー

1. `/login` で Better Auth のメール/パスワード認証でログイン
2. ログイン成功後、`/api/admin/users` 等の管理者 API を呼んで role を確認
3. `admin` / `super_admin` でなければエラー表示しセッション破棄
4. `(dashboard)` ルートグループの layout で毎回 role チェック（ガード）

### 共有パッケージ利用

- `@starter/ui` — UI コンポーネント（Button, Card, Input, Badge, Table 等）
- `@starter/shared` — Zod schema（role, admin API リクエスト/レスポンス）
- `@starter/db` — 直接使用しない（API 経由でアクセス）

## Deploy

- Vercel に `apps/web` とは別プロジェクトとしてデプロイ
- API の CORS `trustedOrigins` に管理者アプリの URL を追加

## Shared Schema Additions (`@starter/shared`)

```typescript
// Role
export const userRoleSchema = z.enum(['user', 'admin', 'super_admin']);
export type UserRole = z.infer<typeof userRoleSchema>;

// Admin API schemas
export const adminUserListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
});

export const adminUserUpdateRoleSchema = z.object({
  role: userRoleSchema,
});

export const adminUserUpdateStatusSchema = z.object({
  banned: z.boolean(),
  bannedReason: z.string().optional(),
});
```

# 認証フロー

## 概要

メールアドレス + パスワードによる会員登録・ログイン機能。Better Auth を使用し、メール認証を必須とする。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| 認証基盤 | Better Auth |
| メール送信 | Resend (`noreply@kafka.design`) |
| バリデーション | Zod (共有スキーマ `@starter/shared`) |
| フォーム | React Hook Form + `@hookform/resolvers` |
| DB | Drizzle ORM + PostgreSQL (UUID主キー) |

## フロー

### 会員登録

```
1. ユーザーが /auth/register でフォーム入力
2. フロントエンドで Zod バリデーション（名前、メール、パスワード、パスワード確認）
3. authClient.signUp.email() → Better Auth API (POST /api/auth/sign-up/email)
4. Better Auth がユーザーをDBに作成（emailVerified = false）
5. sendVerificationEmail コールバックで Resend 経由の認証メール送信
6. フロントエンドが /auth/verify-email?email=xxx にリダイレクト
7. ユーザーがメール内のリンクをクリック
8. Better Auth API がトークンをサーバーサイドで検証、emailVerified = true に更新
9. callbackURL に基づき /auth/login?verified=true にリダイレクト
```

### ログイン

```
1. ユーザーが /auth/login でメール・パスワードを入力
2. authClient.signIn.email() → Better Auth API (POST /api/auth/sign-in/email)
3. emailVerified = false の場合はエラー（メール認証が必須）
4. 成功時: セッション作成、/ にリダイレクト
```

## ページ構成

| パス | ファイル | 役割 |
|------|---------|------|
| `/auth/register` | `apps/web/src/app/auth/register/page.tsx` | 登録フォーム |
| `/auth/verify-email` | `apps/web/src/app/auth/verify-email/page.tsx` | 「メールを確認してください」画面 |
| `/auth/login` | `apps/web/src/app/auth/login/page.tsx` | ログインフォーム |
| `/auth/*` (共通) | `apps/web/src/app/auth/layout.tsx` | 中央寄せカードレイアウト |

## バリデーション

`packages/shared/src/types/auth.ts` に定義。フロントエンド・バックエンド共通で使用。

**パスワード要件:**
- 8文字以上
- 大文字を含む
- 小文字を含む
- 数字を含む

**登録スキーマ (`registerSchema`):**
- `name`: 1〜100文字
- `email`: 有効なメールアドレス
- `password`: 上記パスワード要件
- `passwordConfirmation`: password と一致

**ログインスキーマ (`loginSchema`):**
- `email`: 有効なメールアドレス
- `password`: 1文字以上

## バックエンド設定

### Better Auth 設定 (`apps/api/src/lib/auth.ts`)

- `emailAndPassword.requireEmailVerification: true` — メール認証なしではログイン不可
- `emailVerification.sendOnSignUp: true` — 登録時に自動で認証メール送信
- `emailVerification.autoSignInAfterVerification: false` — 認証後の自動ログイン無効
- `advanced.database.generateId: "uuid"` — DB の UUID カラムに対応
- `trustedOrigins` — フロントエンドのオリジンを許可（クロスオリジン対応）
- Drizzle アダプターに `schema` マッピングを渡す（`user`, `session`, `account`, `verification`）

### 環境変数

| 変数 | 場所 | 用途 |
|------|------|------|
| `BETTER_AUTH_SECRET` | `apps/api/.dev.vars` | セッション暗号化キー |
| `BETTER_AUTH_URL` | `apps/api/.dev.vars` | Better Auth API の URL |
| `RESEND_API_KEY` | `apps/api/.dev.vars` | Resend API キー |
| `WEB_URL` | `apps/api/wrangler.toml` | フロントエンド URL（メールリンク等） |
| `NEXT_PUBLIC_API_URL` | `apps/web/.env.local` | API サーバー URL |

## DB スキーマ

`packages/db/src/schema/index.ts` に定義。Better Auth が使用する4テーブル：

- **users** — `id`, `email`, `name`, `image`, `emailVerified`, `createdAt`, `updatedAt`
- **sessions** — `id`, `userId`, `token`, `expiresAt`, `ipAddress`, `userAgent`
- **accounts** — `id`, `userId`, `accountId`, `providerId`, `password`, トークン各種
- **verifications** — `id`, `identifier`, `value`, `expiresAt`

## テスト

```bash
# 共有スキーマのテスト（11テスト）
cd packages/shared && pnpm vitest run

# フロントエンドのテスト（18テスト）
cd apps/web && pnpm vitest run
```

## 未実装（スコープ外）

- ソーシャルログイン（Google, GitHub 等）
- パスワードリセット
- プロフィール画像アップロード（登録後の別フロー）
- アカウント削除
- レート制限

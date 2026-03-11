# Supabase Postgres 接続手順

DailyLog は `DATABASE_URL` が設定されると、Vercel 上でも Prisma 経由で PostgreSQL に保存します。

## 1. Supabase プロジェクトを作る

1. Supabase にログイン
2. `New project` を作成
3. リージョンは Vercel に近いものを選ぶ
4. DB パスワードを控える

## 2. 接続文字列を確認する

Supabase ダッシュボードで以下を確認します。

- `Project Settings` -> `API`
  - `Project URL`
  - `anon public` key
- `Project Settings` -> `Database`
  - pooled connection string
  - direct connection string

DailyLog で使う役割は次のとおりです。

- `DATABASE_URL`
  - Vercel 上の Prisma Client 用
  - Supabase の pooler 接続を使う
- `DIRECT_URL`
  - `prisma migrate deploy` 用
  - Supabase の direct connection を使う

## 3. Vercel に環境変数を入れる

Vercel の Project Settings -> Environment Variables に以下を追加します。

```bash
DATABASE_URL=postgresql://postgres.<ref>:[PASSWORD]@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres.<ref>:[PASSWORD]@db.<ref>.supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

## 4. 初回マイグレーションを流す

このリポジトリには初回 migration が入っています。

- `prisma/migrations/20260311_init/migration.sql`

ローカル PC で `.env.local` に `DATABASE_URL` と `DIRECT_URL` を入れたうえで、次を実行します。

```bash
npm.cmd install
npm.cmd run db:deploy
```

これで Supabase Postgres に DailyLog のテーブルが作られます。

## 5. Vercel を再デプロイする

環境変数を保存したあと、Vercel で `Redeploy` します。

その後は `/api/entries` が file ではなく database 保存へ切り替わります。

## 6. 確認ポイント

- 記録画面で保存してもエラーにならない
- ホームの保存元表示が `database` になる
- 別の PC から開いても同じ内容が見える

## 補足

- まだ認証は demo ユーザー固定です
- いまの段階でも全員が同じ共有データを見ることはできます
- ユーザーごとに分けるには次に Supabase Auth を入れます
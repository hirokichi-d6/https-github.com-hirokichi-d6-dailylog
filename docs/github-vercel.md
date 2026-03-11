# GitHub と Vercel 公開手順

## 1. GitHub に上げる

リポジトリ未作成なら、まず GitHub 側で空の repository を作成します。

ローカルで初回 push する例:

```bash
git init -b main
git add .
git commit -m "Initial DailyLog prototype"
git remote add origin https://github.com/<your-account>/<repo-name>.git
git push -u origin main
```

すでに Git 管理している場合は、通常どおり commit / push してください。

## 2. Vercel に接続する

1. Vercel にログイン
2. `Add New Project`
3. GitHub リポジトリを選択
4. Framework が `Next.js` になっていることを確認
5. `Deploy`

このプロジェクトには `vercel.json` を入れてあるので、基本設定はそのままで大丈夫です。

## 3. 環境変数

### まず公開だけしたい場合

環境変数なしでもデプロイはできます。
ただし保存先は Vercel の `/tmp/dailylog-data` になるため、一時的なデモ保存です。

### 本番運用したい場合

Vercel の Project Settings > Environment Variables に以下を設定します。

```bash
DATABASE_URL=your-production-postgres-url
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

おすすめ:
- Supabase Postgres
- Neon
- Railway Postgres

## 4. この構成での注意点

- `DATABASE_URL` なし: 共有 URL は作れるが、保存データは永続ではない
- `DATABASE_URL` あり: 他の PC からも同じデータを継続利用できる
- 認証はまだ demo 前提なので、公開後は早めに Auth を入れるのがおすすめ

## 5. 公開後の次の一手

1. `DATABASE_URL` をつなぐ
2. 認証を追加する
3. 画像添付や音声入力を足す
4. PWA とオフライン対応を仕上げる
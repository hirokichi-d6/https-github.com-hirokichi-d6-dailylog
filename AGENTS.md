# AGENTS.md

## プロジェクト概要
店舗向け統合日報Webアプリ（PWA）。Next.js + Supabase + Prisma 構成。

## コーディング規約
- 言語: TypeScript（strict mode）
- スタイル: Tailwind CSS、コンポーネント単位でファイル分割
- 命名: camelCase（変数/関数）、PascalCase（コンポーネント）
- コメント: 日本語OK、必要な箇所のみ簡潔に記述

## テスト
- `npm.cmd run typecheck` で型検査
- `npm.cmd run lint` でLint実行
- 将来的に `npm.cmd run test` と `npm.cmd run test:e2e` を追加予定

## ディレクトリ構成
- `src/app/` ... Next.js App Router のページ
- `src/components/` ... 共通UIコンポーネント
- `src/lib/` ... ユーティリティ、モックデータ、APIクライアント
- `src/types/` ... TypeScript 型定義
- `prisma/` ... スキーマ・マイグレーション

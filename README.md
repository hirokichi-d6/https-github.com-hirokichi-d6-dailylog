# DailyLog

DailyLog is a responsive journal app for shop owners. It combines daily notes, sales tracking, schedules, memos, and exports in one place.

## Local Setup

```bash
copy .env.example .env.local
npm.cmd install
npm.cmd run dev
```

## Included Today

- Dashboard, entries, analytics, calendar, memos, exports, and settings pages
- API routes for entry load/save and monthly export
- File-backed demo persistence for local development
- Prisma schema and Supabase-ready client scaffolding
- PWA manifest and mobile-friendly responsive layout

## Deployment

Vercel deployment notes and GitHub upload steps are here:

- [docs/github-vercel.md](./docs/github-vercel.md)
- [docs/supabase-postgres.md](./docs/supabase-postgres.md)

### Recommended production setup

Use Vercel for the frontend and API routes, and connect a real PostgreSQL database through `DATABASE_URL`.

Recommended combinations:
- Vercel + Supabase Postgres
- Vercel + Neon
- Vercel + Railway Postgres

### Demo deployment without a database

If `DATABASE_URL` is not set, DailyLog falls back to file storage.

- On local machines it stores data in the project `data` folder.
- On Vercel it automatically switches to `/tmp/dailylog-data`.
- `/tmp` on Vercel is temporary storage, so data may disappear between cold starts or redeploys.

This means a Vercel deployment will be shareable from other PCs immediately, but durable shared data requires a real database.

## Notes

- `postinstall` runs `prisma generate`, so Vercel builds can generate the Prisma client automatically.
- `DIRECT_URL` is used for Prisma migrations against Supabase direct connections.
- If you only want a public demo URL first, you can deploy without `DATABASE_URL` and connect the database afterward.

## Next Best Steps

1. Connect Supabase Postgres with `DATABASE_URL` and `DIRECT_URL`.
2. Add authentication so each user has separate data.
3. Replace the demo user flow with Supabase Auth.
4. Add image upload and voice input.
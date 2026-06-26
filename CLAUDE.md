# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev        # Start dev server on localhost:3000
pnpm build      # Production build
pnpm lint       # ESLint check
npm run db:push # Push schema changes to the database (requires DATABASE_URL in .env)
npm run db:studio # Open Drizzle Studio to browse the database
```

No test suite is configured.

## Database schema management

There are **no migration files** — schema changes must be pushed with `npm run db:push` (Drizzle Kit). If a query fails with a column-not-found error, the schema has drifted from the DB. Run `db:push` to reconcile. Config: [`drizzle.config.ts`](drizzle.config.ts).

## Architecture

**Next.js 16 App Router** with React 19. All pages are server components by default; client interactivity is isolated to leaf components.

### Auth — `better-auth`

- Server config: [`lib/auth.ts`](lib/auth.ts) — email/password auth, 7-day sessions, cross-site cookie hack for v0 preview iframe
- Client helper: [`lib/auth-client.ts`](lib/auth-client.ts)
- Auth route: [`app/api/auth/[...all]/route.ts`](app/api/auth/%5B...all%5D/route.ts)
- Two roles: `learner` (default) and `admin`. Role is stored on the `user` table.
- All server actions call `auth.api.getSession({ headers: await headers() })` to verify the session.

### Database — Drizzle ORM + PostgreSQL

- Schema: [`lib/db/schema.ts`](lib/db/schema.ts)
- DB instance: [`lib/db/index.ts`](lib/db/index.ts) — uses `pg` Pool
- Tables: `user`, `session`, `account`, `verification` (Better Auth managed), plus `course`, `module`, `video`, `pdf`, `course_enrollment`, `user_progress`
- Content hierarchy: Course → Module → Video/PDF (each with an `order` integer)

### Server Actions

All mutations go through Next.js Server Actions in [`app/actions/`](app/actions/):

- `courses.ts` — course CRUD, enrollment, progress tracking
- `admin.ts` — admin-only course/user management
- `auth.ts` — sign in / sign up / sign out
- `upload.ts` — file upload to Vercel Blob

Actions return `{ success: boolean, data?, error? }` — always check `success` before using `data`.

### File Storage

- Videos and PDFs can be either external URLs or uploaded to Vercel Blob.
- [`lib/blob-url.ts`](lib/blob-url.ts) — generates signed Blob URLs served via [`app/api/files/[...path]/route.ts`](app/api/files/%5B...path%5D/route.ts)
- [`lib/video-url.ts`](lib/video-url.ts) — resolves whether a video is a YouTube URL or a Blob file
- [`components/file-or-url-input.tsx`](components/file-or-url-input.tsx) — UI component that accepts either a URL or file upload

### Route Structure

| Path | Description |
|------|-------------|
| `/` | Marketing/landing |
| `/sign-in`, `/sign-up` | Auth pages |
| `/dashboard` | Learner dashboard (enrolled courses) |
| `/course/[courseId]` | Course detail + enrollment |
| `/learning/[courseId]` | In-course learning experience (video + PDF player) |
| `/admin` | Admin dashboard (stats) |
| `/admin/courses` | Course list with create/edit/delete |
| `/admin/courses/[courseId]` | Course editor (modules, videos, PDFs) |
| `/admin/users` | User list + role management |

### UI

- Tailwind CSS v4 — config in [`postcss.config.mjs`](postcss.config.mjs), no separate `tailwind.config.js`
- shadcn/ui components live in [`components/ui/`](components/ui/)
- `lucide-react` for icons, `recharts` for charts, `react-player` for video, `react-pdf` for PDF rendering

### Environment Variables

Required at runtime:

```
DATABASE_URL           # PostgreSQL connection string
BETTER_AUTH_SECRET     # Auth signing secret
BETTER_AUTH_URL        # App base URL (optional, auto-detected on Vercel)
BLOB_READ_WRITE_TOKEN  # Vercel Blob token (for file uploads)
```

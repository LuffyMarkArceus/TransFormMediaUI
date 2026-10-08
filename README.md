# Universal Media Service — Frontend (Next.js UI)

The web client for the media backend: Clerk auth, drag-and-drop upload, a filterable dashboard, a media viewer, and an image editor whose parameters map 1:1 to the backend's dynamic processing API.

| | |
|---|---|
| **Production** | https://ums-media-forge-ui.vercel.app |
| **Backend** | https://media-server-qbo2eammia-uc.a.run.app (direct browser calls) |
| **Stack** | Next.js (App Router) · TypeScript · Tailwind + shadcn/ui · Clerk · axios · SSE |
| **Last updated** | 2026-10-08 — see [`PROGRESS_REPORT.md`](PROGRESS_REPORT.md) for the full breakdown |
| **Size** | ~3.6k LOC TS/TSX, 35 commits, CI green (eslint + `next build`) on HEAD `32d3277` |

## Status at a glance

| Area | Complete | Notes |
|---|---|---|
| Authentication | 100% | Clerk, protected routes, user-scoped data |
| Upload | 90% | Drag & drop, progress, per-file errors; capped by the backend's ~32 MB platform limit |
| Dashboard & grid | 95% | Search/sort/pagination/tabs/stats/batch/trash; no virtualization yet |
| Media viewer | 100% | Keyboard nav, zoom/pan, share, video & audio playback |
| Image editor | 95% | URL-driven params, crop/gravity, undo, compare, instant preview |
| Media operations | 100% | Rename, replace, trash/restore/permanent, batch delete |
| Theme | 100% | Light/dark, persisted, hydration-safe |
| Real-time status | 100% | SSE stream with automatic poll fallback |
| Performance & UX polish | 85% | Blob-URL race and fetch-storm fixes; grid not virtualized |
| Testing | 10% | No tests, no test script |
| CI/CD | 100% | Vercel production deploys from `main`; lint + build in CI |

**Overall ≈ 88%.** Remaining work is prioritized in [`PROGRESS_REPORT.md`](PROGRESS_REPORT.md).

## Feature status

### Authentication
- [x] Clerk authentication integrated
- [x] Protected dashboard routes
- [x] User-scoped data access
- [x] Trash view with restore/permanent delete

### Upload
- [x] Drag & drop upload UI (click or drop, multi-file queue)
- [x] Presigned direct-to-storage flow: `POST /media/uploads` → PUT straight to R2 with live progress (5–95%) → `POST /media/:id/complete` (`components/UploadDropZone.tsx`)
- [x] Honest size caps in `lib/upload-limits.ts`: images 32 MB, video/audio 500 MB (`MAX_UPLOAD_BYTES`), multipart/replace 30 MB (`MULTIPART_MAX_BYTES`, below the ~32 MB Cloud Run front-end request cap)
- [x] Per-file progress bars, success/failure toasts, per-file retry (restarts the presign flow)
- [x] Client-side MIME validation + accept filter (images, video, audio)
- [x] Friendly errors for HTML/non-JSON 413 responses and storage-PUT failures (`lib/api-error.ts`)
- [x] Replace media (file picker on the grid card) — guarded at 30 MB with a clear message, real API errors surfaced
- [ ] Automatic retry / resumable uploads

### Dashboard & media grid
- [x] Responsive grid with thumbnails and per-type empty states
- [x] Pagination (Load More with count), debounced search (400 ms), sort by date/name/size
- [x] Type tabs: All / Images / Videos / Audio / Trash
- [x] Stats cards (image/video/audio counts + storage used)
- [x] Processing & failed badges; reprocess button for failures
- [x] Live status: SSE stream (`event: status`) with automatic 10 s poll fallback and reload-on-reconnect
- [x] Batch selection + batch delete (trash-aware)
- [ ] Virtualized grid for very large collections

### Media viewer
- [x] Modal viewer for images, `<video>` and `<audio>` playback
- [x] Next/previous + arrow-key navigation, shortcuts (`d` download, `c` copy URL, `o` open original)
- [x] Zoom (scroll, ±, drag-to-pan) with reset
- [x] Metadata display: resolution, duration, size, format, date
- [x] Share button (signed link, 7-day expiry)

### Image editor
- [x] URL-driven processing params (shareable/refresh-safe state)
- [x] Width/height/quality, format **JPEG/PNG** (WebP was removed backend-side), blur 0–20, grayscale
- [x] Crop with 9-anchor gravity selector
- [x] Debounced updates (400 ms), reset to defaults, processing overlay
- [x] Instant CSS preview for blur/grayscale sliders
- [x] Undo stack, compare mode (hold to compare), keyboard shortcuts
- [ ] Video/audio editing (viewer only — backend A/V transforms are not exposed)

### Media operations
- [x] Rename (modal), delete to trash, restore, permanent delete, batch delete
- [x] Optimistic UI updates
- [x] Replace media in place

### Theme & appearance
- [x] Light/dark toggle, persisted, system preference on first load, no hydration flicker
- [x] shadcn/ui primitives

## Deployment

- **Hosting:** Vercel, production branch `main`, project `ums-media-forge-ui`.
- **CI:** `.github/workflows` — eslint + `next build` on push and PRs (the build needs a Clerk publishable key supplied as a CI secret).
- **Env vars** (Vercel dashboard): `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_BACKEND_URL`, `BACKEND_URL` (for the `/api/:path*` rewrite), `NEXT_PUBLIC_R2_PUBLIC_BASE_URL`.

```bash
cp .env.example .env.local   # fill in Clerk + backend URL
npm install
npm run dev                  # http://localhost:3000
npm run lint                 # same check as CI
```

## Remaining work

Prioritized, with effort estimates: [`PROGRESS_REPORT.md`](PROGRESS_REPORT.md).
Backend status and API reference: `universal-media-service/README.md`.

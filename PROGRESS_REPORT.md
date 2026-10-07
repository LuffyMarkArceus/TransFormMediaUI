# Progress Report — Universal Media Service Frontend (Next.js UI)

**Report date:** 2026-10-07
**Scope:** `universal-media-ui` (Next.js client), including verification against the live Vercel production deployment.
**Repo state:** HEAD `32d3277`, 35 commits, CI green (eslint + `next build`).
**Companion:** backend report in `universal-media-service/PROGRESS_REPORT.md`.

---

## 1. Headline

- **Overall completion: ≈ 88%** (weighted; weights in §2)
- Every user-facing workflow works end-to-end in production: sign in → upload → browse/filter → view → edit → share → trash/restore.
- The two real gaps are **testing infrastructure (10%)** and **size-limit UX**, plus a shared **Clerk development-instance** dependency.

### Verification evidence (all run against production on 2026-10-07)

| Check | Result |
|---|---|
| Vercel production deploy | commit `32d3277` == repo HEAD; CI green on that commit |
| Page render | prod URL renders sign-in (GitHub/Google/email), title correct, no console errors |
| Full browser E2E | Clerk sign-in (ticket flow) → `/dashboard` → list fetched from Cloud Run with Bearer token → **uploaded a file through the real drag-and-drop input** → item rendered in the grid → `/info` 200 → `/process` 200 `image/jpeg` → cleanup leaves 0 items |
| Bundle audit | backend URL inlined in the client chunk; no secret keys present |
| Real-time | UI opens the SSE stream only while items are in `uploaded` status (by design — inline processing skips it); backend SSE delivery verified separately via curl |
| Prod cleanliness | no app ERROR/panic logs; all test users and media removed |

---

## 2. Completion by area

| # | Area | Weight | Complete | Evidence / gap |
|---|---|---|---|---|
| 1 | Authentication | 8 | 100% | Clerk, protected routes, user-scoped fetching |
| 2 | Upload | 14 | 90% | Drag & drop queue, progress, MIME validation, toasts. Gaps: no retry/resume, no friendly error for the ~32 MB platform cap |
| 3 | Dashboard & grid | 18 | 95% | Search/sort/pagination/tabs/stats/batch/trash/processing badges. Gap: no virtualization |
| 4 | Media viewer | 10 | 100% | Images + `<video>`/`<audio>`, shortcuts, zoom/pan, metadata, share |
| 5 | Image editor | 12 | 95% | URL-driven params, crop+gravity, undo, compare, instant CSS preview. Gap: A/V editing (backend doesn't expose A/V transforms) |
| 6 | Media operations | 10 | 100% | Rename, replace, trash/restore/permanent, batch delete, optimistic UI |
| 7 | Theme | 5 | 100% | Light/dark, persisted, hydration-safe |
| 8 | Real-time status | 6 | 100% | SSE consume + poll fallback + reload-on-reconnect |
| 9 | Performance & UX polish | 7 | 85% | Blob-URL race, fetch storm, and RSC payload fixes landed; grid unvirtualized |
| 10 | Testing | 8 | 10% | **No tests and no test script** — CI covers lint + build only |
| 11 | CI/CD | 2 | 100% | Vercel production from `main`; GitHub Actions lint + build |
| | **Weighted total** | **100** | **≈ 88%** | |

---

## 3. What is remaining (prioritized)

| Priority | Item | Why it matters | Size |
|---|---|---|---|
| **P1** | **Test infrastructure** — Vitest for `lib/` + component tests, Playwright smoke (sign in → upload → grid → viewer). Wire into CI. | Zero automated coverage; the browser E2E above was run by hand. UI regressions (auth headers, upload, SSE fallback) would ship unnoticed. | **M** |
| **P1** | **Friendly handling of oversized uploads** — client-side guard with a clear message for >~32 MB (Cloud Run returns an HTML 413 today, surfaced as a generic "please try again"), aligned with the backend P0 (presigned direct-to-R2 uploads). **Phased plan: §4 below.** | Users see a retryable error for an unrecoverable failure. | **S** |
| **P1** | **Clerk production instance** — currently `pk_test_` keys against the development instance `learning-dingo-96.clerk.accounts.dev`. | Coordinated swap with the backend's `CLERK_ISSUER`; required before real users. | **S** |
| **P2** | **Virtualized grid** | Hundreds of cards → heavy DOM, slow scroll, memory growth. | **M** |
| **P2** | **Upload queue resilience** — retry button, queue persistence across refresh, resumable/chunked uploads (pairs with the backend presigned-upload work). | Today a failed upload is dropped after 3 s. | **M** |
| **P2** | **Accessibility pass** — focus traps in modals, aria labels on the grid actions, contrast audit, full keyboard path for editor/compare. | Basic AA conformance. | **M** |
| **P3** | i18n, PWA/offline shell, infinite scroll, video/audio trimming (needs new backend endpoints) | Future scope. | **L** |

### Doc corrections made in this pass
- Format selector documented as **JPEG/PNG** (WebP was removed on the backend; the README previously claimed WebP).
- "Upload retry on failure" removed — there is per-file error surfacing, not an automatic retry.
- Added the real-time (SSE + fallback) and video/audio sections, deployment/env reference, and links to both progress reports.

---

## 4. Deep dive: oversized-upload UX (pairs with backend P0)

**Today:** the client advertises a 500 MB cap, Cloud Run's front end rejects anything over ~32 MB with an HTML `413`, axios gets a non-JSON body, `getApiErrorMessage` falls through to a generic *"Upload failed. Please try again."*, and the file is dropped from the queue after 3 s. The user retries something that can never succeed.

| Phase | UI work | Size | Acceptance |
|---|---|---|---|
| **0. Honest limits** (backend plan §4) | Client-side guard at ~30 MB with a specific message; treat HTML/non-JSON `413` as "too large for this deployment", not a retryable failure; align `MAX_FILE_SIZE_BYTES` with reality | **S** | A 35 MB file is rejected instantly with one clear sentence; no generic retry prompt |
| **1. Async processing** | No UI change beyond keeping the existing badge/SSE path | — | — |
| **2. Direct-to-R2** (backend plan §4) | 3-step flow: `POST /media/uploads` → XHR `PUT` to the returned R2 URL with real progress (bucket CORS exposes `ETag`) → `POST /media/:id/complete`; handle `pending`, quota-exceeded, and verification-failed states | **M** | A 500 MB video uploads with a live progress bar and lands as `ready` |
| **3. Resumable parts** | Persist part state, resume button after a dropped connection | **M** | Tab killed mid-upload → return → resume |

This is deliberately sequenced after the backend: until Phase 2 exists there is no honest UI beyond a correct 30 MB guard.

---

## 5. Known limitations & deliberate trade-offs

| Limitation | Status |
|---|---|
| Files > ~32 MB → HTML 413 from Cloud Run's front end | Platform limit; backend P0 covers the real fix |
| Editor is image-only | Backend `/process` rejects non-images by design |
| SSE stream opens only for `uploaded` items | By design — small uploads are processed inline and never enter `uploaded` |
| `X-Cache` invisible to cross-origin `fetch()` | CORS exposes only safelisted response headers |
| No tests | P1 above |
| Dev Clerk keys in production | P1 above |

---

## 6. Housekeeping

- Stale branch `feature/video-audio-support` (merge-base 2026-01-31, last commit 2026-06-07) is superseded by `main`, which already ships video/audio tabs, accept filters, and A/V playback. Recommend deleting it after a final diff review.
- Uncommitted at report time: `README.md`, `PROGRESS_REPORT.md`.

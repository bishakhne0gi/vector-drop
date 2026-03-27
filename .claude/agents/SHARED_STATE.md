# Shared State — Agent Coordination

Agents: update this file when you expose APIs, types, or interfaces that other agents depend on.

## Environment Variables Needed
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Anthropic
ANTHROPIC_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Shared Types (lib/types.ts)
- [x] `AppError` — backend agent owns (`lib/types.ts`)
- [x] `Project` — backend agent owns (`lib/types.ts`)
- [x] `ConversionJob` — backend agent owns (`lib/types.ts`)
- [ ] `AISuggestion` — AI agent owns (re-exported from lib/ai/schemas.ts)

## API Routes Status
| Route | Owner | Status |
|-------|-------|--------|
| POST /api/projects | backend | **done** |
| POST /api/projects/[id]/convert | backend | **done** |
| GET /api/jobs/[id] | backend | **done** |
| PATCH /api/projects/[id] | backend | **done** |
| GET /api/projects/[id]/export | backend | **done** — `?format=svg\|png` |
| POST /api/ai/analyze | backend+AI | **done** |
| POST /api/ai/restyle | backend+AI | **done** |

## Backend Notes (Phase 1 — complete)
- `lib/types.ts` — AppError class, Project, ConversionJob, all API req/res shapes
- `lib/cache/redis.ts` — Upstash Redis client, rate limiters, cacheGet/cacheSet helpers
- `lib/api/handleError.ts` — maps AppError → JSON Response with structured logging
- `lib/api/supabase.ts` — createRouteClient (RLS), createServiceClient (pipeline/storage)
- `supabase/migrations/0001_initial_schema.sql` — all 4 tables + RLS policies + triggers
- `potrace` + `@types/potrace` added to package.json

## Redis Cache Keys (locked — do not change without updating all agents)
```
conv:{sha256}:{colorCount}       TTL: 30d
ai:analysis:{imageHash}          TTL: 7d
ai:restyle:{imageHash}:{themeId} TTL: 3d
ratelimit:convert:{userId}       sliding 5/min
ratelimit:ai:{userId}            sliding 10/min
```

## Frontend Component APIs
| Component | Props | Status |
|-----------|-------|--------|
| ConversionProgress | `jobId: string, onDone?, onError?` | **done** — polls `/api/jobs/[id]` every 2s |
| EditorCanvas | `svgUrl: string` | **done** (stub — fetches + renders inline SVG) |
| AISuggestionPanel | `projectId: string` | pending |
| DropZone | `onFile: (file: File) => void, disabled?` | **done** — validates JPEG/PNG/WebP ≤10MB |
| ProjectCard | `project: Project` | **done** — links to editor when status=ready |
| DashboardPage | — | **done** — at `/dashboard`, full upload→convert flow |

## Frontend Notes (Phase 1)
- `lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)
- `stores/editorStore.ts` — Zustand: paths, selectedIds, history (undo/redo), updatePath
- `components/shared/QueryProvider.tsx` — React Query client provider (wrapped in root layout)
- CSS variables: `--background`, `--foreground`, `--border`, `--ring`, `--destructive` in `globals.css`
- **Note:** `next lint` removed in Next.js 16 — ESLint needs separate setup if desired

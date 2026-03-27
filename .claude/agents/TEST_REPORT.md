# Test Reports

## Template
```
## [Date] Manual Inspection: [Feature]
- **URL**: localhost:3000/...
- **Console errors**: [list or "none"]
- **Network issues**: [list or "none"]
- **Visual issues**: [list or "none"]
- **Lighthouse score**: Performance: X, Accessibility: X, Best Practices: X
- **Status**: PASS / FAIL / NEEDS_WORK
```

---

<!-- Inspection reports will be appended below -->

## 2026-03-26 Manual Inspection: Full Phase 1 UI + API (image-to-vector app)

### Dashboard — /dashboard
- **URL**: localhost:3000/dashboard
- **Console errors**: 4× `GET /api/projects 405` on page load (see bug below)
- **Network issues**: `GET /api/projects` returns 405 — route only exports `POST`, no `GET` handler exists. Dashboard's `fetchProjects()` calls GET, which causes "Failed to load projects" on every page load.
- **Visual issues**: "Failed to load projects" shown in red on every load — expected once the GET handler is added
- **Upload DropZone**: renders correctly, drag-and-drop UI present ✓
- **PDF rejection**: uploading `test.pdf` shows inline alert "Only JPEG, PNG, and WebP images are supported." with no network call made — client-side validation working ✓
- **PNG upload attempt**: triggers `POST /api/projects → 401 Unauthorized` — correct, auth required ✓ (mutation error "Failed to create project" shown to user ✓)
- **Lighthouse score**: Accessibility: 100, Best Practices: 100, SEO: 100
- **Status**: NEEDS_WORK — one bug (see below)

### Login — /login
- **URL**: localhost:3000/login
- **Console errors**: none
- **Visual issues**: "Auth form coming soon" placeholder — not yet implemented
- **Status**: PASS (placeholder expected at this phase)

### Editor — /editor/test-project-id (non-existent project)
- **URL**: localhost:3000/editor/test-project-id
- **Console errors**: 3× 405 on load (same GET /api/projects pattern)
- **Visual issues**: Shows spinner then "Project not found" in red — error state handled gracefully ✓
- **Status**: PASS

---

### Bugs Found

#### BUG-001 — `GET /api/projects` not implemented (405)
- **Severity**: High — blocks the projects list from loading on every page load
- **Route**: `app/api/projects/route.ts`
- **Root cause**: Only `POST` is exported; no `GET` handler to list the authenticated user's projects
- **Fix needed**: Add `export async function GET(req: Request)` that queries `projects` table filtered by `user_id` (RLS will enforce ownership)

#### BUG-002 — "Failed to load projects" shown even when Supabase has no projects yet
- **Severity**: Low — cosmetic; caused by BUG-001, will resolve when GET is added

---

## 2026-03-26 Manual Inspection: Next.js Scaffold (Phase 1)
- **URL**: localhost:3000/
- **Console errors**: none
- **Console warnings**: 1 — Next.js `<Image>` aspect ratio warning for `/vercel.svg` (width modified without height). Non-blocking; will be moot once scaffold page is replaced with app UI.
- **Network issues**: none
- **Visual issues**: Default Next.js starter page (expected — app UI not yet built)
- **Lighthouse score**: Accessibility: 100, Best Practices: 100, SEO: 100 (Performance not run — static scaffold page, not representative)
- **Status**: PASS — scaffold is clean, no errors blocking Phase 1 progress

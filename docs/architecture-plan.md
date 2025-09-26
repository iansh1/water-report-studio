# Next.js Migration Architecture Plan

## 1. Tech Stack Overview
- **Framework:** Next.js 14+ (App Router, Server Components).
- **Language:** TypeScript with strict mode.
- **Styling:** Tailwind CSS + CSS variables for theming; Framer Motion for interactions.
- **State Management:**
  - Global: Zustand (for contaminants/form/PDF metadata) + React Context for theme + password gate.
  - Forms: React Hook Form with Zod validation schemas.
- **PDF Rendering:** `react-pdf` (pdfjs) within client component; fallback to iframe download link for unsupported browsers.
- **Backend Logic:** Next.js Route Handlers (Node runtime) for PDF processing + SQL generation; optional background worker service if CPU-heavy.
- **Database:** None (stateless). SQL scripts generated on demand.
- **Auth Gate:** None today; add a minimal password or SSO layer before production access.
- **Deployment Target:** Vercel (serverless functions + static assets). Ensure functions fit execution/time limits.

## 2. Directory Structure (proposed)
```
WaterReportAppNew/
├─ docs/
├─ app/
│  ├─ layout.tsx
│  ├─ page.tsx                  # Upload / main interface
│  ├─ (protected)/
│  │  ├─ layout.tsx             # Password gate wrapper
│  │  ├─ dashboard/
│  │  │  └─ page.tsx            # Main UI (form + PDF)
│  ├─ api/
│  │  ├─ process-pdf/route.ts   # POST handler (PDF extraction)
│  │  ├─ generate-sql/route.ts  # POST handler (SQL script)
│  │  └─ health/route.ts        # Sanity check endpoint
│  └─ middleware.ts             # Password protection
├─ components/
│  ├─ upload/...
│  ├─ forms/
│  ├─ pdf/
│  ├─ sql-dialog/
│  ├─ feedback/
│  └─ layout/
├─ lib/
│  ├─ validators/
│  ├─ sql/
│  ├─ pdf/
│  ├─ hooks/
│  └─ utils/
├─ store/
│  └─ useWaterStore.ts
├─ public/
├─ styles/
│  ├─ globals.css
│  └─ theme.css
├─ tests/
│  ├─ unit/
│  └─ e2e/
├─ package.json
├─ next.config.js
├─ vercel.json
└─ .env.example
```

## 3. Routing & Layout Strategy
- **Middleware:**
  - Not currently used. Future iterations can reintroduce a guard when requirements are defined.
- **App Router Layouts:**
  - Root layout handles meta, fonts, theme provider, and password context.
  - `(protected)` group ensures main dashboard only loads once password validated.
  - Consider streaming server components for initial shell while client features hydrate.

## 4. State/Data Flow
1. **Upload PDF**
   - Client component triggers file selection/drag drop.
   - Immediately show processing steps via state updates.
   - Send `FormData` to `/api/process-pdf` (Route Handler).
2. **Process PDF (Server)**
  - Parse bytes (Node runtime using `pdfjs-dist` text extraction helpers).
   - Return JSON array of contaminants.
3. **Store & Display**
   - Store in Zustand: `contaminants`, `pdfMeta`, `pdfBlobUrl`.
   - React Hook Form seeded with contaminants; watchers keep store in sync.
4. **Generate SQL**
   - On submit, client sends sanitized form data + contaminants to `/api/generate-sql`.
   - Server returns SQL string + metadata; also provide downloadable `Blob` client-side.
5. **Download/Copy/Deploy Guide**
   - Modal component renders data, uses `navigator.clipboard` and file download.

## 5. PDF Viewer Implementation
- Use `react-pdf` with dynamic import to avoid SSR issues.
- Provide zoom controls via local state; maintain container width with `ResizablePanel` (e.g., `@radix-ui/resizable` or custom).
- Fullscreen handled by `screenfull` library or native Fullscreen API.
- Provide fallback link to open PDF in new tab using `URL.createObjectURL`.

## 6. Form & Validation
- **Schema:** Define Zod schema matching current validators (numeric, optional fields, date regex).
- **Dynamic Fields:** Map contaminants to `FieldArray` (React Hook Form). Each item includes `_id` for consistent keys.
- **Validation Feedback:** Inline errors, disabling submit on invalid, global toast for failures.
- **Add/Remove:** Maintain `_id` counter in store to avoid index-based collisions.

## 7. Animations & Styling
- Tailwind base with custom theme tokens (`--color-primary`, etc.).
- Framer Motion for card entrance, modal transitions, button interactions, theme toggle.
- Resizable gutter with hover highlight using CSS transitions.
- Respect `prefers-reduced-motion` by conditionally disabling motion.

## 8. Access Gate Details
- Authentication is intentionally omitted right now. Revisit before production rollout.

## 9. DevOps & Environment
- `.env.local` for dev; `.env.production` values set in Vercel dashboard.
- `vercel.json` to ensure Node runtime for API routes, adjust max duration if needed.
- Logging: use `@vercel/analytics` or console logging (captured by Vercel).
- Error monitoring via Sentry (optional future integration).

## 10. Testing Strategy
- Unit tests (Jest + ts-jest) for SQL generator, date parsing, password auth.
- Component tests (React Testing Library) for UploadArea, ContaminantCard, SqlDialog.
- End-to-end tests (Playwright) covering upload → edit → SQL export path.
- Mock API responses for deterministic tests.

## 11. Migration Risks & Mitigations
- **PDF parsing complexity:** Validate Node libraries can achieve parity; if not, consider reusing Django extraction via internal service until Node version ready.
- **Serverless limits:** Large PDFs might exceed Vercel function limits; monitor and, if necessary, offload to background worker or long-running service.
- **Performance:** Use lazy loading for heavy components (PDF viewer) and incremental hydration to keep initial load light.
- **Security:** Ensure password stored securely, throttle unlock attempts (middleware rate limit) to prevent brute force.

## 12. Next Steps
1. Validate PDF parsing feasibility in Node (prototype). If not viable, plan integration with existing Django service.
2. Scaffold Next.js project with base layouts, middleware, Tailwind, and store setup.
3. Implement password gate and upload workflow skeleton.
4. Build out form components and SQL generator utilities.
5. Polish UI/UX, add animations, and write automated tests.
6. Prepare Vercel deployment (envs, build, health checks).

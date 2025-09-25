# Water Quality Reporter – Feature Inventory

## 1. Product Overview
- **Purpose:** Help internal staff transform municipal water quality PDF reports into structured MariaDB SQL inserts.
- **Current Tech:** Flutter web app front end, Django API at `http://localhost:8081/water-reporter/api/process-pdf/` for PDF parsing.
- **Primary Users:** Water quality data analysts / operations staff with limited technical background.

## 2. Core User Journey
1. Landing state prompts user to upload a water quality PDF.
2. Backend extracts contaminant data and returns structured JSON.
3. App renders an editable form showing each contaminant’s values beside the original PDF.
4. User tweaks data, optionally adds/removes contaminants.
5. User generates a MariaDB SQL script, copies or downloads it, and follows deployment guidance.

## 3. Functional Modules

### 3.1 Authentication & Access
- Add a lightweight password gate for Vercel deployment (single shared secret provided via environment variable).
- No per-user accounts or role-based permissions planned beyond the shared password prompt.

### 3.2 PDF Intake
- **Upload sources:** local file picker (`.pdf` only); relies on bytes upload (Drop zone code stubbed but inactive).
- **UI states:**
  - Initial upload prompt (glass card, call-to-action button).
  - Loading state with step checklist (Uploading → Analyzing → Extracting → Generating form fields).
  - Error state with retry button.
- **Actions:**
  - Primary `Select from Device` button (disabled while processing).
  - App bar upload icon re-triggers picker when a PDF is already loaded.

### 3.3 PDF Viewer Panel
- Appears after successful processing.
- Resizable side panel (min 250px, max 800px) with draggable divider.
- Controls: zoom in/out, reset zoom, fullscreen toggle, open in new tab, file size indicator, close button.
- Fullscreen mode replaces layout with black backdrop + top app bar for controls.

### 3.4 Data Form Builder
- Renders cards per contaminant with animated entry.
- Fields (per contaminant):
  - Display name (editable title).
  - Level detected avg/max (required numeric).
  - Unit.
  - Sample date (regex validation for multiple formats).
  - Violation dropdown (Yes/No).
  - Level range (optional if source data present).
  - MCLG (numeric or `N/A`).
  - Regulatory limit.
  - Likely source (optional multi-line).
- Global actions:
  - `Add New Contaminant` (appends preset template).
  - `Clear Form` (resets entire session, clears PDF, animations, and data state).
  - `Generate SQL` (validates; on failure shows orange snackbar).
- Per-card actions:
  - Remove contaminant (confirm dialog, snackbar feedback).
- Validation states and messages mirror Flutter validators.

### 3.5 SQL Output Dialog
- Triggered when form validation passes.
- Tabbed interface:
  1. **SQL Script:** syntax-highlight-like dark theme, copy button with state, shows line count.
  2. **Preview:** schema summary (table name + fields) and insert statement overview.
  3. **Deploy Guide:** interactive stepper (SSH, connect DB, execute script, verify data) with copy buttons and completion tracking.
- Actions:
  - Copy SQL to clipboard (temporary “Copied!” state + snackbar).
  - Download SQL file (`water_quality_report_<timestamp>.sql`).
  - Close icon to exit dialog.

### 3.6 Notifications & Feedback
- Snackbars for success/error cues (upload errors, validation warnings, add/remove contaminant, clipboard/download acknowledgements).
- Loading spinners (app bar icon, button icon, progress indicator list).

### 3.7 Theming & Layout
- Custom gradient app bar with theme toggle (light/dark mode stored in `ThemeManager`).
- Glass/freeform cards with subtle animations (`AnimatedCard`, tweened appearances).
- Responsive consideration: mobile layout defined but PDF panel disabled (commented-out placeholder).

## 4. Backend Interaction Requirements
- `POST /water-reporter/api/process-pdf/` with multipart field `waterreport` (application/pdf). Returns list of contaminant objects.
- Expected contaminant payload fields: `Contaminant`, `Violation`, `Date of Sample`, `Level Detected (Avg/Max)`, `Level Detected (Range)`, `Unit Measurement`, `MCLG`, `Regulatory Limit`, `Likely Source of Contamination`.
- Front end expects JSON array; on failure, surfaces error message from exception.

## 5. SQL Generation Logic
- Table schema name: `water_quality_reports` with indexes for contaminant, report date, etc.
- Insert statements produced per contaminant using current form values; fallback to original extraction if field empty.
- Date normalization: supports various date string formats, converted to `YYYY-MM-DD`; invalid parsing yields `NULL`.
- SQL script includes header comments, `CREATE TABLE IF NOT EXISTS`, individual `INSERT` blocks with inline comments, plus suite of query examples.

## 6. Non-Functional Considerations
- Requires continuous backend availability (synchronous PDF processing).
- Large PDFs may impact response time; UI currently single-file at a time.
- Clipboard/file download rely on browser APIs (no server storage).
- Accessibility: moderate; dependent on Flutter web semantics (to be re-evaluated in Next.js migration).

## 7. Migration Notes for Next.js Planning
- Preserve all user-visible states (upload prompt, progress, error, form, SQL modal, deployment guide).
- Ensure responsive design supports desktop primary use, with functional mobile fallback.
- Recreate animation polish (entry transitions, panel resizing, button feedback) via CSS transitions/Framer Motion.
- Maintain theme toggle; consider system preference detection.
- Validate forms on both client (React Hook Form + Zod) and server (API route) for integrity.

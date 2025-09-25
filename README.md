# Water Report Studio

Water Report Studio is a Next.js application that turns raw water quality PDF reports into structured data and MariaDB-ready SQL scripts. Upload a report, review and edit extracted contaminant rows, preview the PDF alongside your edits, and follow an integrated connection guide to publish the results to Vulcan's MariaDB instance.

## Features

- **PDF ingestion & parsing** – drag-and-drop water quality reports and automatically extract contaminant tables.
- **Dual-pane review** – edit extracted fields while previewing the original PDF page in real time.
- **SQL generation** – produce ready-to-run SQL statements for the `water_quality_reports` table.
- **Deployment walkthrough** – step-by-step MariaDB connection guide with copy-ready commands.
- **Dark/light theming** – seamless theme toggle shared across landing and dashboard views.
- **State persistence** – keep uploaded PDFs and edits intact while navigating between pages.

## Tech Stack

- [Next.js 14](https://nextjs.org/) with App Router
- [React 18](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Zustand](https://zustand-demo.pmnd.rs/) for client-side state management
- [react-pdf](https://github.com/wojtekmaj/react-pdf) + Mozilla pdf.js for rendering PDFs
- [Framer Motion](https://www.framer.com/motion/) for subtle UI animations

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm (ships with Node)
- Local copy of the repository

### Installation

```bash
npm install
```

### Environment Variables

Create `.env.local` using the provided example:

```bash
cp .env.example .env.local
```

Populate the following keys:

- `SITE_PASSWORD` – shared password for the unlock gate
- `SITE_SALT` – cryptographic salt used to hash the password (keep this secret)

### Useful npm Scripts

| Command          | Description                                  |
| ---------------- | -------------------------------------------- |
| `npm run dev`    | Start the development server on `localhost:3000` |
| `npm run build`  | Create an optimized production build         |
| `npm run start`  | Start the production server                  |
| `npm run lint`   | Run ESLint against the codebase              |

## Workflow Overview

1. **Unlock the workspace** – Navigate to `/` and click **Get started**. Enter the shared password to reach the dashboard.
2. **Upload a PDF** – Use the upload panel to select a water quality report. The PDF preview will render in the side panel.
3. **Review contaminants** – Edit names, ranges, and metadata directly in the contaminant cards. Changes persist in the store.
4. **Generate SQL** – Click **Generate SQL** to produce insert statements. The dialog includes an editable textarea.
5. **Deploy** – Switch to the **Deploy Guide** tab (or visit `/deploy`) to follow the MariaDB connection checklist.

## Project Structure

```
src/
  app/                # Next.js routes (landing, dashboard, deploy, auth)
  components/         # Reusable UI components and feature panels
  lib/                # Auth, environment helpers, constants
  store/              # Zustand store for PDF + contaminant state
```

## Authentication Flow

- Protected routes (`/dashboard`, `/deploy`, etc.) require a hashed cookie (`waterreport-auth`).
- Middleware reroutes anonymous visitors to the landing page with a redirect hint.
- The unlock form sets the cookie after verifying the shared password.

## Contributing

1. Fork and clone the repository.
2. Create a feature branch (`git checkout -b feature/amazing-idea`).
3. Commit changes with clear messages.
4. Run `npm run lint` before opening a pull request.

## License

This project is proprietary. Ask Ian before distributing or reusing the code.

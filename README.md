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


## Workflow Overview

1. **Upload a PDF** – Use the upload panel to select a water quality report. The PDF preview will render in the side panel.
3. **Review contaminants** – Edit names, ranges, and metadata directly in the contaminant cards. Changes persist in the store.
4. **Generate SQL** – Click **Generate SQL** to produce insert statements. The dialog includes an editable textarea.
5. **Deploy** – Switch to the **Deploy Guide** tab (or visit `/deploy`) to follow the MariaDB connection checklist.


## Authentication

Access is currently open; add your own authentication layer before production deployment.

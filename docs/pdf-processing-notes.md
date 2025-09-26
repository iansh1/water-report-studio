# PDF Processing Prototype Notes

## Overview
- Prototype implemented in `src/pdf/parsePdf.ts` using the Node build of `pdfjs-dist`.
- Exposes `parsePdf` function returning structured contaminant records plus metadata/warnings.
- CLI helper (`npm run dev:pdf <file.pdf>`) prints JSON payload for manual inspection.

## Installation
1. Ensure Node.js 18+ is installed.
2. Install dependencies:
   ```bash
   npm install
   ```
   > _Note:_ The workspace currently lists `pdfjs-dist`, `typescript`, `ts-node`, and `@types/node`. If package install fails due to offline work, run the command once network access is available.

## Usage
```bash
npm run dev:pdf ~/path/to/report.pdf > output.json
```
- `output.json` will include `metadata`, `contaminants`, `rawText`, and `warnings` fields.
- Any parsing issues are surfaced in the `warnings` array.

## Extraction Heuristics
- Detects the start of contaminant tables via "Table of Detected Contaminants" headings, then treats subsequent lines as rows until reaching definition or notes sections.
- Uses the contaminant-category map from the legacy Django code to recognise rows (exact prefix and fuzzy word matching), keeping the most complete version when duplicates appear.
- Collects multi-line rows by concatenating follow-on lines until the next contaminant, header, or section delimiter, then parses values with targeted regex (violation status, dates, units, ranges, MCLG, regulatory limits, and likely sources).
- Normalises unit strings (`mg/L`, `ug/L`, `pCi/L`, etc.) and returns a structured object matching the original API contract (keys such as `Contaminant`, `Violation`, `Level Detected (Avg/Max)`, …) plus the raw text snippet for debugging.
- Stops parsing when encountering horizontal rules or "Definitions/Notes/Footnotes" blocks so narrative paragraphs aren’t misinterpreted as data.

## Next Steps
- Validate against a variety of real reports to fine-tune column detection and multi-line handling.
- Consider switching to structured layout parsing (e.g., `pdfjs-dist` text items with coordinates) for higher accuracy if needed.
- Harden date/number normalization here or during SQL generation.
- Add automated tests with fixture PDFs once sample files are cleared for inclusion (or synthetic PDFs are generated).
- Improve separation when two contaminants are concatenated onto a single line within `rawText` output.

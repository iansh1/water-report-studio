#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(here, '..');
const source = join(projectRoot, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');
const fallbackSource = join(projectRoot, 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.min.mjs');
const targetDir = join(projectRoot, 'public');
const target = join(targetDir, 'pdf.worker.min.mjs');

if (!existsSync(source) && !existsSync(fallbackSource)) {
  console.warn('[copy-pdf-worker] pdf.worker.min.mjs not found. Skipping copy.');
  console.warn(`[copy-pdf-worker] Checked paths: ${source}, ${fallbackSource}`);
  process.exit(0);
}

const resolvedSource = existsSync(source) ? source : fallbackSource;

if (!existsSync(targetDir)) {
  mkdirSync(targetDir, { recursive: true });
}

try {
  copyFileSync(resolvedSource, target);
  console.log(`[copy-pdf-worker] Copied worker from ${resolvedSource} to ${target}`);
} catch (error) {
  console.error('[copy-pdf-worker] Failed to copy pdf.worker.min.mjs', error);
  process.exitCode = 1;
}

#!/usr/bin/env ts-node
import { parsePdf } from './parsePdf';

async function main() {
  const [filePath] = process.argv.slice(2);
  if (!filePath) {
    console.error('Usage: npm run dev:pdf <path-to-pdf>');
    process.exit(1);
  }

  try {
    const result = await parsePdf({ filePath });
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Failed to parse PDF:', error);
    process.exit(1);
  }
}

main();

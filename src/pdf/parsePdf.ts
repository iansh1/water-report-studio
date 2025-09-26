import fs from 'node:fs/promises';
import path from 'node:path';
import { CONTAMINANT_CATEGORY_MAP, ContaminantRecord, PdfExtractionResult } from './types';

interface ParseOptions {
  filePath?: string;
  fileName?: string;
  buffer?: Buffer;
}

const TABLE_START_REGEX = /table of detected contaminants/i;
const HEADER_LINE_REGEX = /^contaminant(\s+violation.*)?$/i;
const CATEGORY_LINE_REGEX = /(Inorganic Contaminants|Radioactive Contaminants|Microbiological Contaminants|Synthetic Organic Contaminants|Disinfectants|Lead and Copper|Unregulated Detected Substances)/i;
const EXIT_SECTION_REGEX = /^(definitions|notes|additional|footnotes|terminology)/i;
const HORIZONTAL_RULE_REGEX = /^[-–]{4,}$/;

const CONTAMINANT_KEYS = Object.keys(CONTAMINANT_CATEGORY_MAP).sort((a, b) => b.length - a.length);

function normaliseWhitespace(line: string): string {
  return line.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function matchContaminantName(line: string): string | null {
  const candidate = normaliseWhitespace(line);
  if (!candidate) {
    return null;
  }

  const lower = candidate.toLowerCase();

  for (const key of CONTAMINANT_KEYS) {
    if (lower.startsWith(key.toLowerCase())) {
      return key;
    }
  }

  const words = lower.split(' ');
  for (const key of CONTAMINANT_KEYS) {
    const keyWords = key.toLowerCase().split(' ');
    const match = keyWords.every((kw) => words.some((word) => word.startsWith(kw)));
    if (match) {
      return key;
    }
  }

  return null;
}

function preferFullDate(newDate: string | null | undefined, existingDate: string | null | undefined): boolean {
  if (!newDate || !existingDate) {
    return false;
  }
  const newHasSlash = newDate.includes('/');
  const existingHasSlash = existingDate.includes('/');
  return newHasSlash && !existingHasSlash;
}

function calculateCompletenessScore(record: ContaminantRecord): number {
  return Object.entries(record).reduce((score, [key, value]) => {
    if (key === 'rawText' || key === 'Contaminant' || key === 'Category') {
      return score;
    }
    if (value !== null && value !== undefined && String(value).trim().length > 0) {
      return score + 1;
    }
    return score;
  }, 0);
}

function isMoreComplete(newData: ContaminantRecord, existingData: ContaminantRecord): boolean {
  const newScore = calculateCompletenessScore(newData);
  const existingScore = calculateCompletenessScore(existingData);

  if (newScore === existingScore) {
    if (preferFullDate(newData['Date of Sample'] ?? null, existingData['Date of Sample'] ?? null)) {
      return true;
    }
  }

  return newScore > existingScore;
}

const DATE_PATTERNS = [
  /(\d{1,2}\/\d{1,2}\/\d{4})/, // MM/DD/YYYY or M/D/YYYY
  /(\d{1,2}\/\d{2}\/\d{4})/,
  /(\d{4})/ // fallback year
];

const UNIT_REGEX = /(mg\/L|mg\/l|ug\/L|ug\/l|ng\/L|ng\/l|pCi\/L|pCi\/l|units|NTU|ppm|ppb)/i;
const RANGE_REGEXES = [
  /\(([0-9.\s–\-,]+)\)/,
  /\(([^)]+)\)/
];

const SOURCE_REGEXES = [
  /(Erosion of[^.]*\.)/i,
  /(Naturally occurring[^.]*\.)/i,
  /(Runoff from[^.]*\.)/i,
  /(Decay of[^.]*\.)/i,
  /(By-product[^.]*\.)/i,
  /(Corrosion of[^.]*\.)/i,
  /(Water additive[^.]*\.)/i,
  /(Soil runoff[^.]*\.)/i,
  /(See health effect[^.]*\.)/i,
  /(Released into[^.]*\.)/i
];

function standardiseUnit(unit: string | null): string | null {
  if (!unit) {
    return null;
  }
  const upper = unit.toUpperCase();
  const map: Record<string, string> = {
    'MG/L': 'mg/L',
    'UG/L': 'ug/L',
    'NG/L': 'ng/L',
    'PCI/L': 'pCi/L',
    UNITS: 'units',
    NTU: 'NTU',
    PPM: 'ppm',
    PPB: 'ppb'
  };
  return map[upper] ?? unit;
}

function extractViolation(text: string): string | null {
  const match = text.match(/\b(No|Yes)\b/i);
  return match ? match[0] : null;
}

function extractDate(text: string): string | null {
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const value = match[0];
      if (value.includes('/')) {
        return value;
      }
      if (!value.includes('/')) {
        return value;
      }
    }
  }
  return null;
}

function extractLevelDetected(text: string, unitMatch: RegExpMatchArray | null): string | null {
  if (!unitMatch || unitMatch.index === undefined) {
    return null;
  }

  const unitStart = unitMatch.index;
  const unit = unitMatch[0];
  const precedingText = text.slice(0, unitStart);

  const numberMatches = Array.from(precedingText.matchAll(/>?(\d+\.?\d*)/g));
  if (numberMatches.length === 0) {
    return null;
  }

  const filtered = numberMatches.filter((match) => {
    const value = match[0];
    if (value.length === 4 && value.startsWith('20')) {
      return false;
    }
    const idx = match.index ?? 0;
    const before = precedingText[idx - 1];
    const after = precedingText[idx + value.length];
    if (before === '/' || before === '-') {
      return false;
    }
    if (after === '/' || after === '-') {
      return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    return null;
  }

  const lastMatch = filtered[filtered.length - 1];
  const value = lastMatch[0];
  return value.endsWith('.') ? value.slice(0, -1) : value;
}

function extractRange(text: string): string | null {
  for (const pattern of RANGE_REGEXES) {
    const match = text.match(pattern);
    if (match) {
      const content = match[1].trim();
      if (/\d/.test(content)) {
        return `(${content})`;
      }
    }
  }
  return null;
}

function extractNumbersAfterUnit(text: string, unitMatch: RegExpMatchArray | null): string[] {
  if (!unitMatch || unitMatch.index === undefined) {
    return [];
  }
  const unitEnd = unitMatch.index + unitMatch[0].length;
  const trailing = text.slice(unitEnd);
  const matches = Array.from(trailing.matchAll(/(N\/A|>?\d+\.?\d*)/gi));
  return matches.map((match) => match[0]);
}

function extractSource(text: string): string | null {
  for (const pattern of SOURCE_REGEXES) {
    const match = text.match(pattern);
    if (match) {
      return normaliseWhitespace(match[0]);
    }
  }
  return null;
}

function parseContaminantRow(rowText: string, contaminantName: string): ContaminantRecord {
  const text = normaliseWhitespace(rowText);
  const violation = extractViolation(text);
  const date = extractDate(text);
  const unitMatch = text.match(UNIT_REGEX);
  const unit = standardiseUnit(unitMatch ? unitMatch[0] : null);
  const levelDetected = extractLevelDetected(text, unitMatch);
  const levelRange = extractRange(text);
  const numbersAfterUnit = extractNumbersAfterUnit(text, unitMatch);
  const mclg = numbersAfterUnit.length >= 1 ? numbersAfterUnit[0] : null;
  const regulatoryLimit = numbersAfterUnit.length >= 2 ? numbersAfterUnit[1] : numbersAfterUnit[0] ?? null;
  const source = extractSource(text);

  return {
    Contaminant: contaminantName,
    Category: CONTAMINANT_CATEGORY_MAP[contaminantName],
    Violation: violation ? violation.charAt(0).toUpperCase() + violation.slice(1).toLowerCase() : null,
    'Date of Sample': date,
    'Level Detected (Avg/Max)': levelDetected,
    'Level Detected (Range)': levelRange,
    'Unit Measurement': unit,
    MCLG: mclg,
    'Regulatory Limit': regulatoryLimit,
    'Likely Source of Contamination': source,
    rawText: text
  };
}

export async function parsePdf(options: ParseOptions): Promise<PdfExtractionResult> {
  const { filePath, buffer } = options;
  if (!filePath && !buffer) {
    throw new Error('Either filePath or buffer must be provided');
  }

  const fileBuffer = buffer ?? (await fs.readFile(path.resolve(filePath!)));
  const { text, pageCount } = await extractPdfText(fileBuffer);
  const lines = text
    .split(/\r?\n/)
    .map(normaliseWhitespace)
    .filter((line) => line.length > 0);

  const warnings: string[] = [];
  const aggregated: Record<string, ContaminantRecord> = {};

  let tableActive = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (TABLE_START_REGEX.test(line) || HEADER_LINE_REGEX.test(line)) {
      tableActive = true;
      continue;
    }

    if (!tableActive) {
      continue;
    }

    if (EXIT_SECTION_REGEX.test(line) || HORIZONTAL_RULE_REGEX.test(line)) {
      tableActive = false;
      continue;
    }

    if (CATEGORY_LINE_REGEX.test(line)) {
      continue;
    }

    const contaminantName = matchContaminantName(line);
    if (!contaminantName) {
      continue;
    }

    let rowText = line;
    let j = i + 1;
    while (j < lines.length) {
      const nextLine = lines[j];
      if (TABLE_START_REGEX.test(nextLine) || HEADER_LINE_REGEX.test(nextLine)) {
        break;
      }
      if (matchContaminantName(nextLine)) {
        break;
      }
      if (EXIT_SECTION_REGEX.test(nextLine) || HORIZONTAL_RULE_REGEX.test(nextLine)) {
        break;
      }
      if (CATEGORY_LINE_REGEX.test(nextLine)) {
        break;
      }
      rowText += ` ${nextLine}`;
      j++;
    }

    const parsed = parseContaminantRow(rowText, contaminantName);
    const existing = aggregated[contaminantName];
    if (!existing || isMoreComplete(parsed, existing)) {
      aggregated[contaminantName] = parsed;
    }

    i = j - 1;
  }

  const contaminants = Object.values(aggregated);
  if (contaminants.length === 0) {
    warnings.push('No contaminant rows detected. Verify PDF layout or adjust parsing heuristics.');
  }

  return {
    metadata: {
      fileName: options.fileName ?? (filePath ? path.basename(filePath) : 'uploaded.pdf'),
      pageCount
    },
    contaminants,
    rawText: text,
    warnings
  };
}

async function extractPdfText(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  // Set up global polyfills for serverless environment
  if (typeof globalThis.DOMMatrix === 'undefined') {
    (globalThis as any).DOMMatrix = class {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
      constructor() {}
      static fromMatrix() { return new (globalThis as any).DOMMatrix(); }
    };
  }
  
  if (typeof globalThis.Path2D === 'undefined') {
    (globalThis as any).Path2D = class Path2D {};
  }

  if (typeof globalThis.CanvasRenderingContext2D === 'undefined') {
    (globalThis as any).CanvasRenderingContext2D = class CanvasRenderingContext2D {};
  }

  if (typeof globalThis.HTMLCanvasElement === 'undefined') {
    (globalThis as any).HTMLCanvasElement = class HTMLCanvasElement {};
  }

  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const pdfjsLib = (pdfjs as any).default ?? (pdfjs as any);
  let pdfDocument;
  try {
    const documentData = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const getDocument = pdfjsLib.getDocument as ((params: any) => any) | undefined;
    if (!getDocument) {
      throw new Error('pdfjs getDocument export not found');
    }
    const loadingTask = getDocument({ 
      data: documentData, 
      disableWorker: true,
      isEvalSupported: false,
      useSystemFonts: true
    });
    pdfDocument = await loadingTask.promise;
  } catch (error) {
    console.error('[pdf] Failed to load PDF document', error);
    throw error;
  }

  let text = '';

  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
    const page = await pdfDocument.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => (typeof item.str === 'string' ? item.str : ''))
      .join(' ');
    text += `${pageText}\n`;
  }

  await pdfDocument.cleanup();
  await pdfDocument.destroy();

  return { text, pageCount: pdfDocument.numPages };
}

import { ParseApiClient, AlternativePdfApiClient } from './parseApiClient';
import { CONTAMINANT_CATEGORY_MAP, ContaminantRecord, PdfExtractionResult } from './types';

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

// Helper functions (copied from parsePdf.ts)
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

export async function parseServerlessPdf(buffer: Buffer, fileName: string): Promise<PdfExtractionResult> {
  const parseApiKey = process.env.PARSE_API_KEY;
  const pdfCoApiKey = process.env.PDF_CO_API_KEY;
  
  let text = '';
  let pageCount = 1;
  let warnings: string[] = [];

  try {
    console.log('[serverless-pdf] Attempting PDF parsing with external APIs...');

    // Try ParseAPI first if available
    if (parseApiKey) {
      try {
        console.log('[serverless-pdf] Using ParseAPI...');
        const parseClient = new ParseApiClient(parseApiKey);
        const result = await parseClient.extractText(buffer, fileName);
        text = result.text;
        pageCount = result.pageCount;
        console.log('[serverless-pdf] ParseAPI extraction successful');
      } catch (error) {
        console.warn('[serverless-pdf] ParseAPI failed, trying alternative:', error);
        warnings.push('ParseAPI extraction failed, trying alternative service...');
      }
    }

    // Try PDF.co as fallback if ParseAPI failed or not configured
    if (!text && pdfCoApiKey) {
      try {
        console.log('[serverless-pdf] Using PDF.co as fallback...');
        const pdfCoClient = new AlternativePdfApiClient(pdfCoApiKey);
        const result = await pdfCoClient.extractText(buffer, fileName);
        text = result.text;
        pageCount = result.pageCount;
        console.log('[serverless-pdf] PDF.co extraction successful');
      } catch (error) {
        console.warn('[serverless-pdf] PDF.co also failed:', error);
        warnings.push('PDF.co extraction also failed');
      }
    }

    // If no API keys are configured or all APIs failed
    if (!text) {
      if (!parseApiKey && !pdfCoApiKey) {
        warnings.push('No PDF parsing API keys configured. Please set PARSE_API_KEY or PDF_CO_API_KEY environment variables.');
      } else {
        warnings.push('All PDF parsing services failed. The PDF might be corrupted or in an unsupported format.');
      }
      
      console.log('[serverless-pdf] All external APIs failed, returning fallback result');
      return {
        metadata: {
          fileName,
          pageCount: 1
        },
        contaminants: [],
        rawText: '',
        warnings: [
          'PDF parsing failed with external services.',
          'Please try one of these alternatives:',
          '1. Use the PDF preview to manually extract contaminant data',
          '2. Convert your PDF to a text format first',
          '3. Check if your PDF is corrupted or password-protected',
          ...warnings
        ]
      };
    }

    // Parse the extracted text for contaminants
    console.log('[serverless-pdf] Processing extracted text for contaminants...');
    
    const lines = text
      .split(/\r?\n/)
      .map(normaliseWhitespace)
      .filter((line) => line.length > 0);

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
      warnings.push('No contaminant rows detected. The PDF format might not match expected water quality report layout.');
    }

    console.log(`[serverless-pdf] Successfully parsed ${contaminants.length} contaminants`);

    return {
      metadata: {
        fileName,
        pageCount
      },
      contaminants,
      rawText: text,
      warnings
    };

  } catch (error) {
    console.error('[serverless-pdf] Unexpected error during PDF parsing:', error);
    
    return {
      metadata: {
        fileName,
        pageCount: 1
      },
      contaminants: [],
      rawText: '',
      warnings: [
        'An unexpected error occurred during PDF parsing.',
        'Please try uploading the PDF again or contact support.',
        `Error details: ${error instanceof Error ? error.message : String(error)}`
      ]
    };
  }
}

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Buffer } from 'buffer';
import { parsePdf } from '@/pdf/parsePdf';
import { parseServerlessPdf } from '@/pdf/parseServerlessPdf';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Expected multipart/form-data payload.' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('waterreport');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No PDF file supplied under field "waterreport".' }, { status: 400 });
    }

    if (!file.type.includes('pdf')) {
      return NextResponse.json({ error: 'Uploaded file must be a PDF.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let result;
    try {
      // Try serverless-optimized PDF parser with external APIs first
      console.log('Attempting serverless PDF parsing with external APIs...');
      result = await parseServerlessPdf(buffer, file.name);
      
      // If no contaminants found and no text extracted, try PDF.js fallback
      if (result.contaminants.length === 0 && !result.rawText && !result.warnings.some(w => w.includes('API'))) {
        console.log('Serverless parsing returned empty result, trying PDF.js fallback...');
        try {
          const fallbackResult = await parsePdf({ buffer, fileName: file.name });
          // Use fallback result if it has more content
          if (fallbackResult.contaminants.length > 0 || fallbackResult.rawText) {
            result = fallbackResult;
            result.warnings = [...(result.warnings || []), 'Used PDF.js fallback after external API parsing returned empty results'];
          }
        } catch (pdfJsError) {
          console.warn('PDF.js fallback also failed:', pdfJsError);
          result.warnings = [...(result.warnings || []), 'PDF.js fallback also failed'];
        }
      }
    } catch (error) {
      console.error('All PDF parsing methods failed, returning fallback result:', error);

      // Return a fallback result with basic information
      result = {
        metadata: {
          fileName: file.name,
          pageCount: 1
        },
        contaminants: [],
        rawText: '',
        warnings: [
          'All PDF parsing methods failed.',
          'Please consider the following alternatives:',
          '1. Use the PDF preview to manually extract contaminant data',
          '2. Convert your PDF to text format (TXT) before uploading',
          '3. Use the "Generate SQL" feature with manually entered data',
          '4. Check if your PDF is password-protected or corrupted'
        ]
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('process-pdf route error', error);
    return NextResponse.json(
      {
        error: 'Failed to process PDF report.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

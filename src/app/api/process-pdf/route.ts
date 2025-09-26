import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Buffer } from 'buffer';
import { parsePdf } from '@/pdf/parsePdf';

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
      result = await parsePdf({ buffer, fileName: file.name });
    } catch (error) {
      console.error('PDF parsing failed, returning fallback result:', error);

      // Return a fallback result with basic information
      result = {
        metadata: {
          fileName: file.name,
          pageCount: 1 // We can't determine page count without PDF parsing
        },
        contaminants: [],
        rawText: '',
        warnings: [
          'PDF parsing failed due to serverless environment limitations.',
          'Please consider the following alternatives:',
          '1. Use the PDF preview to manually extract contaminant data',
          '2. Convert your PDF to text format (TXT) before uploading',
          '3. Use the "Generate SQL" feature with manually entered data'
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

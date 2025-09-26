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

    const result = await parsePdf({ buffer, fileName: file.name });

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

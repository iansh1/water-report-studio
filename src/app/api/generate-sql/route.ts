import { NextResponse } from 'next/server';
import { generateSqlScript } from '@/lib/sql-generator';
import { ContaminantRecord } from '@/pdf/types';

export const runtime = 'nodejs';

interface GenerateSqlRequest {
  formData?: Record<string, unknown>;
  contaminants?: ContaminantRecord[];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateSqlRequest;
    const contaminants = body.contaminants ?? [];

    if (!Array.isArray(contaminants) || contaminants.length === 0) {
      return NextResponse.json({ error: 'No contaminants supplied.' }, { status: 400 });
    }

    const script = generateSqlScript({ formData: body.formData ?? {}, contaminants });

    return NextResponse.json({
      script,
      contaminantCount: contaminants.length,
    });
  } catch (error) {
    console.error('generate-sql route error', error);
    return NextResponse.json({ error: 'Failed to generate SQL script.' }, { status: 500 });
  }
}

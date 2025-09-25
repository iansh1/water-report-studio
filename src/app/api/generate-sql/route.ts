import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from '@/lib/constants';
import { isRequestAuthenticated } from '@/lib/auth-edge';
import { generateSqlScript } from '@/lib/sql-generator';
import { ContaminantRecord } from '@/pdf/types';

export const runtime = 'nodejs';

interface GenerateSqlRequest {
  formData?: Record<string, unknown>;
  contaminants?: ContaminantRecord[];
}

export async function POST(request: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!(await isRequestAuthenticated(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

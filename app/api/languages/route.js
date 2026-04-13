import { NextResponse } from 'next/server';
import { SUPPORTED_LANGUAGES } from '@/lib/torii';

export async function GET() {
    return NextResponse.json({ languages: SUPPORTED_LANGUAGES });
}

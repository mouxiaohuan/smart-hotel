import { NextResponse } from 'next/server';

export async function GET() {
  const loginUrl = process.env.AUTH_LOGIN_URL;
  if (!loginUrl) return NextResponse.json({ error: 'AUTH_LOGIN_URL is not configured' }, { status: 503 });
  return NextResponse.json({ loginUrl });
}

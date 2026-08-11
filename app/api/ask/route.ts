import { NextResponse } from 'next/server';
import { askEnterpriseKnowledgeBase } from '../../../src/knowledge-graph';

export async function POST(request: Request) {
  try { const body = await request.json(); return NextResponse.json(await askEnterpriseKnowledgeBase(String(body.query ?? '').trim())); }
  catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }
}

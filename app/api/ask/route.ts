import { NextResponse } from 'next/server';
import { askEnterpriseKnowledgeBase } from '../../../src/knowledge-graph';

export async function POST(request: Request) {
  try { const body = await request.json(); const threadId = request.headers.get('x-thread-id') ?? 'default'; return NextResponse.json(await askEnterpriseKnowledgeBase(String(body.query ?? '').trim(), body.orderId, body.now, threadId)); }
  catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }
}

import { NextResponse } from 'next/server';
import { askEnterpriseKnowledgeBase } from '../../../src/knowledge-graph';
import { audit } from '../../../src/agent-harness';

export async function POST(request: Request) {
  try { const body = await request.json(); const threadId = request.headers.get('x-thread-id') ?? 'default'; return NextResponse.json(await askEnterpriseKnowledgeBase(String(body.query ?? '').trim(), body.orderId, body.now, threadId)); }
  catch (error) { audit('api.ask.error', request.headers.get('x-thread-id') ?? 'default', { error: error instanceof Error ? error.message : String(error) }); return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid request' }, { status: 500 }); }
}

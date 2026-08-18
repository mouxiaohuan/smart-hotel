import { NextResponse } from 'next/server';
import { askEnterpriseKnowledgeBase } from '../../../src/knowledge-graph';
import { audit } from '../../../src/agent-harness';
import { AuthError } from '../../../src/auth/member-auth';

export async function POST(request: Request) {
  try { const body = await request.json(); const threadId = request.headers.get('x-thread-id') ?? 'default'; return NextResponse.json(await askEnterpriseKnowledgeBase(String(body.query ?? '').trim(), body.orderId, body.now, threadId, request.headers.get('authorization') ?? undefined)); }
  catch (error) { audit('api.ask.error', request.headers.get('x-thread-id') ?? 'default', { error: error instanceof Error ? error.message : String(error) }); const status = error instanceof AuthError ? (error.code === 'AUTH_FORBIDDEN' ? 403 : 401) : 500; return NextResponse.json({ code: error instanceof AuthError ? error.code : undefined, error: error instanceof Error ? error.message : 'Invalid request' }, { status }); }
}

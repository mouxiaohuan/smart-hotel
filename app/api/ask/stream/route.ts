import { NextResponse } from 'next/server';
import { askEnterpriseKnowledgeBase } from '../../../../src/knowledge-graph';

export async function POST(request: Request) {
  const body = await request.json();
  const threadId = request.headers.get('x-thread-id') ?? 'default';
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      try {
        send('status', { stage: 'started' });
        const result = await askEnterpriseKnowledgeBase(String(body.query ?? '').trim(), body.orderId, body.now, threadId);
        for (const step of result.trace) send('trace', { step });
        send('answer', result);
        send('done', { ok: true });
      } catch (error) { send('error', { message: error instanceof Error ? error.message : 'Agent failed' }); }
      finally { controller.close(); }
    }
  });
  return new NextResponse(stream, { headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' } });
}

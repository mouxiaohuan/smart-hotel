import { NextResponse } from 'next/server';
import { reviewCheckoutRefund } from '../../../../src/workflows/refund-approval';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.threadId || !['approve', 'reject'].includes(body.decision)) return NextResponse.json({ error: 'threadId and decision are required' }, { status: 400 });
    return NextResponse.json(await reviewCheckoutRefund({ threadId: body.threadId, decision: body.decision, note: body.note }));
  } catch { return NextResponse.json({ error: 'Invalid review request' }, { status: 400 }); }
}

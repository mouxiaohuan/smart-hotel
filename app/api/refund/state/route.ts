import { NextResponse } from 'next/server';
import { getRefundRequestState } from '../../../../src/workflows/refund-approval';

export async function GET(request: Request) {
  const threadId = new URL(request.url).searchParams.get('threadId');
  if (!threadId) return NextResponse.json({ error: 'threadId is required' }, { status: 400 });
  const state = await getRefundRequestState(threadId);
  return NextResponse.json(state ?? { error: 'Refund request not found' }, { status: state ? 200 : 404 });
}

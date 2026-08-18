import { NextResponse } from 'next/server';
import { reviewCheckoutRefund } from '../../../../src/workflows/refund-approval';
import { getRefundRequestState } from '../../../../src/workflows/refund-approval';
import { assertEmployeeHotelAccess, requireRefundReviewer } from '../../../../src/auth/employee-auth';
import { AuthError } from '../../../../src/auth/member-auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.threadId || !['approve', 'reject'].includes(body.decision)) return NextResponse.json({ error: 'threadId and decision are required' }, { status: 400 });
    const employee = await requireRefundReviewer(request.headers.get('authorization'));
    const current = await getRefundRequestState(body.threadId);
    if (!current?.hotelId) return NextResponse.json({ error: 'Refund request not found' }, { status: 404 });
    assertEmployeeHotelAccess(employee, current.hotelId);
    return NextResponse.json(await reviewCheckoutRefund({ threadId: body.threadId, decision: body.decision, note: typeof body.note === 'string' ? body.note : '', reviewerId: employee.sub }));
  } catch (error) { const status = error instanceof AuthError ? (error.code === 'AUTH_FORBIDDEN' ? 403 : 401) : 400; return NextResponse.json({ code: error instanceof AuthError ? error.code : undefined, error: error instanceof Error ? error.message : 'Invalid review request' }, { status }); }
}

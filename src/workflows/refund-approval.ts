import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { matchIntentSemantic } from '../intent-knowledge';
import { audit, graphRunConfig, withHarness } from '../agent-harness';
import { loadRefundRequest, refundCheckpointer, saveRefundRequest } from '../refund-state-store';

export type RefundIntent = 'checkout_refund' | 'other';
export type RefundStatus = 'approved' | 'pending_human_review' | 'rejected';

export type HotelOrder = {
  id: string;
  memberId: string;
  hotelId: string;
  guestName: string;
  roomNumber: string;
  amountCny: number;
  checkoutAt: string;
  paymentStatus: 'paid' | 'unpaid';
};

/** Replace this mock source with PMS / payment-provider data in production. */
export const mockHotelOrders: HotelOrder[] = [
  { id: 'HOTEL-1001', memberId: 'member-zhang', hotelId: 'hotel-shanghai', guestName: '张晨', roomNumber: '1208', amountCny: 688, checkoutAt: '2026-08-13T09:30:00+08:00', paymentStatus: 'paid' },
  { id: 'HOTEL-1002', memberId: 'member-li', hotelId: 'hotel-shanghai', guestName: '李静', roomNumber: '806', amountCny: 1288, checkoutAt: '2026-08-13T06:30:00+08:00', paymentStatus: 'paid' },
  { id: 'HOTEL-1003', memberId: 'member-wang', hotelId: 'hotel-beijing', guestName: '王明', roomNumber: '518', amountCny: 520, checkoutAt: '2026-08-13T10:10:00+08:00', paymentStatus: 'unpaid' }
];

export const getHotelOrder = (orderId?: string) => mockHotelOrders.find((order) => order.id === orderId);

const RefundState = Annotation.Root({
  message: Annotation<string>(),
  orderId: Annotation<string | undefined>(),
  memberId: Annotation<string>(),
  hotelId: Annotation<string>(),
  now: Annotation<string>(),
  intent: Annotation<RefundIntent>(),
  order: Annotation<HotelOrder | undefined>(),
  status: Annotation<RefundStatus | undefined>(),
  decisionReason: Annotation<string>(),
  refundId: Annotation<string | undefined>(),
  humanDecision: Annotation<'approve' | 'reject' | undefined>(),
  humanNote: Annotation<string | undefined>(),
  trace: Annotation<string[]>()
});

const classifyIntent = async (state: typeof RefundState.State) => {
  const match = await matchIntentSemantic(state.message);
  const intent: RefundIntent = match.intent.id === 'checkout_refund' ? 'checkout_refund' : 'other';
  return { intent, trace: [...state.trace, `意图识别：${intent}（${match.mode}，${match.score.toFixed(2)}）`] };
};

const findOrder = (state: typeof RefundState.State) => ({
  order: getHotelOrder(state.orderId),
  trace: [...state.trace, '模拟订单查询']
});

const evaluatePolicy = (state: typeof RefundState.State) => {
  if (state.intent !== 'checkout_refund') return { status: 'pending_human_review' as const, decisionReason: '该请求未被识别为退房退款意图，需要人工确认。', trace: [...state.trace, '退款规则校验：意图不确定'] };
  if (!state.order) return { status: 'pending_human_review' as const, decisionReason: '未找到订单或缺少订单号，需要人工核验身份与订单。', trace: [...state.trace, '退款规则校验：订单缺失'] };
  if (state.order.paymentStatus !== 'paid') return { status: 'pending_human_review' as const, decisionReason: '订单付款状态异常，不能自动退款。', trace: [...state.trace, '退款规则校验：付款异常'] };
  const nowMs = Date.parse(state.now);
  const checkoutMs = Date.parse(state.order.checkoutAt);
  if (!Number.isFinite(nowMs) || !Number.isFinite(checkoutMs)) return { status: 'pending_human_review' as const, decisionReason: '订单时间格式无效，需要人工核验。', trace: [...state.trace, '退款规则校验：时间无效'] };
  const elapsedHours = (nowMs - checkoutMs) / 3_600_000;
  if (elapsedHours >= 0 && elapsedHours <= 2) return { status: 'approved' as const, decisionReason: `退房后 ${elapsedHours.toFixed(1)} 小时，符合 2 小时内自动退款政策。`, trace: [...state.trace, '退款规则校验：自动退款'] };
  return { status: 'pending_human_review' as const, decisionReason: `退房后 ${elapsedHours.toFixed(1)} 小时，超过自动退款时限，需要人工确认。`, trace: [...state.trace, '退款规则校验：超时转人工'] };
};

const processImmediateRefund = (state: typeof RefundState.State) => ({
  refundId: `RF-${state.order!.id}-${Date.parse(state.now)}`,
  status: 'approved' as const,
  trace: [...state.trace, '模拟支付网关：退款已提交']
});

const recordHumanDecision = (state: typeof RefundState.State) => {
  if (!state.humanDecision) return { trace: [...state.trace, '等待人工确认'] };
  return {
    status: state.humanDecision === 'approve' ? 'approved' as const : 'rejected' as const,
    refundId: state.humanDecision === 'approve' && state.order ? `RF-MANUAL-${state.order.id}-${Date.parse(state.now)}` : undefined,
    decisionReason: `${state.decisionReason} 人工决定：${state.humanDecision === 'approve' ? '同意退款' : '拒绝退款'}。${state.humanNote ?? ''}`,
    trace: [...state.trace, `人工确认：${state.humanDecision}`]
  };
};

const routeAfterPolicy = (state: typeof RefundState.State) => state.status === 'approved' ? 'process_immediate_refund' : 'human_review';

export const refundGraph = new StateGraph(RefundState)
  .addNode('classify_intent', classifyIntent)
  .addNode('find_order', findOrder)
  .addNode('evaluate_policy', evaluatePolicy)
  .addNode('process_immediate_refund', processImmediateRefund)
  .addNode('human_review', recordHumanDecision)
  .addEdge(START, 'classify_intent')
  .addEdge('classify_intent', 'find_order')
  .addEdge('find_order', 'evaluate_policy')
  .addConditionalEdges('evaluate_policy', routeAfterPolicy, ['process_immediate_refund', 'human_review'])
  .addEdge('process_immediate_refund', END)
  .addEdge('human_review', END)
  .compile({ checkpointer: refundCheckpointer, interruptBefore: ['human_review'] });

export type RefundWorkflowResult = typeof RefundState.State & { threadId: string };

export async function requestCheckoutRefund(input: { message: string; orderId?: string; now?: string; threadId?: string; memberId: string }): Promise<RefundWorkflowResult> {
  const threadId = input.threadId ?? `refund-${crypto.randomUUID()}`;
  const config = graphRunConfig(threadId);
  const result = await withHarness(threadId, () => refundGraph.invoke({
    message: input.message,
    orderId: input.orderId,
    memberId: input.memberId,
    hotelId: getHotelOrder(input.orderId)?.hotelId ?? '',
    now: input.now ?? new Date().toISOString(),
    intent: 'other',
    order: undefined,
    status: undefined,
    decisionReason: '',
    refundId: undefined,
    humanDecision: undefined,
    humanNote: undefined,
    trace: []
  }, graphRunConfig(threadId)), Number(process.env.AGENT_TIMEOUT_MS ?? 20_000));
  const saved = { ...result, threadId };
  await saveRefundRequest(threadId, saved);
  audit('refund.requested', threadId, { memberId: saved.memberId, hotelId: saved.hotelId, orderId: saved.orderId, status: saved.status });
  return saved;
}

export async function reviewCheckoutRefund(input: { threadId: string; decision: 'approve' | 'reject'; note?: string; reviewerId: string }) {
  const config = graphRunConfig(input.threadId);
  const current = await loadRefundRequest<RefundWorkflowResult>(input.threadId) ?? (await refundGraph.getState(config)).values as RefundWorkflowResult;
  if (!current.order) throw new Error('找不到待审核订单，请使用申请退款返回的 threadId。');
  if (current.status !== 'pending_human_review') throw new Error('该退款申请不在待人工审核状态。');
  const approved = input.decision === 'approve';
  const updated = {
    humanDecision: input.decision,
    humanNote: input.note ?? '',
    status: approved ? 'approved' as const : 'rejected' as const,
    refundId: approved ? `RF-MANUAL-${current.order.id}-${Date.parse(current.now)}` : undefined,
    decisionReason: `${current.decisionReason} 人工决定：${approved ? '同意退款' : '拒绝退款'}。${input.note ?? ''}`,
    trace: [...current.trace, `人工确认：${approved ? '同意退款并提交' : '拒绝退款'}`]
  };
  await refundGraph.updateState(config, updated, 'human_review');
  const resumed = await refundGraph.invoke(null, config);
  const saved = { ...resumed, threadId: input.threadId };
  await saveRefundRequest(input.threadId, saved);
  audit('refund.reviewed', input.threadId, { reviewerId: input.reviewerId, memberId: current.memberId, hotelId: current.hotelId, reason: input.note ?? '', previousStatus: current.status, nextStatus: saved.status });
  return saved;
}

export async function getRefundRequestState(threadId: string) {
  return await loadRefundRequest<RefundWorkflowResult>(threadId) ?? (await refundGraph.getState(graphRunConfig(threadId))).values;
}

/**
 * Mock cases: HOTEL-1001 is auto-approved at 10:30; HOTEL-1002 and HOTEL-1003 enter human_review.
 * A reviewer resumes a thread with refundGraph.updateState(config, { humanDecision: 'approve', humanNote: '...' }).
 */

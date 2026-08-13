import 'dotenv/config';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { knowledgeBase, type KnowledgeItem } from '../data/knowledge.js';
import { matchIntentSemantic, type IntentDefinition } from './intent-knowledge.js';
import { requestCheckoutRefund, type RefundStatus, type RefundWorkflowResult } from './workflows/refund-approval.js';
import { audit, graphRunConfig, withHarness } from './agent-harness.js';

type RetrievedItem = KnowledgeItem & { score: number };
const conversationMemory = new Map<string, { orderId?: string; awaitingRefundOrder: boolean }>();

export type KnowledgeAnswer = {
  answer: string;
  sources: Array<{ id: string; title: string; category: string }>;
  confidence: number;
  suggestions: string[];
  trace: string[];
  refund?: { status: RefundStatus; refundId?: string; reason: string };
  threadId?: string;
};

const KnowledgeState = Annotation.Root({
  query: Annotation<string>(),
  intent: Annotation<IntentDefinition['id']>(),
  orderId: Annotation<string | undefined>(),
  now: Annotation<string | undefined>(),
  retrieved: Annotation<RetrievedItem[]>(),
  answer: Annotation<string>(),
  confidence: Annotation<number>(),
  trace: Annotation<string[]>(),
  refund: Annotation<KnowledgeAnswer['refund']>()
  ,threadId: Annotation<string>()
});

function scoreDocument(query: string, document: KnowledgeItem) {
  const queryText = query.toLowerCase().trim();
  const content = `${document.title} ${document.content} ${document.tags.join(' ')}`.toLowerCase();
  const bigrams = Array.from({ length: Math.max(queryText.length - 1, 0) }, (_, i) => queryText.slice(i, i + 2));
  const tagScore = document.tags.reduce((total, tag) => total + (queryText.includes(tag.toLowerCase()) ? 5 : 0), 0);
  const bigramScore = bigrams.reduce((total, unit) => total + (unit.length === 2 && content.includes(unit) ? 1 : 0), 0);
  return (content.includes(queryText) ? 8 : 0) + tagScore + bigramScore;
}

const analyzeQuestion = async (state: typeof KnowledgeState.State) => {
  const match = await matchIntentSemantic(state.query);
  return { intent: match.intent.id, trace: [...state.trace, `意图识别：${match.intent.label}（${match.mode}，${match.score.toFixed(2)}）`] };
};

const delegateRefund = async (state: typeof KnowledgeState.State) => {
  const result = await requestCheckoutRefund({ message: state.query, orderId: state.orderId, now: state.now, threadId: state.threadId });
  const answer = !state.orderId
    ? '好的，我可以帮你办理退款。请提供订单号，例如 HOTEL-1001。'
    : result.status === 'approved'
    ? `退款申请已通过，退款金额为 ${result.order?.amountCny ?? 0} 元，退款单号：${result.refundId}。`
    : `退款申请需要人工确认。${result.decisionReason}`;
  return {
    answer,
    confidence: result.status === 'approved' ? 0.98 : 0.72,
    refund: { status: result.status!, refundId: result.refundId, reason: result.decisionReason },
    threadId: result.threadId,
    trace: [...state.trace, '委派退款审批工作流', ...result.trace]
  };
};

const routeIntent = (state: typeof KnowledgeState.State) => state.intent === 'checkout_refund' ? 'delegate_refund' : 'retrieve_knowledge';

const retrieveKnowledge = (state: typeof KnowledgeState.State) => ({
  retrieved: knowledgeBase
    .map((document) => ({ ...document, score: scoreDocument(state.query, document) }))
    .filter((document) => document.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3),
  trace: [...state.trace, '知识检索']
});

const composeAnswer = async (state: typeof KnowledgeState.State) => {
  const primary = state.retrieved[0];
  
  if (!primary) {
    return {
      answer: '我没有在当前已授权的酒店知识库中找到可靠答案。为了避免提供不准确的信息，建议转接人工管家确认。',
      confidence: 0.28,
      trace: [...state.trace, '答案生成：转人工']
    };
  }
  let answer = `关于“${state.query}”，${primary.content}`;
  let generationTrace = '答案生成';
  if (process.env.OPENAI_API_KEY) {
    try {
      const model = new ChatOpenAI({ model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini', temperature: 0 });
      const context = state.retrieved.map((item) => `[${item.category}] ${item.title}: ${item.content}`).join('\n');
      const response = await model.invoke([
        ['system', '你是酒店企业知识库专家。只能依据提供的知识回答；如果知识不足，明确说需要人工确认。回答简洁、友好，使用中文。'],
        ['human', `客户问题：${state.query}\n\n已检索知识：\n${context}`]
      ]);
      answer = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
      generationTrace = 'OpenAI 答案生成';
    } catch (error) {
      console.warn('OpenAI unavailable, using deterministic answer:', error instanceof Error ? error.message : error);
    }
  }
  return { answer, confidence: Math.min(0.98, 0.62 + primary.score * 0.04), trace: [...state.trace, generationTrace] };
};

const verifyAnswer = (state: typeof KnowledgeState.State) => ({
  confidence: state.retrieved.length ? state.confidence : 0.28,
  trace: [...state.trace, '可信度校验']
});

export const enterpriseKnowledgeGraph = new StateGraph(KnowledgeState)
  .addNode('analyze_question', analyzeQuestion)
  .addNode('delegate_refund', delegateRefund)
  .addNode('retrieve_knowledge', retrieveKnowledge)
  .addNode('compose_answer', composeAnswer)
  .addNode('verify_answer', verifyAnswer)
  .addEdge(START, 'analyze_question')
  .addConditionalEdges('analyze_question', routeIntent, ['delegate_refund', 'retrieve_knowledge'])
  .addEdge('delegate_refund', END)
  .addEdge('retrieve_knowledge', 'compose_answer')
  .addEdge('compose_answer', 'verify_answer')
  .addEdge('verify_answer', END)
  .compile();



export async function askEnterpriseKnowledgeBase(query: string, orderId?: string, now?: string, threadId = 'default'): Promise<KnowledgeAnswer> {
  const previous = conversationMemory.get(threadId) ?? { awaitingRefundOrder: false };
  const extractedOrderId = orderId ?? query.match(/HOTEL-\d+/i)?.[0]?.toUpperCase() ?? previous.orderId;
  const effectiveOrderId = extractedOrderId;
  const isRefundRequest = /退款|退房|退押金/.test(query);
  conversationMemory.set(threadId, { orderId: effectiveOrderId, awaitingRefundOrder: isRefundRequest && !effectiveOrderId });
  const effectiveQuery = previous.awaitingRefundOrder && effectiveOrderId
    ? `我要退房退款，订单 ${effectiveOrderId}`
    : isRefundRequest && !effectiveOrderId && previous.orderId
      ? `${query} 订单 ${previous.orderId}`
      : query;
  const result = await withHarness(threadId, () => enterpriseKnowledgeGraph.invoke({
    query: effectiveQuery,
    intent: 'general',
    orderId: effectiveOrderId,
    now: now ?? process.env.MOCK_NOW,
    retrieved: [],
    answer: '',
    confidence: 0,
    trace: [],
    refund: undefined
    ,threadId
  }, graphRunConfig(threadId)), Number(process.env.AGENT_TIMEOUT_MS ?? 20_000));
  audit('answer.completed', threadId, { intent: result.intent, refundStatus: result.refund?.status });
  const sources = result.retrieved.map(({ id, title, category }) => ({ id, title, category }));
  return {
    answer: result.answer,
    sources,
    confidence: result.confidence,
    suggestions: sources.slice(0, 2).map((source) => source.title),
    trace: result.trace,
    refund: result.refund
    ,threadId: result.threadId
  };
}

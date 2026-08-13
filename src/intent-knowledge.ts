export type IntentDefinition = {
  id: 'checkout_refund' | 'checkin_policy' | 'dining' | 'wellness' | 'transport' | 'room' | 'general';
  label: string;
  examples: string[];
  keywords: string[];
  route: 'refund_workflow' | 'knowledge_retrieval';
};

/** Shared, deterministic intent knowledge used before any model invocation. */
export const intentKnowledgeBase: IntentDefinition[] = [
  { id: 'checkout_refund', label: '退房退款', examples: ['我要退房退款', '退房后可以退款吗', '帮我退押金', '申请退房退款', '离店后想把房费退回来'], keywords: ['退房退款', '退款退房', '退押金', '退款', '离店', '退回房费'], route: 'refund_workflow' },
  { id: 'checkin_policy', label: '入住政策', examples: ['几点可以入住', '可以带宠物吗', '提前到酒店能办理入住吗'], keywords: ['入住', '退房', '宠物', '取消', '改期'], route: 'knowledge_retrieval' },
  { id: 'dining', label: '餐饮服务', examples: ['早餐几点开始', '餐厅在哪', '早饭在哪里吃'], keywords: ['早餐', '餐厅', '用餐'], route: 'knowledge_retrieval' },
  { id: 'wellness', label: '康体设施', examples: ['泳池几点关闭', '健身房在哪', '酒店有游泳池吗'], keywords: ['游泳', '泳池', '健身'], route: 'knowledge_retrieval' },
  { id: 'transport', label: '交通服务', examples: ['机场接送怎么预约', '可以停车吗', '有没有接机服务'], keywords: ['停车', '机场', '接送'], route: 'knowledge_retrieval' },
  { id: 'room', label: '房型信息', examples: ['行政大床房多大', '可以加婴儿床吗', '这个房间住几个人'], keywords: ['房型', '大床', '套房', '婴儿床'], route: 'knowledge_retrieval' },
  { id: 'general', label: '通用咨询', examples: [], keywords: [], route: 'knowledge_retrieval' }
];

export function matchIntent(query: string): IntentDefinition {
  const normalized = query.replace(/\s/g, '');
  return intentKnowledgeBase.find((intent) => intent.id !== 'general' && (
    intent.keywords.some((keyword) => normalized.includes(keyword)) ||
    intent.examples.some((example) => normalized.includes(example.replace(/\s/g, '')))
  )) ?? intentKnowledgeBase.at(-1)!;
}

const embeddings = new OpenAIEmbeddings({ model: process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small' });
let vectorIndexPromise: Promise<Array<{ intent: IntentDefinition; example: string; vector: number[] }>> | undefined;

function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0; let normA = 0; let normB = 0;
  for (let i = 0; i < a.length; i += 1) { dot += a[i] * b[i]; normA += a[i] ** 2; normB += b[i] ** 2; }
  return normA && normB ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
}

async function getVectorIndex() {
  if (!vectorIndexPromise) {
    const entries = intentKnowledgeBase.filter((intent) => intent.id !== 'general').flatMap((intent) => intent.examples.map((example) => ({ intent, example })));
    vectorIndexPromise = embeddings.embedDocuments(entries.map((entry) => entry.example)).then((vectors) => entries.map((entry, index) => ({ ...entry, vector: vectors[index] })));
  }
  return vectorIndexPromise;
}

/** Semantic intent retrieval with a conservative 0.55 threshold and deterministic fallback. */
export async function matchIntentSemantic(query: string): Promise<{ intent: IntentDefinition; score: number; mode: 'vector' | 'keyword' }> {
  if (!process.env.OPENAI_API_KEY) return { intent: matchIntent(query), score: 1, mode: 'keyword' };
  try {
    const [queryVector, index] = await Promise.all([embeddings.embedQuery(query), getVectorIndex()]);
    const best = index.map((entry) => ({ ...entry, score: cosineSimilarity(queryVector, entry.vector) })).sort((a, b) => b.score - a.score)[0];
    if (best && best.score >= 0.55) return { intent: best.intent, score: best.score, mode: 'vector' };
  } catch (error) {
    console.warn('Intent embedding unavailable, using keyword fallback:', error instanceof Error ? error.message : error);
  }
  return { intent: matchIntent(query), score: 0, mode: 'keyword' };
}
import 'dotenv/config';
import { OpenAIEmbeddings } from '@langchain/openai';

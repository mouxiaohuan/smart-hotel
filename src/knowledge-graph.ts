import 'dotenv/config';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { knowledgeBase, type KnowledgeItem } from '../data/knowledge.js';

type RetrievedItem = KnowledgeItem & { score: number };

export type KnowledgeAnswer = {
  answer: string;
  sources: Array<{ id: string; title: string; category: string }>;
  confidence: number;
  suggestions: string[];
  trace: string[];
};

const KnowledgeState = Annotation.Root({
  query: Annotation<string>(),
  intent: Annotation<string>(),
  retrieved: Annotation<RetrievedItem[]>(),
  answer: Annotation<string>(),
  confidence: Annotation<number>(),
  trace: Annotation<string[]>()
});

function scoreDocument(query: string, document: KnowledgeItem) {
  const queryText = query.toLowerCase().trim();
  const content = `${document.title} ${document.content} ${document.tags.join(' ')}`.toLowerCase();
  const bigrams = Array.from({ length: Math.max(queryText.length - 1, 0) }, (_, i) => queryText.slice(i, i + 2));
  const tagScore = document.tags.reduce((total, tag) => total + (queryText.includes(tag.toLowerCase()) ? 5 : 0), 0);
  const bigramScore = bigrams.reduce((total, unit) => total + (unit.length === 2 && content.includes(unit) ? 1 : 0), 0);
  return (content.includes(queryText) ? 8 : 0) + tagScore + bigramScore;
}

function classifyIntent(query: string) {
  const mappings: Record<string, string[]> = {
    '入住政策': ['入住', '退房', '宠物', '取消', '改期'],
    '餐饮服务': ['早餐', '餐厅', '用餐'],
    '康体设施': ['游泳', '泳池', '健身'],
    '交通服务': ['停车', '机场', '接送'],
    '房型信息': ['房型', '大床', '套房', '婴儿床']
  };
  return Object.entries(mappings).find(([, keywords]) => keywords.some((keyword) => query.includes(keyword)))?.[0] ?? '通用咨询';
}

const analyzeQuestion = (state: typeof KnowledgeState.State) => ({
  intent: classifyIntent(state.query),
  trace: [...state.trace, '问题分析']
});

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
  .addNode('retrieve_knowledge', retrieveKnowledge)
  .addNode('compose_answer', composeAnswer)
  .addNode('verify_answer', verifyAnswer)
  .addEdge(START, 'analyze_question')
  .addEdge('analyze_question', 'retrieve_knowledge')
  .addEdge('retrieve_knowledge', 'compose_answer')
  .addEdge('compose_answer', 'verify_answer')
  .addEdge('verify_answer', END)
  .compile();



export async function askEnterpriseKnowledgeBase(query: string): Promise<KnowledgeAnswer> {
  const result = await enterpriseKnowledgeGraph.invoke({
    query,
    intent: '通用咨询',
    retrieved: [],
    answer: '',
    confidence: 0,
    trace: []
  });
  const sources = result.retrieved.map(({ id, title, category }) => ({ id, title, category }));
  return {
    answer: result.answer,
    sources,
    confidence: result.confidence,
    suggestions: sources.slice(0, 2).map((source) => source.title),
    trace: result.trace
  };
}

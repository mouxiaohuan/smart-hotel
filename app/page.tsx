'use client';

import { FormEvent, useEffect, useState } from 'react';

type Source = { id: string; title: string; category: string };
type Result = { answer: string; sources: Source[]; confidence: number; suggestions: string[]; trace: string[] };
type Message = { role: 'user' | 'bot'; text: string; meta?: string };

const quickQuestions = ['早餐几点开始？', '可以带宠物入住吗？', '行政大床房适合几个人住？', '机场接送怎么预约？'];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([{ role: 'bot', text: '你好，我是 Smart Hotel 智能管家。你可以直接问我入住政策、房型、早餐、设施或交通服务。' }]);
  const [question, setQuestion] = useState('');
  const [knowledge, setKnowledge] = useState<{ title: string; category: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [threadId] = useState(() => `web-${crypto.randomUUID()}`);

  useEffect(() => { fetch('/api/knowledge').then((res) => res.json()).then(setKnowledge); }, []);
  async function ask(value: string) {
    const query = value.trim(); if (!query || loading) return;
    setQuestion(''); setMessages((items) => [...items, { role: 'user', text: query }]); setLoading(true);
    try {
      const response = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-thread-id': threadId }, body: JSON.stringify({ query }) });
      const data = (await response.json()) as Result;
      const source = data.sources.length ? `来源：${data.sources.map((item) => `${item.category} / ${item.title}`).join('；')} | ` : '';
      setMessages((items) => [...items, { role: 'bot', text: data.answer, meta: `${source}置信度：${Math.round(data.confidence * 100)}% | ${data.trace.join(' → ')}` }]);
    } catch { setMessages((items) => [...items, { role: 'bot', text: '服务暂时不可用，请稍后重试或联系人工管家。' }]); }
    setLoading(false);
  }
  function submit(event: FormEvent) { event.preventDefault(); ask(question); }

  return <div className="shell"><aside className="sidebar"><div><p className="eyebrow">Smart Hotel</p><h1>酒店智能问答系统</h1><p className="summary">把房型、政策和服务知识变成一个会说话的前台专家，支持住前咨询、住中服务答疑和人工转接兜底。</p></div><section className="panel"><h2>知识范围</h2><ul>{knowledge.map((item) => <li key={item.title}><strong>{item.title}</strong><br />{item.category}</li>)}</ul></section></aside><main className="main"><section className="hero"><div><p className="eyebrow">Guest Support</p><h2>像酒店金牌管家一样回答问题</h2><p>示例：可以带宠物吗？早餐几点开始？机场接送怎么预约？</p></div><div className="metrics"><div><span>知识条目</span><strong>{knowledge.length || 8}</strong></div><div><span>工作流</span><strong>LangGraph + OpenAI</strong></div></div></section><section className="chat-card"><div className="messages">{messages.map((message, index) => <div key={index} className={`message ${message.role}`}><div>{message.text}</div>{message.meta && <div className="meta">{message.meta}</div>}</div>)}{loading && <div className="message bot">正在检索企业知识并生成回答…</div>}</div><form onSubmit={submit} className="composer"><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="请输入客户问题" autoComplete="off" /><button type="submit" disabled={loading}>发送</button></form><div className="quick-actions">{quickQuestions.map((item) => <button key={item} onClick={() => ask(item)}>{item}</button>)}</div></section></main></div>;
}

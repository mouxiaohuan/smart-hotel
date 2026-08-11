type Source = { id: string; title: string; category: string };
type AskResponse = { answer: string; confidence: number; suggestions: string[]; sources: Source[]; trace: string[] };
type KnowledgeItem = { id: string; category: string; title: string; content: string; tags: string[]; updatedAt: string };

const messages = document.querySelector<HTMLDivElement>('#messages');
const form = document.querySelector<HTMLFormElement>('#chat-form');
const input = document.querySelector<HTMLInputElement>('#question');
const knowledgeList = document.querySelector<HTMLUListElement>('#knowledge-list');
const kbCount = document.querySelector<HTMLElement>('#kb-count');

function appendMessage(role: 'user' | 'bot', text: string, meta?: string) {
  if (!messages) return;
  const item = document.createElement('div');
  item.className = `message ${role}`;
  item.innerHTML = `<div>${text}</div>${meta ? `<div class="meta">${meta}</div>` : ''}`;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
}

async function ask(question: string) {
  appendMessage('user', question);
  const response = await fetch('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: question })
  });
  const data = (await response.json()) as AskResponse;
  const sourceText = `${data.sources.length ? `来源：${data.sources.map((s) => `${s.category} / ${s.title}`).join('；')} | ` : ''}置信度：${Math.round(data.confidence * 100)}% | 流程：${data.trace.join(' → ')}`;
  appendMessage('bot', data.answer, sourceText);
  if (data.suggestions.length) {
    appendMessage('bot', `你还可以继续问：${data.suggestions.join('、')}`);
  }
}

async function loadKnowledge() {
  const response = await fetch('/api/knowledge');
  const data = (await response.json()) as KnowledgeItem[];
  if (kbCount) kbCount.textContent = String(data.length);
  if (knowledgeList) {
    knowledgeList.innerHTML = data.map((item) => `<li><strong>${item.title}</strong><br />${item.category}</li>`).join('');
  }
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const question = input?.value.trim();
  if (!question) return;
  if (input) input.value = '';
  await ask(question);
});

document.querySelectorAll<HTMLButtonElement>('[data-question]').forEach((button) => {
  button.addEventListener('click', async () => {
    const question = button.dataset.question;
    if (question) await ask(question);
  });
});

appendMessage('bot', '你好，我是 Smart Hotel 智能管家。你可以直接问我入住政策、房型、早餐、设施或交通服务。');
loadKnowledge();

# Smart Hotel 项目协作说明

## 技术栈

- Next.js App Router + React + TypeScript
- LangGraph.js：企业知识库问答工作流
- LangChain OpenAI：回答生成
- LangSmith：Tracing 与运行追踪

## 目录约定

- `app/`：Next.js 页面和 Route Handler
- `src/knowledge-graph.ts`：LangGraph 图定义与问答入口
- `src/intent-knowledge.ts`：共享意图知识库与确定性路由规则
- `src/workflows/`：需要人工参与的业务工作流，例如退房退款审批
- `data/knowledge.ts`：模拟酒店知识库
- `langgraph.json`：LangGraph Studio 图注册配置
- `.env`：本地密钥和 tracing 配置，不允许提交到 Git

## 环境变量

从 `.env.example` 复制为 `.env`，填写：

```env
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
LANGSMITH_TRACING=true
LANGCHAIN_TRACING_V2=true
LANGSMITH_PROJECT=smart-hotel-enterprise-kb
LANGSMITH_API_KEY=your-langsmith-api-key
```

不要在源码、日志、提交信息或前端代码中写入任何 API Key。

## 本地命令

```bash
npm install
npm run dev       # Next.js，默认 http://localhost:4173
npm run studio    # LangGraph Studio API，默认 http://localhost:2024
npm run build
npx tsc --noEmit
```

LangGraph Studio 使用 `langgraph.json` 中的 `enterprise_knowledge` 图。修改图节点后重启 Studio 或等待热重载。

## 开发约定

- 问答必须优先引用知识库内容，检索不到时明确转人工，不编造酒店政策。
- 新增酒店数据时保持 `KnowledgeItem` 字段结构，并补充 `tags` 以改善中文检索。
- API Route 返回 JSON；前端只通过 `/api/ask` 和 `/api/knowledge` 获取数据。
- 修改后至少运行 `npx tsc --noEmit` 和 `npm run build`。

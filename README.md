# Smart Hotel

一个基于 LangGraph.js 的 TypeScript 企业知识库问答系统原型，用于把酒店内部知识转成可交互的专家助手。

## 功能

- 酒店知识库：内置入住政策、房型、餐饮、交通、设施等结构化知识
- LangGraph.js 工作流：问题分析 → 知识检索 → 答案生成 → 可信度校验
- 智能问答：返回答案、来源、置信度和完整工作流轨迹
- 前台界面：可直接在浏览器中模拟客户提问，适合做产品原型和演示
- 易于扩展：后续可替换为向量检索、RAG、OpenAI Responses API 或企业私有知识源

## 启动

```bash
npm install
npm run build
npm run dev
```

默认地址：`http://localhost:4173`

## Tracing

项目已开启 LangSmith 自动追踪。将 `LANGSMITH_API_KEY` 写入本地 `.env` 后，LangGraph 节点、OpenAI 调用和输入输出会出现在 `smart-hotel-enterprise-kb` 项目中；没有 Key 时仍可在本地 Studio 查看节点状态。

## 目录

- `data/knowledge.ts`：酒店知识库
- `src/knowledge-graph.ts`：LangGraph.js 企业知识库工作流
- `server.ts`：HTTP 服务和问答接口
- `src/client.ts`：前端交互逻辑
- `public/`：页面和样式

## 后续升级建议

1. 接入真实大模型 API，把 `answer()` 改成 RAG 流程。
2. 增加多轮会话记忆与意图识别，例如投诉、催服务、升级房型。
3. 接入后台 CMS，让运营人员可维护酒店知识条目。

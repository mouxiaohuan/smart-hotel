import 'dotenv/config';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { knowledgeBase } from './data/knowledge.js';
import { askEnterpriseKnowledgeBase } from './src/knowledge-graph.js';

const root = fileURLToPath(new URL('.', import.meta.url));
const publicDir = join(root, 'public');
const port = Number(process.env.PORT || 4173);

const mime: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/api/ask' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', async () => { try { const { query } = JSON.parse(body); const result = await askEnterpriseKnowledgeBase(String(query || '').trim()); res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(result)); } catch { res.writeHead(400); res.end(JSON.stringify({ error: 'Invalid request' })); } });
    return;
  }
  if (url.pathname === '/api/knowledge') { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(knowledgeBase)); return; }
  const requested = url.pathname === '/' ? '/index.html' : url.pathname;
  try { const file = await readFile(join(publicDir, requested)); res.writeHead(200, { 'Content-Type': mime[extname(requested)] || 'application/octet-stream' }); res.end(file); } catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(port, () => console.log(`Smart Hotel running at http://localhost:${port}`));

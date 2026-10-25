#!/usr/bin/env node
/**
 * serve.mjs —— 极简本地预览服务器
 *
 * 只监听 127.0.0.1；只提供 dist/index.html；GET/HEAD；
 * 其余路径一律 404；不暴露仓库目录。
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TARGET = path.join(ROOT, 'dist/index.html');
const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT || 4173);

if (!fs.existsSync(TARGET)) {
  console.error('找不到 dist/index.html —— 请先运行 npm run build');
  process.exit(1);
}

const body = fs.readFileSync(TARGET);

const server = http.createServer((req, res) => {
  const method = req.method || 'GET';
  const url = req.url || '/';

  if (method !== 'GET' && method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8', Allow: 'GET, HEAD' });
    res.end('只支持 GET / HEAD');
    return;
  }

  const pathname = url.split('?')[0];

  if (pathname !== '/' && pathname !== '/index.html') {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 —— 本预览只提供 dist/index.html');
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': String(body.length),
    'Cache-Control': 'no-store'
  });
  res.end(method === 'HEAD' ? undefined : body);
});

server.listen(PORT, HOST, () => {
  console.log(`预览服务已启动：http://${HOST}:${PORT}/`);
  console.log('（只提供 dist/index.html；按 Ctrl+C 停止）');
});

/**
 * build.test.mjs —— 构建产物守卫
 * 验证 dist/index.html 是真正自足的单文件：无外链、无 module、file:// 可用。
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist/index.html');

const html = fs.existsSync(DIST) ? fs.readFileSync(DIST, 'utf8') : '';
const halls = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/content/halls.json'), 'utf8'));

test('构建产物存在且非空', () => {
  assert.ok(fs.existsSync(DIST), 'dist/index.html 不存在 —— 先运行 npm run build');
  assert.ok(html.length > 100000, '产物过小，可能没有内联资源');
});

test('单文件：无外部脚本 / 样式表 / 模块', () => {
  assert.equal(/<script[^>]+src\s*=/i.test(html), false, '存在 <script src>');
  assert.equal(/<script[^>]+type\s*=\s*["']module["']/i.test(html), false, '存在 type="module"');
  assert.equal(
    /<link[^>]+rel\s*=\s*["']stylesheet["'][^>]*href\s*=/i.test(html),
    false,
    '存在外链样式表'
  );
  assert.equal(/@import\s/i.test(html), false, '存在 @import');
});

test('单文件：无运行时网络依赖', () => {
  assert.equal(/\bfetch\s*\(/.test(html), false, '存在 fetch()');
  assert.equal(/\bXMLHttpRequest\b/.test(html), false, '存在 XMLHttpRequest');
  assert.equal(/\bnew\s+WebSocket\b/.test(html), false, '存在 WebSocket');
  assert.equal(/url\(\s*["']?https?:/i.test(html), false, 'CSS 中存在远程 url()');
  assert.equal(
    /<(?:img|audio|video|source|iframe|embed|object)[^>]+src\s*=\s*["']https?:/i.test(html),
    false,
    '存在远程资源 src'
  );
});

test('链接里的 https 跳转仍然存在（用户主动点击才联网）', () => {
  const links = html.match(/<a[^>]*href="https:\/\/[^"]*"[^>]*>/g) || [];
  assert.ok(links.length >= 5, '资料链接数量不足');
  const external = links.filter((l) => !/rel="noopener noreferrer"/.test(l));
  assert.equal(external.length, 0, '外链必须带 rel="noopener noreferrer"');
});

test('产物体积在预算内（硬门槛 1.2 MiB，目标 ≤900 KiB）', () => {
  const bytes = fs.statSync(DIST).size;
  const kib = bytes / 1024;
  assert.ok(bytes < 1.2 * 1024 * 1024, `超过 1.2 MiB 硬门槛：${kib.toFixed(1)} KiB`);
  assert.ok(kib <= 900, `超过 900 KiB 目标：${kib.toFixed(1)} KiB`);
});

test('字体已本地内嵌（不得出现远程字体 URL）', () => {
  assert.equal(/fonts\.(googleapis|gstatic)\.com/i.test(html), false);
  assert.ok(html.includes('@font-face'), '缺少 @font-face');
  assert.ok(html.includes('data:font/woff2;base64,'), '缺少内嵌 woff2');
});

test('四张建筑 SVG 全部内联，且带可访问的 title / desc', () => {
  for (const n of ['axis', 'taihe', 'zhonghe', 'baohe']) {
    assert.ok(html.includes(`id="${n}-title"`), `${n} 缺少 <title>`);
    assert.ok(html.includes(`id="${n}-desc"`), `${n} 缺少 <desc>`);
    assert.ok(html.includes('viewBox="0 0 1200 720"'), `${n} viewBox 不符`);
  }
  assert.equal(html.includes('<!--__SVG:'), false, 'SVG 注入标志未替换');
});

test('正文与 halls.json 一致（三组名称 + 屋顶 + 面积 + 匾额 + 对联 + 开间）', () => {
  const ROOF_LABEL = {
    'double-hip': '重檐庑殿顶',
    'single-pyramidal': '单檐四角攒尖顶',
    'double-hip-gable': '重檐歇山顶'
  };
  const BAYS = {
    taihe: /11\s*间\s*[×x]\s*5\s*间/,
    zhonghe: /3\s*间\s*[×x]\s*3\s*间/,
    baohe: /9\s*间\s*[×x]\s*5\s*间/
  };
  for (const h of halls) {
    assert.ok(html.includes(h.name), `缺少殿名 ${h.name}`);
    assert.ok(html.includes(ROOF_LABEL[h.roof]), `缺少屋顶 ${h.name}`);
    assert.ok(html.includes(String(h.areaSqm)), `缺少面积 ${h.name}`);
    assert.ok(html.includes(h.plaque), `缺少匾额 ${h.name}`);
    assert.ok(html.includes(h.couplet), `缺少对联 ${h.name}`);
    assert.ok(BAYS[h.id].test(html), `缺少开间 ${h.name}`);
  }
});

test('正文不依赖 JS 注入（HTML 里直接有全部三殿事实）', () => {
  // 禁掉 JS 后也应能读到关键事实 —— 这里检查 HTML 源码里就有
  assert.ok(html.includes('帝命式于九围'));
  assert.ok(html.includes('时乘六龙以御天'));
  assert.ok(html.includes('祖训昭垂我后嗣子孙'));
  assert.ok(html.includes('建极绥猷'));
  assert.ok(html.includes('允执厥中'));
  assert.ok(html.includes('皇建有极'));
});

test('注入标志全部替换完毕', () => {
  for (const marker of ['<!--__CSS__-->', '<!--__JS__-->', '/*__FONT_FACE__*/', '/*__HALL_DATA__*/']) {
    assert.equal(html.includes(marker), false, `未替换：${marker}`);
  }
});

test('hall-data 以 JSON 形式内嵌且可解析', () => {
  const m = html.match(/<script type="application\/json" id="hall-data">([\s\S]*?)<\/script>/);
  assert.ok(m, '缺少 hall-data');
  const parsed = JSON.parse(m[1]);
  assert.equal(parsed.length, 3);
  assert.equal(parsed[0].id, 'taihe');
});

test('构建可重复（两次构建字节一致）', () => {
  const before = fs.readFileSync(DIST);
  const shaBefore = crypto.createHash('sha256').update(before).digest('hex');
  execFileSync(process.execPath, [path.join(ROOT, 'scripts/build.mjs')], {
    cwd: ROOT,
    stdio: 'ignore'
  });
  const after = fs.readFileSync(DIST);
  const shaAfter = crypto.createHash('sha256').update(after).digest('hex');
  assert.equal(shaAfter, shaBefore, '重复构建的字节结果不一致');
});

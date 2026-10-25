#!/usr/bin/env node
/**
 * evidence.mjs —— 生成本轮验收的可复核证据文件
 *
 * 产出（全部写进 reports/evidence/）：
 *   contrast.json          颜色样本 CR 表（sRGB 标准算法，逐对计算）
 *   browser-errors.json    console error / pageerror 清单
 *   network.json           全部网络请求分类（外部 / 本地 / file://）
 *   perf-navigation.json   导航计时（domInteractive / loadEventEnd / 首屏可交互）
 *
 * 这是与产品无关的校验脚本，只读输入、只输出结论。
 */

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EVIDENCE = path.join(ROOT, 'reports/evidence');
const DIST = path.join(ROOT, 'dist/index.html');
const FILE_URL = pathToFileURL(DIST).href;

fs.mkdirSync(EVIDENCE, { recursive: true });

/* ---------------- 1. 对比度表 ---------------- */

const tokensSrc = fs.readFileSync(path.join(ROOT, 'src/styles/tokens.css'), 'utf8');

function token(name) {
  const m = tokensSrc.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})`));
  if (!m) throw new Error('tokens.css 缺少 --' + name);
  return m[1];
}

const lin = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};
const lum = (hex) => {
  const h = hex.replace('#', '');
  const s = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16)).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const cr = (a, b) => {
  const l1 = lum(a);
  const l2 = lum(b);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
};

const PAIRS = [
  ['text-primary', 'bg-page', 4.5, '深底正文'],
  ['text-secondary', 'bg-page', 4.5, '深底次级正文'],
  ['text-muted', 'bg-page', 4.5, '深底三级注释'],
  ['text-primary', 'bg-panel', 4.5, '面板上的标题'],
  ['text-secondary', 'bg-panel', 4.5, '面板上的正文'],
  ['text-muted', 'bg-panel', 4.5, '面板上的三级'],
  ['text-primary', 'bg-raised', 4.5, '浮层上的标题'],
  ['text-secondary', 'bg-raised', 4.5, '浮层上的正文'],
  ['text-primary', 'bg-ink', 4.5, '建筑舞台上的文字'],
  ['text-secondary', 'bg-ink', 4.5, '舞台上的次级'],
  ['text-on-paper', 'bg-paper', 4.5, '纸面主文本'],
  ['text-paper-secondary', 'bg-paper', 4.5, '纸面次文本'],
  ['text-paper-muted', 'bg-paper', 4.5, '纸面三级'],
  ['accent-gold', 'bg-page', 4.5, '金色强调（深底）'],
  ['accent-gold', 'bg-panel', 4.5, '金色强调（面板）'],
  ['accent-jade', 'bg-page', 4.5, '青玉强调'],
  ['focus', 'bg-page', 4.5, '焦点色（深底）'],
  ['state-success', 'bg-page', 4.5, '成功态'],
  ['state-warning', 'bg-page', 4.5, '警告态'],
  ['state-danger', 'bg-page', 4.5, '错误态'],
  ['state-info', 'bg-page', 4.5, '信息态'],
  ['state-success-paper', 'bg-paper', 4.5, '纸面成功态'],
  ['state-warning-paper', 'bg-paper', 4.5, '纸面警告态'],
  ['state-danger-paper', 'bg-paper', 4.5, '纸面错误态'],
  ['state-info-paper', 'bg-paper', 4.5, '纸面信息态'],
  ['accent-vermilion', 'bg-paper', 4.5, '纸面朱色强调'],
  ['border-dark', 'bg-page', 3, '深底控件边框'],
  ['border-dark', 'bg-panel', 3, '面板控件边框'],
  ['border-dark', 'bg-raised', 3, '浮层控件边框'],
  ['border-dark', 'bg-ink', 3, '舞台描边'],
  ['border-paper', 'bg-paper', 3, '纸面描边'],
  ['ink-line', 'bg-ink', 3, '建筑主轮廓线'],
  ['ink-line-soft', 'bg-ink', 3, '建筑内部纹理线'],
  ['tile-gold', 'bg-ink', 3, '琉璃瓦面'],
  ['tile-vermilion', 'bg-ink', 3, '朱柱'],
  ['stone-light', 'bg-ink', 3, '汉白玉台基'],
  ['disabled-text', 'bg-page', 2, '禁用态'],
  ['disabled-text', 'bg-panel', 2, '禁用态（面板）']
];

const contrast = PAIRS.map(([fg, bg, min, label]) => {
  const ratio = cr(token(fg), token(bg));
  return {
    label,
    foreground: fg,
    foregroundHex: token(fg),
    background: bg,
    backgroundHex: token(bg),
    ratio: Number(ratio.toFixed(2)),
    required: min,
    pass: ratio >= min
  };
});

const contrastOut = {
  algorithm: 'sRGB：c<=0.04045 ? c/12.92 : ((c+0.055)/1.055)^2.4；L=0.2126R+0.7152G+0.0722B；CR=(Lmax+0.05)/(Lmin+0.05)',
  generatedBy: 'scripts/evidence.mjs',
  total: contrast.length,
  passed: contrast.filter((c) => c.pass).length,
  failed: contrast.filter((c) => !c.pass).length,
  pairs: contrast
};
fs.writeFileSync(
  path.join(EVIDENCE, 'contrast.json'),
  JSON.stringify(contrastOut, null, 2) + '\n',
  'utf8'
);

/* ---------------- 2. 浏览器错误 / 网络 / 导航计时 ---------------- */

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const consoleErrors = [];
const pageErrors = [];
const requests = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => pageErrors.push(String(e)));
page.on('request', (r) => requests.push({ url: r.url(), method: r.method(), type: r.resourceType() }));

await page.goto(FILE_URL);
await page.waitForTimeout(1500);

const nav = await page.evaluate(() => {
  const n = performance.getEntriesByType('navigation')[0] || {};
  const paint = performance.getEntriesByType('paint').map((p) => ({ name: p.name, startTime: p.startTime }));
  const fcp = paint.find((p) => p.name === 'first-contentful-paint');
  const cta = document.querySelector('.hero__cta');
  return {
    domContentLoaded: n.domContentLoadedEventEnd ?? null,
    domInteractive: n.domInteractive ?? null,
    loadEventEnd: n.loadEventEnd ?? null,
    transferSize: n.transferSize ?? null,
    decodedBodySize: n.decodedBodySize ?? null,
    firstContentfulPaint: fcp ? fcp.startTime : null,
    heroCtaVisible: cta ? cta.getBoundingClientRect().top < innerHeight : false,
    documentHeight: document.documentElement.scrollHeight
  };
});

// 交互反馈时间：点击 CTA 后到 aria-current 变化
const feedback = await page.evaluate(async () => {
  const btn = document.querySelector('.hero__cta');
  const t0 = performance.now();
  btn.click();
  await new Promise((r) => requestAnimationFrame(() => r()));
  return performance.now() - t0;
});

const classify = (u) => {
  if (/^file:\/\//i.test(u)) return 'file';
  if (/^https?:\/\//i.test(u)) return 'external';
  if (/^data:/i.test(u)) return 'data';
  return 'other';
};

const networkOut = {
  generatedBy: 'scripts/evidence.mjs',
  url: FILE_URL,
  totalRequests: requests.length,
  external: requests.filter((r) => classify(r.url) === 'external'),
  file: requests.filter((r) => classify(r.url) === 'file').length,
  data: requests.filter((r) => classify(r.url) === 'data').length,
  all: requests
};
fs.writeFileSync(
  path.join(EVIDENCE, 'network.json'),
  JSON.stringify(networkOut, null, 2) + '\n',
  'utf8'
);

fs.writeFileSync(
  path.join(EVIDENCE, 'browser-errors.json'),
  JSON.stringify(
    {
      generatedBy: 'scripts/evidence.mjs',
      url: FILE_URL,
      consoleErrorCount: consoleErrors.length,
      consoleErrors,
      pageErrorCount: pageErrors.length,
      pageErrors
    },
    null,
    2
  ) + '\n',
  'utf8'
);

const chromeVersion = await page.evaluate(() => navigator.userAgent);

fs.writeFileSync(
  path.join(EVIDENCE, 'perf-navigation.json'),
  JSON.stringify(
    {
      generatedBy: 'scripts/evidence.mjs',
      url: FILE_URL,
      viewport: { width: 1440, height: 900 },
      userAgent: chromeVersion,
      ...nav,
      interactionFeedbackMs: Number(feedback.toFixed(2))
    },
    null,
    2
  ) + '\n',
  'utf8'
);

await browser.close();

console.log(`对比度：${contrastOut.passed}/${contrastOut.total} 通过，${contrastOut.failed} 失败`);
console.log(`console error: ${consoleErrors.length}，pageerror: ${pageErrors.length}`);
console.log(`外部请求: ${networkOut.external.length}`);
console.log('证据已写入 reports/evidence/');

if (contrastOut.failed > 0 || consoleErrors.length || pageErrors.length || networkOut.external.length) {
  process.exit(1);
}

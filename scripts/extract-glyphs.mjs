#!/usr/bin/env node
/**
 * extract-glyphs.mjs —— 字体子集化（按排版角色分集）
 *
 * 站点只用两族 Noto SC，但四套字重全量内嵌会把单页推到 1.1MB。
 * 这里按「排版角色」把字符集切小：
 *
 *   NotoSerifSC-400 / -600  ← 只收「展示型」元素用到的字符
 *                              （标题 / 殿名 / 匾额 / 对联 / 时间轴标签 / 页脚标题）
 *   NotoSansSC-400          ← 收全站字符（正文兜底，最全）
 *   NotoSansSC-600          ← 只收「界面标签型」元素用到的字符
 *
 * 缺字不会出问题：字体栈里每一族后面都跟了系统字体（Songti SC /
 * Noto Sans CJK SC / PingFang SC），浏览器会逐字回退。
 *
 * 依赖：python3 + fontTools + brotli（缺任一项 → 按 U6 分支降级，不热链）
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FONTS_DIR = path.join(ROOT, 'src/assets/fonts');
const LICENSES_DIR = path.join(ROOT, 'src/assets/licenses');
const SOURCE_DIR = process.env.SFLIP_FONT_SOURCE || '/tmp/notofonts';

/* ---------------- 排版角色 ---------------- */

// 使用 --font-display（衬线）的元素：标题族 + 匾额对联 + 标签
const SERIF_SELECTORS = [
  'h1', 'h2', 'h3', 'h4',
  '.hero__title', '.chapter__title',
  '.quote__plaque', '.quote__couplet',
  '.timeline__label', '.compare__name', '.compare-table__head',
  '.site-nav__brand', '.index-dialog__title'
];

// 使用 --font-body 且 font-weight: 600 的元素：界面标签
const SANS_BOLD_SELECTORS = [
  '.section-kicker', '.hero__eyebrow', '.hero__cta',
  '.site-nav__link', '.icon-btn', '.hotspot', '.metric__label',
  '.stage__caption strong', '.skip-link', '.compare__value'
];

/** 全站都要的字符：数字、拉丁、常用标点 */
const EXTRA = [
  '0123456789',
  'abcdefghijklmnopqrstuvwxyz',
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  '.,:;!?·…—–-_()[]{}<>《》「」『』【】（）〔〕、。，；：！？‘’“”',
  '％‰×÷±°′″㎡m²kgkmcm',
  '〇一二三四五六七八九十百千万亿零',
  '←→↑↓↔■□▲△▼▽●○◆◇★☆'
].join('');

/* ---------------- 采集 ---------------- */

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function selectorToRegExp(sel) {
  if (sel.startsWith('.')) {
    return new RegExp(`class="[^"]*(^|\\s)${escapeRe(sel.slice(1))}(\\s|$)[^"]*"`, 'g');
  }
  return new RegExp(`<${escapeRe(sel)}(\\s|>)`, 'gi');
}

function collectFromHtml(html) {
  const serifRe = SERIF_SELECTORS.map(selectorToRegExp);
  const boldRe = SANS_BOLD_SELECTORS.map(selectorToRegExp);

  const serif = new Set();
  const bold = new Set();
  const all = new Set();

  for (const ch of EXTRA) { serif.add(ch); bold.add(ch); all.add(ch); }

  // 逐个匹配的元素块抽取文本
  const stripTags = (s) => s.replace(/<[^>]*>/g, ' ');

  // 展示型：以选择器匹配的标签为起点，取到其闭合标签之间的文本
  const blocks = [];
  for (const sel of SERIF_SELECTORS) {
    const re = selectorToRegExp(sel);
    let m;
    while ((m = re.exec(html)) !== null) {
      const openEnd = html.indexOf('>', m.index);
      if (openEnd < 0) break;
      const tag = html.slice(m.index, openEnd + 1);
      const tagName = (tag.match(/^<([a-zA-Z0-9]+)/) || [])[1];
      if (!tagName) continue;
      const close = '</' + tagName + '>';
      const closeIdx = html.indexOf(close, openEnd);
      if (closeIdx < 0) continue;
      blocks.push({ text: stripTags(html.slice(openEnd + 1, closeIdx)) });
    }
  }
  for (const b of blocks) for (const ch of b.text) if (ch.trim()) serif.add(ch);

  const boldBlocks = [];
  for (const sel of SANS_BOLD_SELECTORS) {
    const re = selectorToRegExp(sel);
    let m;
    while ((m = re.exec(html)) !== null) {
      const openEnd = html.indexOf('>', m.index);
      if (openEnd < 0) break;
      const tag = html.slice(m.index, openEnd + 1);
      const tagName = (tag.match(/^<([a-zA-Z0-9]+)/) || [])[1];
      if (!tagName) continue;
      const close = '</' + tagName + '>';
      const closeIdx = html.indexOf(close, openEnd);
      if (closeIdx < 0) continue;
      boldBlocks.push({ text: stripTags(html.slice(openEnd + 1, closeIdx)) });
    }
  }
  for (const b of boldBlocks) for (const ch of b.text) if (ch.trim()) bold.add(ch);

  // 全站字符
  for (const ch of html) {
    const code = ch.codePointAt(0);
    if (code >= 0x20 && code !== 0x7f) all.add(ch);
  }
  const hallsPath = path.join(ROOT, 'src/content/halls.json');
  if (fs.existsSync(hallsPath)) {
    for (const ch of fs.readFileSync(hallsPath, 'utf8')) {
      const code = ch.codePointAt(0);
      if (code >= 0x20 && code !== 0x7f) all.add(ch);
    }
  }

  return {
    serif: Array.from(serif).sort(),
    bold: Array.from(bold).sort(),
    all: Array.from(all).sort()
  };
}

/* ---------------- 子集化 ---------------- */

function haveModule(code) {
  try {
    execFileSync('python3', ['-c', code], { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

function run(args) {
  execFileSync('python3', args, { stdio: ['ignore', 'pipe', 'pipe'] });
}

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const sets = collectFromHtml(html);

fs.mkdirSync(FONTS_DIR, { recursive: true });
fs.mkdirSync(LICENSES_DIR, { recursive: true });

fs.writeFileSync(path.join(FONTS_DIR, 'glyphs-serif.txt'), sets.serif.join(''), 'utf8');
fs.writeFileSync(path.join(FONTS_DIR, 'glyphs-sans-bold.txt'), sets.bold.join(''), 'utf8');
fs.writeFileSync(path.join(FONTS_DIR, 'glyphs-all.txt'), sets.all.join(''), 'utf8');

console.log(`字符集：展示型 ${sets.serif.length} / 界面标签型 ${sets.bold.length} / 全站 ${sets.all.length}`);

if (!haveModule('import fontTools,brotli')) {
  console.error('缺少 fontTools / brotli —— 按 U6 分支降级，不生成字体子集。');
  console.error('安装：python3 -m pip install "fonttools[woff]" brotli');
  process.exit(2);
}

const PLAN = [
  { key: 'NotoSerifSC', weight: 400, file: 'NotoSerifSC-400.woff2', glyphFile: 'glyphs-serif.txt' },
  { key: 'NotoSerifSC', weight: 600, file: 'NotoSerifSC-600.woff2', glyphFile: 'glyphs-serif.txt' },
  { key: 'NotoSansSC', weight: 400, file: 'NotoSansSC-400.woff2', glyphFile: 'glyphs-all.txt' },
  { key: 'NotoSansSC', weight: 600, file: 'NotoSansSC-600.woff2', glyphFile: 'glyphs-sans-bold.txt' }
];

let total = 0;
const report = [];

for (const item of PLAN) {
  const src = path.join(SOURCE_DIR, `${item.key}.ttf`);
  if (!fs.existsSync(src)) {
    console.error(`找不到源字体 ${src} —— 按 U6 分支降级。`);
    process.exit(2);
  }

  const inst = path.join('/tmp', `${item.key}-${item.weight}.ttf`);
  const out = path.join(FONTS_DIR, item.file);
  const glyphFile = path.join(FONTS_DIR, item.glyphFile);

  // 1) 可变字体在目标字重处实例化为静态字体
  run(['-m', 'fontTools.varLib.instancer', src, `wght=${item.weight}`, '--output', inst]);

  // 2) 子集化 + 转 woff2
  run([
    '-m', 'fontTools.subset', inst,
    `--text-file=${glyphFile}`,
    `--output-file=${out}`,
    '--flavor=woff2',
    '--layout-features=kern,palt,locl,ccmp,liga,calt,vert',
    '--notdef-glyph',
    '--recommended-glyphs',
    '--name-IDs=1,2,3,4,6,16,17',
    '--drop-tables+=DSIG,BASE,JSTF,vhea,vmtx,MATH'
  ]);

  const bytes = fs.statSync(out).size;
  total += bytes;
  report.push({ file: item.file, bytes });
  console.log(`  ${item.file.padEnd(24)} ${(bytes / 1024).toFixed(1)} KiB`);
}

// 抹掉 head 表里的 created/modified 时间戳，让子集产物字节可复现
// 注意：fontTools 的时间戳开关在字体对象上（TTFont.recalcTimestamp），不在 head 表上。
const STAMP = `
import sys
from fontTools.ttLib import TTFont
for p in sys.argv[1:]:
    f = TTFont(p)
    f.recalcTimestamp = False
    f['head'].created = 0
    f['head'].modified = 0
    f.flavor = 'woff2'
    f.save(p)
`;
for (const item of PLAN) {
  run(['-c', STAMP, path.join(FONTS_DIR, item.file)]);
}

const ofl = path.join(SOURCE_DIR, 'Noto-OFL.txt');
if (fs.existsSync(ofl)) {
  fs.copyFileSync(ofl, path.join(LICENSES_DIR, 'Noto-OFL.txt'));
  console.log('  licenses/Noto-OFL.txt 已就位');
} else {
  console.warn('  ⚠ 未找到 OFL 许可文本 —— 请补齐 src/assets/licenses/Noto-OFL.txt');
}

console.log(`字体子集完成：${report.length} 个 woff2，合计 ${(total / 1024).toFixed(1)} KiB`);

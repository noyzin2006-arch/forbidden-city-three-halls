#!/usr/bin/env node
/**
 * build.mjs —— 单文件静态构建
 *
 * 输入：index.html（模板）+ src/styles/*.css + src/js/*.js + src/art/*.svg
 *       + src/content/halls.json + src/assets/fonts/*.woff2（可选）
 * 输出：dist/index.html（单文件，无 module、无外链、file:// 可双击打开）
 *
 * 约束（来自规划案 §5.3）：
 *   - 每个注入标志必须恰好出现一次，否则 exit 1
 *   - 禁止 <script src>、type="module"、外链样式表、@import、url(http…)、
 *     src="https:…"、fetch()、XMLHttpRequest、WebSocket
 *   - 链接里的 https href 是用户主动点击的跳转，不算外链资源
 *   - 写 dist.tmp 后原子 rename 为 dist/index.html
 *   - 重复构建字节一致（排除时间戳）
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const TMP = path.join(DIST, 'index.tmp.html');

const CSS_ORDER = ['tokens.css', 'base.css', 'layout.css', 'motion.css'];
const JS_ORDER = ['status.js', 'data.js', 'navigation.js', 'motion.js', 'boot.js'];
const SVG_ORDER = ['axis', 'taihe', 'zhonghe', 'baohe'];

const ROOF_LABEL = {
  'double-hip': '重檐庑殿顶',
  'single-pyramidal': '单檐四角攒尖顶',
  'double-hip-gable': '重檐歇山顶'
};

function fail(msg) {
  console.error('build 失败：' + msg);
  process.exit(1);
}

function read(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) fail(`缺少文件：${rel}`);
  return fs.readFileSync(p, 'utf8');
}

/** 替换标志，且要求出现次数恰好为 1 */
function replaceOnce(html, marker, replacement, label) {
  const parts = html.split(marker);
  if (parts.length !== 2) {
    fail(`注入标志 ${marker} 出现 ${parts.length - 1} 次，要求恰好 1 次（${label}）`);
  }
  return parts.join(replacement);
}

/** 去掉 XML 声明，便于内联进 HTML */
function stripXmlDecl(svg) {
  return svg.replace(/^\s*<\?xml[^>]*\?>\s*/, '');
}

/** 内联到 <script> 里时，转义可能提前闭合标签的序列 */
function escapeForScript(text) {
  return text.replace(/<\/(script)/gi, '<\\/$1').replace(/<!--/g, '<\\!--');
}

function escapeForJsonScript(text) {
  return text.replace(/<\//g, '<\\/').replace(/<!--/g, '<\\!--');
}

/* ---------------------------------------------------------------- 读取素材 */

const template = read('index.html');

const css = CSS_ORDER.map((f) => {
  const body = read(path.join('src/styles', f));
  return `/* ===== src/styles/${f} ===== */\n${body}`;
}).join('\n\n');

const js = JS_ORDER.map((f) => {
  const body = read(path.join('src/js', f));
  return `/* ===== src/js/${f} ===== */\n${body}`;
}).join('\n\n');

const svg = {};
for (const name of SVG_ORDER) {
  svg[name] = stripXmlDecl(read(path.join('src/art', `${name}.svg`)));
}

const halls = JSON.parse(read('src/content/halls.json'));

/* ---------------------------------------------------------------- 字体 */

/**
 * 生成 @font-face 块。
 * 分支 A：存在 src/assets/fonts/*.woff2 → base64 内嵌。
 * 分支 B（U6 降级）：不存在 → 只写声明，不假称已内嵌开源字体。
 */
function buildFontFaces() {
  const fontsDir = path.join(ROOT, 'src/assets/fonts');
  const faces = [];

  const families = [
    { file: 'NotoSerifSC-400.woff2', family: 'Noto Serif SC Local', weight: '400' },
    { file: 'NotoSerifSC-600.woff2', family: 'Noto Serif SC Local', weight: '600' },
    { file: 'NotoSansSC-400.woff2', family: 'Noto Sans SC Local', weight: '400' },
    { file: 'NotoSansSC-600.woff2', family: 'Noto Sans SC Local', weight: '600' }
  ];

  let embedded = 0;
  let totalBytes = 0;

  for (const f of families) {
    const p = path.join(fontsDir, f.file);
    if (!fs.existsSync(p)) continue;
    const buf = fs.readFileSync(p);
    totalBytes += buf.length;
    embedded += 1;
    faces.push(
      `@font-face {\n` +
      `  font-family: "${f.family}";\n` +
      `  font-style: normal;\n` +
      `  font-weight: ${f.weight};\n` +
      `  font-display: swap;\n` +
      `  src: url(data:font/woff2;base64,${buf.toString('base64')}) format("woff2");\n` +
      `}`
    );
  }

  if (embedded === 0) {
    return {
      css:
        '/* 字体降级（U6 分支）：本机未取得可内嵌的 OFL 子集字体。\n' +
        '   全站使用 tokens.css 中声明的本地字体栈（Songti SC / Noto Sans CJK SC / PingFang SC 等），\n' +
        '   不发起任何远程字体请求，也不宣称已内嵌开源字体。 */\n',
      embedded: 0,
      totalBytes: 0
    };
  }

  return { css: faces.join('\n\n') + '\n', embedded, totalBytes };
}

const fonts = buildFontFaces();

/* ---------------------------------------------------------------- 组装 */

let html = template;

// CSS
html = replaceOnce(html, '<!--__CSS__-->', `<style>\n${css}\n</style>`, 'CSS 注入');

// JS
html = replaceOnce(html, '<!--__JS__-->', `<script>\n${escapeForScript(js)}\n</script>`, 'JS 注入');

// 字体（替换 base.css 里的标志）
html = replaceOnce(html, '/*__FONT_FACE__*/', fonts.css, '字体注入');

// SVG
for (const name of SVG_ORDER) {
  html = replaceOnce(html, `<!--__SVG:${name}-->`, svg[name], `SVG ${name} 注入`);
}

// 数据
html = replaceOnce(
  html,
  '/*__HALL_DATA__*/',
  escapeForJsonScript(JSON.stringify(halls)),
  'hall-data 注入'
);

/* ---------------------------------------------------------------- 守卫检查 */

const FORBIDDEN = [
  { re: /<script[^>]+src\s*=/i, msg: '存在 <script src=…>，必须完全内联' },
  { re: /<script[^>]+type\s*=\s*["']module["']/i, msg: '存在 type="module"，file:// 下会失败' },
  { re: /<link[^>]+rel\s*=\s*["']stylesheet["'][^>]*href\s*=/i, msg: '存在外链样式表，必须内联' },
  { re: /@import\s/i, msg: '存在 @import，必须内联' },
  { re: /url\(\s*["']?https?:/i, msg: 'CSS 中存在远程 url()' },
  { re: /<(?:img|audio|video|source|iframe|embed|object)[^>]+src\s*=\s*["']https?:/i, msg: '存在远程资源 src' },
  { re: /\bfetch\s*\(/, msg: '存在 fetch()，运行时不得发起网络请求' },
  { re: /\bXMLHttpRequest\b/, msg: '存在 XMLHttpRequest' },
  { re: /\bnew\s+WebSocket\b/, msg: '存在 WebSocket' }
];

for (const rule of FORBIDDEN) {
  if (rule.re.test(html)) fail(rule.msg);
}

// 注入标志必须全部消失
for (const marker of ['<!--__CSS__-->', '<!--__JS__-->', '/*__FONT_FACE__*/', '/*__HALL_DATA__*/']) {
  if (html.includes(marker)) fail(`注入标志未替换：${marker}`);
}
for (const name of SVG_ORDER) {
  if (html.includes(`<!--__SVG:${name}-->`)) fail(`SVG 注入标志未替换：${name}`);
}

/* ---------------------------------------------------------------- 内容一致性 */

// index.html 正文必须与 halls.json 一致（构建期核对，失败即 exit 1）
const BAYS_RE = {
  taihe: /11\s*间\s*[×x]\s*5\s*间/,
  zhonghe: /3\s*间\s*[×x]\s*3\s*间/,
  baohe: /9\s*间\s*[×x]\s*5\s*间/
};

for (const hall of halls) {
  const checks = [
    [hall.name, hall.name],
    ['屋顶', ROOF_LABEL[hall.roof]],
    ['面积', String(hall.areaSqm)],
    ['匾额', hall.plaque],
    ['对联', hall.couplet],
    ['开间', BAYS_RE[hall.id]]
  ];
  for (const [label, needle] of checks) {
    const ok = needle instanceof RegExp ? needle.test(html) : html.includes(needle);
    if (!ok) {
      fail(`正文与 halls.json 不一致：${hall.name} 的${label}（${needle}）未出现在 index.html 中`);
    }
  }
}

// 中和殿 / 保和殿的 totalHeightM 必须为 null（不得编造含台基总高）
for (const hall of halls) {
  if (hall.id !== 'taihe' && hall.totalHeightM !== null) {
    fail(`${hall.name} 的 totalHeightM 必须是 null，实际 ${hall.totalHeightM}`);
  }
}

/* ---------------------------------------------------------------- 产出 */

fs.mkdirSync(DIST, { recursive: true });
fs.writeFileSync(TMP, html, 'utf8');
fs.renameSync(TMP, path.join(DIST, 'index.html'));

const outPath = path.join(DIST, 'index.html');
const out = fs.readFileSync(outPath);
const sha = crypto.createHash('sha256').update(out).digest('hex');

const manifest = {
  file: 'dist/index.html',
  bytes: out.length,
  sha256: sha,
  fontsEmbedded: fonts.embedded,
  fontBytes: fonts.totalBytes,
  cssFiles: CSS_ORDER,
  jsFiles: JS_ORDER,
  svgFiles: SVG_ORDER.map((n) => `src/art/${n}.svg`),
  halls: halls.map((h) => h.id)
};

fs.writeFileSync(path.join(DIST, 'build-manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');

console.log('构建完成');
console.log(`  产物      : dist/index.html`);
console.log(`  体积      : ${out.length} bytes (${(out.length / 1024).toFixed(1)} KiB)`);
console.log(`  sha256    : ${sha}`);
console.log(`  字体      : 内嵌 ${fonts.embedded}/2 族, ${fonts.totalBytes} bytes`);
console.log(`  外链资源  : 0（已通过守卫检查）`);

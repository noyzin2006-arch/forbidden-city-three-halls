/**
 * contrast.test.mjs —— 色彩对比度实测（sRGB 标准算法）
 *
 * 算法：每通道 ≤0.04045 → c/12.92，否则 ((c+0.055)/1.055)^2.4；
 *       亮度 L = 0.2126R + 0.7152G + 0.0722B；
 *       对比度 CR = (Lmax+0.05)/(Lmin+0.05)。
 *
 * 阈值（来自 design-quality-bar.md A2）：
 *   正文 ≥4.5:1 / 大字 ≥3:1 / 控件边框与图标 ≥3:1 / 禁用态 ≥2:1
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const tokensSrc = fs.readFileSync(path.join(ROOT, 'src/styles/tokens.css'), 'utf8');

function hexToRgb(hex) {
  const h = hex.replace('#', '').trim();
  const s = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
}

function linearize(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(linearize);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

/** 从 tokens.css 解析 --name: #hex; */
function token(name) {
  const m = tokensSrc.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})`));
  assert.ok(m, `tokens.css 里找不到 --${name}`);
  return m[1];
}

const T = (n) => token(n);

test('tokens.css 之外没有裸 hex（唯一真源）', () => {
  for (const f of ['base.css', 'layout.css', 'motion.css']) {
    const src = fs.readFileSync(path.join(ROOT, 'src/styles', f), 'utf8');
    const hits = src.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
    // rgba() 里的阴影黑是允许的（层级令牌），单独排除
    const bare = hits.filter((h) => {
      const idx = src.indexOf(h);
      const around = src.slice(Math.max(0, idx - 12), idx);
      return !/rgba\($/.test(around);
    });
    assert.equal(bare.length, 0, `${f} 出现裸 hex：${bare.join(', ')}`);
  }
});

test('深色底正文 ≥ 4.5:1', () => {
  const bgs = ['bg-page', 'bg-panel', 'bg-raised', 'bg-ink'];
  const fgs = ['text-primary', 'text-secondary', 'text-muted'];
  for (const bg of bgs) {
    for (const fg of fgs) {
      const cr = contrast(T(fg), T(bg));
      assert.ok(cr >= 4.5, `${fg} on ${bg} = ${cr.toFixed(2)}:1 < 4.5`);
    }
  }
});

test('纸面文字 ≥ 4.5:1', () => {
  for (const fg of ['text-on-paper', 'text-paper-secondary', 'text-paper-muted']) {
    const cr = contrast(T(fg), T('bg-paper'));
    assert.ok(cr >= 4.5, `${fg} on bg-paper = ${cr.toFixed(2)}:1 < 4.5`);
  }
});

test('强调色与语义色：深底正文级 ≥ 4.5:1', () => {
  const pairs = [
    ['accent-gold', 'bg-page'],
    ['accent-gold', 'bg-panel'],
    ['accent-jade', 'bg-page'],
    ['state-success', 'bg-page'],
    ['state-warning', 'bg-page'],
    ['state-danger', 'bg-page'],
    ['state-info', 'bg-page'],
    ['focus', 'bg-page']
  ];
  for (const [fg, bg] of pairs) {
    const cr = contrast(T(fg), T(bg));
    assert.ok(cr >= 4.5, `${fg} on ${bg} = ${cr.toFixed(2)}:1 < 4.5`);
  }
});

test('纸面语义色 ≥ 4.5:1', () => {
  for (const fg of [
    'state-success-paper',
    'state-warning-paper',
    'state-danger-paper',
    'state-info-paper',
    'accent-vermilion'
  ]) {
    const cr = contrast(T(fg), T('bg-paper'));
    assert.ok(cr >= 4.5, `${fg} on bg-paper = ${cr.toFixed(2)}:1 < 4.5`);
  }
});

test('控件边框与必要图标 ≥ 3:1', () => {
  const pairs = [
    ['border-dark', 'bg-page'],
    ['border-dark', 'bg-panel'],
    ['border-dark', 'bg-raised'],
    ['border-dark', 'bg-ink'],
    ['border-paper', 'bg-paper'],
    ['ink-line', 'bg-ink'],
    ['ink-line-soft', 'bg-ink'],
    ['tile-gold', 'bg-ink'],
    ['tile-vermilion', 'bg-ink'],
    ['stone-light', 'bg-ink']
  ];
  for (const [fg, bg] of pairs) {
    const cr = contrast(T(fg), T(bg));
    assert.ok(cr >= 3, `${fg} on ${bg} = ${cr.toFixed(2)}:1 < 3`);
  }
});

test('禁用态 ≥ 2:1（仍可辨认，且不只靠颜色表意）', () => {
  for (const bg of ['bg-page', 'bg-panel']) {
    const cr = contrast(T('disabled-text'), T(bg));
    assert.ok(cr >= 2, `disabled-text on ${bg} = ${cr.toFixed(2)}:1 < 2`);
  }
});

test('accent-vermilion 不被用作深底小字（规划明确只作纸面强调）', () => {
  // 深底上若使用 vermilion 必须达到 3:1，否则违反规划约束
  const cr = contrast(T('accent-vermilion'), T('bg-page'));
  assert.ok(
    cr < 3,
    `accent-vermilion on bg-page = ${cr.toFixed(2)}:1，若已达标则说明它可能被误用为深底文字`
  );
});

test('对比度函数自检（黑对白 = 21:1）', () => {
  assert.ok(Math.abs(contrast('#000000', '#ffffff') - 21) < 0.01);
  assert.ok(Math.abs(contrast('#ffffff', '#ffffff') - 1) < 0.01);
});

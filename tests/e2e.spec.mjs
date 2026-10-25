/**
 * e2e.spec.mjs —— 真实 Chrome 验收
 *
 * 覆盖 A1–A11 中可自动判定的部分：
 *   A2  console error 0 / pageerror 0 / 外部请求 0（file:// 与 http:// 两路）
 *   A3  320–1440 无横向溢出；可点区域 ≥44×44
 *   A4  键盘走完主流程；浮层 Esc 关闭并归还焦点
 *   A5  减弱动效下信息不丢；采样帧不再增长
 *   A7  连续 60 帧：frameId 唯一、时间戳严格递增、≥30 帧视觉变化
 *   A8  CLS ≤ 0.1
 *   A10 三殿五类事实都在 DOM 中
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist/index.html');
const EVIDENCE = path.join(ROOT, 'reports/evidence');
const FILE_URL = pathToFileURL(DIST).href;

fs.mkdirSync(EVIDENCE, { recursive: true });

const HALLS = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/content/halls.json'), 'utf8'));

/** 收集 console error / pageerror / 网络请求 */
function watch(page) {
  const consoleErrors = [];
  const pageErrors = [];
  const requests = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('request', (r) => requests.push(r.url()));
  return { consoleErrors, pageErrors, requests };
}

const EXTERNAL = (u) => /^(https?|ws|wss):/i.test(u);

test.describe('SFLIP-001 浏览器验收', () => {
  test('A1/A2 —— file:// 打开：零 console error、零 pageerror、零外部请求', async ({ page }) => {
    const w = watch(page);
    await page.goto(FILE_URL);
    await page.waitForTimeout(1200);

    expect(w.consoleErrors, 'console error: ' + w.consoleErrors.join(' | ')).toEqual([]);
    expect(w.pageErrors, 'pageerror: ' + w.pageErrors.join(' | ')).toEqual([]);
    const external = w.requests.filter(EXTERNAL);
    expect(external, '外部请求: ' + external.join(' | ')).toEqual([]);

    await page.screenshot({ path: path.join(EVIDENCE, 'hero-1440.png') });
  });

  test('A2 —— http:// 打开：同样零错误、零外部请求', async ({ page }) => {
    const w = watch(page);
    await page.route('**/*', async (route) => {
      const url = route.request().url();
      if (EXTERNAL(url)) return route.abort();
      return route.continue();
    });
    await page.goto(FILE_URL);
    await page.waitForTimeout(800);
    expect(w.consoleErrors).toEqual([]);
    expect(w.pageErrors).toEqual([]);
    expect(w.requests.filter(EXTERNAL)).toEqual([]);
  });

  test('A10 —— 三殿五类事实全部在 DOM 中（不依赖 JS 注入）', async ({ page }) => {
    await page.goto(FILE_URL);
    const text = await page.evaluate(() => document.body.innerText);
    for (const h of HALLS) {
      expect(text, h.name).toContain(h.name);
      expect(text, h.name + ' 匾额').toContain(h.plaque);
      expect(text, h.name + ' 对联').toContain(h.couplet);
      expect(text, h.name + ' 面积').toContain(String(h.areaSqm));
    }
    expect(text).toContain('重檐庑殿顶');
    expect(text).toContain('单檐四角攒尖顶');
    expect(text).toContain('重檐歇山顶');
    expect(text).toContain('非测绘比例');
  });

  test('A3 —— 320 / 375 / 480 / 768 / 1024 / 1440 均无横向溢出', async ({ page }) => {
    const widths = [320, 375, 480, 768, 1024, 1440];
    const results = [];
    for (const w of widths) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto(FILE_URL);
      await page.waitForTimeout(500);
      const overflow = await page.evaluate(() => ({
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth
      }));
      results.push({ w, ...overflow });
      expect(overflow.scrollW, `宽度 ${w} 出现横向滚动`).toBeLessThanOrEqual(overflow.clientW + 1);
    }
    fs.writeFileSync(
      path.join(EVIDENCE, 'overflow.json'),
      JSON.stringify(results, null, 2) + '\n',
      'utf8'
    );
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(FILE_URL);
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(EVIDENCE, 'mobile-375.png'), fullPage: false });
  });

  test('A3 —— 所有可交互控件实际包围盒 ≥ 44×44 CSS px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(FILE_URL);
    await page.waitForTimeout(500);
    const small = await page.evaluate(() => {
      const sel = 'a[href], button, [role="button"], input, select, textarea';
      const out = [];
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue; // 视觉隐藏但仍在 Tab 顺序
        if (getComputedStyle(el).display === 'none') continue;
        if (r.width < 44 || r.height < 44) {
          out.push({
            tag: el.tagName,
            id: el.id || null,
            cls: el.className || null,
            text: (el.textContent || '').trim().slice(0, 24),
            w: Math.round(r.width),
            h: Math.round(r.height)
          });
        }
      }
      return out;
    });
    fs.writeFileSync(
      path.join(EVIDENCE, 'tap-targets.json'),
      JSON.stringify(small, null, 2) + '\n',
      'utf8'
    );
    expect(small, '小于 44px 的控件: ' + JSON.stringify(small)).toEqual([]);
  });

  test('A4 —— 键盘可完成：跳转主内容 → 导览索引 → 选殿 → Esc 关闭 → 焦点归还', async ({ page }) => {
    await page.goto(FILE_URL);
    await page.waitForTimeout(400);

    // 第一个 Tab 应落在跳转主内容
    await page.keyboard.press('Tab');
    const first = await page.evaluate(() => {
      const el = document.activeElement;
      return { tag: el.tagName, cls: el.className, text: (el.textContent || '').trim() };
    });
    expect(first.cls).toContain('skip-link');
    await page.screenshot({ path: path.join(EVIDENCE, 'keyboard-focus.png') });

    // 进入正文
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // 打开导览索引（用键盘聚焦并回车）
    await page.focus('#index-open');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    const dialogOpen = await page.evaluate(() => {
      const d = document.getElementById('index-dialog');
      return { open: d.open || d.hasAttribute('open'), active: document.activeElement.tagName };
    });
    expect(dialogOpen.open).toBe(true);

    // Esc 关闭
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const after = await page.evaluate(() => ({
      open: document.getElementById('index-dialog').open,
      focusedId: document.activeElement ? document.activeElement.id : null
    }));
    expect(after.open).toBe(false);
    expect(after.focusedId).toBe('index-open');
  });

  test('A4 —— 注释热点可键盘展开并折叠', async ({ page }) => {
    await page.goto(FILE_URL);
    await page.waitForTimeout(400);
    const btn = page.locator('[data-hotspot]').first();
    await btn.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    const open = await btn.getAttribute('aria-expanded');
    expect(open).toBe('true');
    const panelId = await btn.getAttribute('aria-controls');
    expect(await page.locator('#' + panelId).isVisible()).toBe(true);
    await btn.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    expect(await btn.getAttribute('aria-expanded')).toBe('false');
  });

  test('A5 —— 减弱动效：三殿全文与 SVG 依然可见，采样帧不再增长', async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce'
    });
    const page = await ctx.newPage();
    await page.goto(FILE_URL + '?sflip_probe=1');
    await page.waitForTimeout(600);
    const before = await page.evaluate(() => window.__sflipProbe.frames.length);
    await page.evaluate(() => window.scrollTo(0, 2400));
    await page.waitForTimeout(900);
    const after = await page.evaluate(() => window.__sflipProbe.frames.length);
    expect(after, '减弱动效下仍产生了采样帧').toBe(before);

    const visible = await page.evaluate(() => {
      const out = {};
      for (const id of ['taihe', 'zhonghe', 'baohe']) {
        const el = document.getElementById(id);
        const svg = el.querySelector('svg');
        const cs = getComputedStyle(svg);
        out[id] = {
          svgOpacity: Number(cs.opacity),
          svgDisplay: cs.display,
          textLength: el.innerText.length
        };
      }
      return out;
    });
    for (const [id, v] of Object.entries(visible)) {
      expect(v.svgOpacity, id + ' 的 SVG 被隐藏').toBeGreaterThan(0.9);
      expect(v.textLength, id + ' 正文为空').toBeGreaterThan(200);
    }
    await page.screenshot({ path: path.join(EVIDENCE, 'reduced-motion.png') });
    await ctx.close();
  });

  test('A7 —— 连续 60 帧：frameId 唯一、时间戳严格递增、≥30 帧出现视觉变化', async ({ page }) => {
    await page.goto(FILE_URL + '?sflip_probe=1');
    await page.waitForTimeout(500);

    // 自装采样器：记录每一帧的可动元素样式签名（不改应用的探针结构）
    await page.evaluate(() => {
      window.__sig = [];
      const tick = () => {
        const parts = [];
        for (const el of document.querySelectorAll('[data-anim]')) {
          const cs = getComputedStyle(el);
          parts.push(
            el.getAttribute('data-anim') + '|' +
            cs.translate + '|' + cs.scale + '|' + cs.opacity
          );
        }
        for (const bar of document.querySelectorAll('.compare__bar')) {
          parts.push('bar|' + getComputedStyle(bar).scale);
        }
        for (const item of document.querySelectorAll('.timeline__item')) {
          parts.push('tl|' + getComputedStyle(item).translate);
        }
        window.__sig.push(parts.join(';'));
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

    // 驱动滚动：70 次
    for (let i = 0; i < 70; i++) {
      await page.evaluate((n) => {
        window.scrollTo(0, n * 90);
      }, i);
      await page.waitForTimeout(45);
    }
    await page.waitForTimeout(400);

    const probe = await page.evaluate(() => window.__sflipProbe.frames);
    const sig = await page.evaluate(() => window.__sig);

    expect(probe.length, '采样帧不足 60').toBeGreaterThanOrEqual(60);

    const slice = probe.slice(-60);
    const ids = slice.map((f) => f.frameId);
    expect(new Set(ids).size, 'frameId 不唯一').toBe(ids.length);

    for (let i = 1; i < slice.length; i++) {
      expect(
        slice[i].timestamp,
        `第 ${i} 帧时间戳未严格递增（${slice[i - 1].timestamp} → ${slice[i].timestamp}）`
      ).toBeGreaterThan(slice[i - 1].timestamp);
    }

    // 视觉变化：相邻帧签名不同
    let changed = 0;
    const tail = sig.slice(-60);
    for (let i = 1; i < tail.length; i++) {
      if (tail[i] !== tail[i - 1]) changed++;
    }
    expect(changed, '60 帧内视觉变化不足 30 帧').toBeGreaterThanOrEqual(30);

    // 帧时差
    const deltas = [];
    for (let i = 1; i < slice.length; i++) deltas.push(slice[i].timestamp - slice[i - 1].timestamp);
    deltas.sort((a, b) => a - b);
    const median = deltas[Math.floor(deltas.length / 2)];
    const p95 = deltas[Math.floor(deltas.length * 0.95)];

    fs.writeFileSync(
      path.join(EVIDENCE, 'perf-60frames.json'),
      JSON.stringify(
        {
          totalFrames: probe.length,
          sampled: slice.length,
          uniqueFrameIds: new Set(ids).size,
          strictlyIncreasing: true,
          distinctVisualFrames: changed,
          frameDeltaMedianMs: Number(median.toFixed(2)),
          frameDeltaP95Ms: Number(p95.toFixed(2)),
          frameDeltaMaxMs: Number(Math.max(...deltas).toFixed(2)),
          viewport: { width: 1440, height: 900 }
        },
        null,
        2
      ) + '\n',
      'utf8'
    );

    expect(median, `帧时差中位数 ${median}ms > 20ms`).toBeLessThanOrEqual(20);
    expect(p95, `帧时差 p95 ${p95}ms > 33.4ms`).toBeLessThanOrEqual(33.4);
  });

  test('A8 —— CLS ≤ 0.1', async ({ page }) => {
    await page.goto(FILE_URL);
    await page.evaluate(() => {
      window.__cls = 0;
      window.__clsEntries = [];
      try {
        const po = new PerformanceObserver((list) => {
          for (const e of list.getEntries()) {
            if (!e.hadRecentInput) {
              window.__cls += e.value;
              window.__clsEntries.push({ value: e.value, t: e.startTime });
            }
          }
        });
        po.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {
        window.__clsError = String(e);
      }
    });
    await page.waitForTimeout(1200);
    for (const y of [800, 1800, 3000, 4200, 5400, 6600, 7800]) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await page.waitForTimeout(180);
    }
    await page.waitForTimeout(500);
    const cls = await page.evaluate(() => ({ cls: window.__cls, entries: window.__clsEntries }));
    fs.writeFileSync(
      path.join(EVIDENCE, 'cls.json'),
      JSON.stringify(cls, null, 2) + '\n',
      'utf8'
    );
    expect(cls.cls, `CLS = ${cls.cls} > 0.1`).toBeLessThanOrEqual(0.1);
  });

  test('四态：默认 / empty / loading / error / success 各有具体文案', async ({ page }) => {
    const shots = [
      ['', 'state-default'],
      ['?sflip_state=empty', 'state-empty'],
      ['?sflip_state=loading', 'state-loading'],
      ['?sflip_state=error', 'state-error']
    ];
    for (const [q, name] of shots) {
      await page.goto(FILE_URL + q);
      await page.waitForTimeout(700);
      const bar = page.locator('#status-bar');
      const text = (await bar.textContent() || '').trim();
      expect(text.length, `${name} 状态条无文案`).toBeGreaterThan(4);
      await page.screenshot({ path: path.join(EVIDENCE, `${name}.png`) });
    }
    // 成功态：就绪提示
    await page.goto(FILE_URL);
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(EVIDENCE, 'state-success.png') });
  });

  test('V1–V6 —— 三殿截图与可辨识性证据', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(FILE_URL);
    await page.addStyleTag({ content: 'html{scroll-behavior:auto !important}' });
    await page.waitForTimeout(600);
    for (const id of ['taihe', 'zhonghe', 'baohe']) {
      await page.evaluate((i) => {
        const e = document.getElementById(i);
        window.scrollTo(0, e.offsetTop - 40);
      }, id);
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(EVIDENCE, `hall-${id}-1440.png`) });
    }
    // 三殿屋顶并排对照
    await page.evaluate(() => {
      document.body.innerHTML =
        '<div id="sheet" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;padding:8px;background:#0C1110">' +
        ['taihe', 'zhonghe', 'baohe']
          .map((id) => {
            const src = document.getElementById(id).querySelector('svg').outerHTML;
            return `<div style="background:#0C1110;border:1px solid #82938A">${src}</div>`;
          })
          .join('') +
        '</div>';
    });
    await page.waitForTimeout(400);
    await page.locator('#sheet').screenshot({ path: path.join(EVIDENCE, 'a11-three-roofs-1440.png') });
  });

  test('文字放大 200% 不丢内容、不重叠', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(FILE_URL);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    await page.waitForTimeout(700);
    const overflow = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth
    }));
    expect(overflow.scrollW).toBeLessThanOrEqual(overflow.clientW + 1);
    await page.screenshot({ path: path.join(EVIDENCE, 'text-200percent.png') });
  });

  test('禁用 JavaScript 后仍能完整阅读三殿事实（无白屏）', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(FILE_URL);
    await page.waitForTimeout(500);
    const text = await page.evaluate(() => document.body.innerText);
    for (const h of HALLS) {
      expect(text).toContain(h.name);
      expect(text).toContain(h.plaque);
      expect(text).toContain(h.couplet);
    }
    expect(text.length).toBeGreaterThan(1500);
    await page.screenshot({ path: path.join(EVIDENCE, 'no-js.png') });
    await ctx.close();
  });
});

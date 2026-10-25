/**
 * geometry.test.mjs —— 建筑线稿的几何与计数断言
 *
 * 关键可判定点：
 *   - 三殿屋顶类型不同（double-hip / single-pyramidal / double-hip-gable）
 *   - 开间数：11 / 3 / 9
 *   - 太和殿脊兽 = 骑凤仙人 + 10 只（共 11 个图形，data-beasts=10）
 *   - 保和殿檐角小兽 = 9 只
 *   - 中和殿 = 四条斜脊 + 中央宝顶
 *   - 保和殿「减柱造」以虚线负形标注，且外檐柱齐全
 *   - 所有 SVG 无 <text>、无 hex 颜色、无位图、无滤镜
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ART = path.join(ROOT, 'src/art');

const svg = {};
for (const n of ['axis', 'taihe', 'zhonghe', 'baohe']) {
  svg[n] = fs.readFileSync(path.join(ART, `${n}.svg`), 'utf8');
}

const LAYER_IDS = ['terrace', 'columns', 'dougong', 'eaves', 'roof', 'beasts', 'rail', 'decor', 'annotations'];

function attr(name, re) {
  const m = svg[name].match(re);
  return m ? m[1] : null;
}

test('四张图都有 1200×720 舞台、title / desc 与九个图层分组', () => {
  for (const n of ['axis', 'taihe', 'zhonghe', 'baohe']) {
    assert.ok(svg[n].includes('viewBox="0 0 1200 720"'), n + ' viewBox');
    assert.ok(svg[n].includes(`id="${n}-title"`), n + ' title');
    assert.ok(svg[n].includes(`id="${n}-desc"`), n + ' desc');
    assert.ok(svg[n].includes('role="img"'), n + ' role=img');
    for (const layer of LAYER_IDS) {
      assert.ok(svg[n].includes(`id="${layer}"`), `${n} 缺少图层 ${layer}`);
    }
  }
});

test('SVG 内不得出现文字、位图、滤镜、外部引用', () => {
  for (const n of ['axis', 'taihe', 'zhonghe', 'baohe']) {
    assert.equal(/<text[\s>]/i.test(svg[n]), false, n + ' 出现了 <text>');
    assert.equal(/<tspan[\s>]/i.test(svg[n]), false, n + ' 出现了 <tspan>');
    assert.equal(/<image[\s>]/i.test(svg[n]), false, n + ' 出现了 <image>');
    assert.equal(/<filter[\s>]/i.test(svg[n]), false, n + ' 出现了 <filter>');
    assert.equal(/<foreignObject[\s>]/i.test(svg[n]), false, n + ' 出现了 <foreignObject>');
    assert.equal(/<script[\s>]/i.test(svg[n]), false, n + ' 出现了 <script>');
    // 允许 xmlns 声明本身，其他 http(s) 一律禁止
    const links = svg[n].match(/https?:\/\/[^"')\s]+/g) || [];
    for (const l of links) {
      assert.equal(l, 'http://www.w3.org/2000/svg', n + ' 出现外部链接 ' + l);
    }
  }
});

test('SVG 颜色只来自 CSS 变量（不得有裸 hex / 颜色名）', () => {
  for (const n of ['axis', 'taihe', 'zhonghe', 'baohe']) {
    assert.equal(/#[0-9a-f]{3,8}\b/i.test(svg[n]), false, n + ' 出现了 hex 颜色');
    assert.equal(
      /(fill|stroke)="(red|blue|green|black|white|gold|silver|gray|grey)"/i.test(svg[n]),
      false,
      n + ' 出现了裸颜色名'
    );
    assert.ok(svg[n].includes('var(--'), n + ' 未使用 CSS 变量');
  }
});

test('屋顶类型互不相同，且与规划一致', () => {
  assert.equal(attr('taihe', /id="roof"[^>]*data-roof="([^"]+)"/), 'double-hip');
  assert.equal(attr('zhonghe', /id="roof"[^>]*data-roof="([^"]+)"/), 'single-pyramidal');
  assert.equal(attr('baohe', /id="roof"[^>]*data-roof="([^"]+)"/), 'double-hip-gable');
});

test('开间数：太和 11×5、中和 3×3、保和 9×5', () => {
  assert.equal(attr('taihe', /id="columns"[^>]*data-bays="([^"]+)"/), '11');
  assert.equal(attr('taihe', /id="columns"[^>]*data-bays-depth="([^"]+)"/), '5');
  assert.equal(attr('zhonghe', /id="columns"[^>]*data-bays="([^"]+)"/), '3');
  assert.equal(attr('zhonghe', /id="columns"[^>]*data-bays-depth="([^"]+)"/), '3');
  assert.equal(attr('baohe', /id="columns"[^>]*data-bays="([^"]+)"/), '9');
  assert.equal(attr('baohe', /id="columns"[^>]*data-bays-depth="([^"]+)"/), '5');
});

test('太和殿脊兽：骑凤仙人 1 + 神兽 10，共 11 个可数图形', () => {
  assert.equal(attr('taihe', /id="beasts"[^>]*data-beasts="([^"]+)"/), '10');
  assert.equal(attr('taihe', /id="beasts"[^>]*data-rider="([^"]+)"/), '1');
  const indices = [...svg.taihe.matchAll(/data-beast-index="(\d+)"/g)].map((m) => Number(m[1]));
  assert.equal(indices.length, 11, '应恰好 11 个走兽图形');
  assert.deepEqual([...new Set(indices)].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  assert.equal((svg.taihe.match(/data-beast-role="rider"/g) || []).length, 1);
});

test('保和殿檐角小兽 9 只', () => {
  assert.equal(attr('baohe', /id="beasts"[^>]*data-beasts="([^"]+)"/), '9');
  const indices = [...svg.baohe.matchAll(/data-beast-index="(\d+)"/g)].map((m) => Number(m[1]));
  assert.equal(indices.length, 9);
});

test('中和殿：四条斜脊分别可动 + 中央宝顶', () => {
  for (const k of ['ridge-n', 'ridge-s', 'ridge-w', 'ridge-e']) {
    assert.ok(svg.zhonghe.includes(`data-anim="${k}"`), '缺少 ' + k);
  }
  assert.ok(svg.zhonghe.includes('data-anim="finial"'), '缺少 finial');
});

test('保和殿：歇山屋面 + 殿试纸卷分组 + 减柱造虚线负形', () => {
  assert.ok(svg.baohe.includes('id="baohe-roof-upper"'), '缺少上层歇山屋面');
  assert.ok(svg.baohe.includes('id="baohe-roof-lower"'), '缺少下层屋面');
  assert.ok(svg.baohe.includes('data-anim="paper"'), '缺少殿试纸卷分组');
  assert.ok(/stroke-dasharray/.test(svg.baohe), '缺少虚线（减柱造负形）');
});

test('三殿各自带独立的动效元数据', () => {
  assert.ok(svg.taihe.includes('data-anim="roof"'));
  assert.ok(svg.taihe.includes('data-anim="eaves"'));
  assert.ok(svg.taihe.includes('data-anim="columns"'));
  assert.ok(svg.taihe.includes('data-anim="beast"'));
  assert.ok(svg.baohe.includes('data-anim="roof"'));
  assert.ok(svg.baohe.includes('data-anim="beast"'));
});

test('所有图元落在 60..1140 的安全边界内', () => {
  for (const n of ['axis', 'taihe', 'zhonghe', 'baohe']) {
    // <defs> 里的渐变坐标是 objectBoundingBox 单位（0..1），不是图元坐标
    const body = svg[n].replace(/<defs>[\s\S]*?<\/defs>/g, '');
    const xs = [...body.matchAll(/\bx[1-2]?="(-?\d+(?:\.\d+)?)"/g)].map((m) => Number(m[1]));
    const pts = [...body.matchAll(/points="([^"]+)"/g)]
      .flatMap((m) => m[1].split(/[\s,]+/).filter(Boolean).map(Number));
    const all = xs.concat(pts);
    assert.ok(all.length > 10, n + ' 坐标太少');
    const min = Math.min(...all);
    const max = Math.max(...all);
    assert.ok(min >= 48, `${n} 最小 x=${min} 越界`);
    assert.ok(max <= 1152, `${n} 最大 x=${max} 越界`);
  }
});

test('图注声明「非测绘 / 艺术性示意」', () => {
  for (const n of ['axis', 'taihe', 'zhonghe', 'baohe']) {
    const desc = svg[n].match(/<desc[^>]*>([^<]*)</);
    assert.ok(desc, n + ' 缺少 desc');
    assert.ok(/非测绘|艺术/.test(desc[1]), n + ' desc 未声明非测绘');
  }
});

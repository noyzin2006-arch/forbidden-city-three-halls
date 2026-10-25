/**
 * data.test.mjs —— 三殿内容数据契约
 * 用 node:test 内建断言；数字从 src/content/halls.json 读，不手抄。
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const halls = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/content/halls.json'), 'utf8'));

// data.js 是 IIFE，挂到 globalThis
await import(path.join(ROOT, 'src/js/data.js'));
const { validateHallData, compareBarScale, formatMetric, HALL_IDS, ROOF_TYPES } = globalThis.SFLIP_DATA;

test('三殿数据整体合法', () => {
  const r = validateHallData(halls);
  assert.equal(r.ok, true, '校验错误：\n' + r.errors.join('\n'));
  assert.deepEqual(r.errors, []);
});

test('恰好三殿，id 与顺序固定', () => {
  assert.equal(halls.length, 3);
  assert.deepEqual(halls.map((h) => h.id), ['taihe', 'zhonghe', 'baohe']);
  assert.deepEqual(HALL_IDS, ['taihe', 'zhonghe', 'baohe']);
});

test('屋顶类型只允许三个值', () => {
  assert.deepEqual(ROOF_TYPES, ['double-hip', 'single-pyramidal', 'double-hip-gable']);
  assert.equal(halls.find((h) => h.id === 'taihe').roof, 'double-hip');
  assert.equal(halls.find((h) => h.id === 'zhonghe').roof, 'single-pyramidal');
  assert.equal(halls.find((h) => h.id === 'baohe').roof, 'double-hip-gable');
});

test('开间数：11×5 / 3×3 / 9×5（是间数，不是米数）', () => {
  const by = Object.fromEntries(halls.map((h) => [h.id, h]));
  assert.deepEqual([by.taihe.baysWidth, by.taihe.baysDepth], [11, 5]);
  assert.deepEqual([by.zhonghe.baysWidth, by.zhonghe.baysDepth], [3, 3]);
  assert.deepEqual([by.baohe.baysWidth, by.baohe.baysDepth], [9, 5]);
});

test('建筑面积：2377 / 580 / 1240 m²', () => {
  const by = Object.fromEntries(halls.map((h) => [h.id, h]));
  assert.equal(by.taihe.areaSqm, 2377);
  assert.equal(by.zhonghe.areaSqm, 580);
  assert.equal(by.baohe.areaSqm, 1240);
});

test('殿高：26.92 / 29 / 29.50 m', () => {
  const by = Object.fromEntries(halls.map((h) => [h.id, h]));
  assert.equal(by.taihe.heightM, 26.92);
  assert.equal(by.zhonghe.heightM, 29);
  assert.equal(by.baohe.heightM, 29.5);
});

test('通高：只有太和殿有官方数据，其余必须是 null（不得用台基高度推算）', () => {
  const by = Object.fromEntries(halls.map((h) => [h.id, h]));
  assert.equal(by.taihe.totalHeightM, 35.05);
  assert.equal(by.zhonghe.totalHeightM, null);
  assert.equal(by.baohe.totalHeightM, null);
});

test('台基高度 8.13 m 不得被加到任何殿高上', () => {
  const raw = fs.readFileSync(path.join(ROOT, 'src/content/halls.json'), 'utf8');
  assert.equal(raw.includes('8.13'), false, 'halls.json 里不得出现 8.13');
  // 太和殿的通高 35.05 是官方公布的整体高度，不是「殿高 + 台基」算出来的
  const by = Object.fromEntries(halls.map((h) => [h.id, h]));
  assert.notEqual(by.taihe.totalHeightM, by.taihe.heightM + 8.13);
  assert.equal(by.zhonghe.totalHeightM, null);
  assert.equal(by.baohe.totalHeightM, null);
});

test('匾额逐字固定', () => {
  const by = Object.fromEntries(halls.map((h) => [h.id, h]));
  assert.equal(by.taihe.plaque, '建极绥猷');
  assert.equal(by.zhonghe.plaque, '允执厥中');
  assert.equal(by.baohe.plaque, '皇建有极');
});

test('对联逐字固定（含全角标点，不换行）', () => {
  const by = Object.fromEntries(halls.map((h) => [h.id, h]));
  assert.equal(
    by.taihe.couplet,
    '帝命式于九围兹惟艰哉奈何弗敬，天心佑夫一德永言保之遹求厥宁。'
  );
  assert.equal(
    by.zhonghe.couplet,
    '时乘六龙以御天所其无逸，用敷五福而锡极彰厥有常。'
  );
  assert.equal(
    by.baohe.couplet,
    '祖训昭垂我后嗣子孙尚克钦承有永，天心降鉴惟万方臣庶当思容保无疆。'
  );
  for (const h of halls) {
    assert.equal(h.couplet.includes('\n'), false);
    assert.ok(h.couplet.length > 15);
  }
});

test('保和殿殿试必须写明「乾隆五十四年（1789）起」，不得说成所有朝代恒定', () => {
  const baohe = halls.find((h) => h.id === 'baohe');
  const joined = JSON.stringify(baohe);
  assert.ok(joined.includes('1789'), '必须出现 1789');
  assert.ok(joined.includes('乾隆五十四年'), '必须出现乾隆五十四年');
  assert.equal(/自明代起(?:一直)?(?:举行)?殿试/.test(joined), false);
});

test('用途 / 沿革 / 细节 / 来源 四类资料齐备', () => {
  for (const h of halls) {
    assert.ok(h.uses.length >= 3, h.id + ' uses 不足');
    assert.ok(h.history.length >= 4, h.id + ' history 不足');
    assert.ok(h.details.length >= 5, h.id + ' details 不足');
    assert.ok(h.source.length >= 2, h.id + ' source 不足');
    for (const s of h.source) assert.match(s.url, /^https:\/\//);
    for (const y of h.history) assert.ok(Number.isInteger(y.year));
  }
});

test('沿革覆盖 1420 / 1562 / 1645 三个改名节点', () => {
  for (const h of halls) {
    const years = h.history.map((x) => x.year);
    assert.ok(years.includes(1420), h.id + ' 缺 1420');
    assert.ok(years.includes(1562), h.id + ' 缺 1562');
    assert.ok(years.includes(1645), h.id + ' 缺 1645');
  }
});

test('不含 emoji', () => {
  const raw = fs.readFileSync(path.join(ROOT, 'src/content/halls.json'), 'utf8');
  assert.equal(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(raw), false);
});

test('比较条比例：按面积线性映射到 [0,1]', () => {
  assert.equal(compareBarScale(2377, 2377), 1);
  assert.ok(Math.abs(compareBarScale(580, 2377) - 580 / 2377) < 1e-12);
  assert.ok(Math.abs(compareBarScale(1240, 2377) - 1240 / 2377) < 1e-12);
  assert.equal(compareBarScale(0, 2377), 0);
  assert.equal(compareBarScale(100, 0), 0);
  assert.equal(compareBarScale(NaN, 2377), 0);
});

test('校验器能抓到坏数据', () => {
  const bad = JSON.parse(JSON.stringify(halls));
  bad[0].areaSqm = 0;                 // 面积必须为正
  bad[1].roof = 'round-dome';         // 屋顶类型不在白名单
  bad[2].totalHeightM = -1;           // 通高必须为正数或 null
  bad[2].source[0].url = 'http://insecure.example'; // 必须是 https
  bad[0].couplet = '';                // 对联不可为空
  const r = validateHallData(bad);
  assert.equal(r.ok, false);
  assert.ok(r.errors.length >= 4, '应至少抓到 4 项错误，实际 ' + r.errors.length);
});

test('度量格式化', () => {
  assert.equal(formatMetric(2377, 'm²'), '2377 m²');
  assert.equal(formatMetric(35.05, 'm'), '35.05 m');
});

#!/usr/bin/env node
/**
 * run-tests.mjs —— 唯一测试入口
 *
 * 顺序：
 *   1. node --test 跑四个单元测试文件（内容 / 构建产物 / 几何 / 对比度）
 *   2. playwright test 跑真实 Chrome 端到端
 *
 * 产出：
 *   reports/evidence/npm-test.log      —— 两个阶段的完整 stdout+stderr
 *   reports/evidence/test-summary.json  —— 从日志解析出的真实统计
 *
 * 退出码：两个阶段都通过才是 0。
 *
 * ⚠ 注意：`node --test` 从测试进程里被调用时，子进程会继承
 *    NODE_TEST_CONTEXT=child-v8，node:test 会认为「在测试文件里递归调用」
 *    → 跳过全部测试文件但退出码仍是 0。这里必须先 delete 这个变量。
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EVIDENCE = path.join(ROOT, 'reports/evidence');

delete process.env.NODE_TEST_CONTEXT;

fs.mkdirSync(EVIDENCE, { recursive: true });

const UNIT_FILES = [
  'tests/data.test.mjs',
  'tests/build.test.mjs',
  'tests/geometry.test.mjs',
  'tests/contrast.test.mjs'
];

const log = [];

function run(cmd, args, label) {
  const started = Date.now();
  const res = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, NODE_TEST_CONTEXT: undefined },
    maxBuffer: 64 * 1024 * 1024
  });
  const durationMs = Date.now() - started;
  const out = (res.stdout || '') + (res.stderr || '');
  log.push({
    label,
    command: `${cmd} ${args.join(' ')}`,
    exitCode: res.status,
    durationMs,
    output: out
  });
  process.stdout.write(out);
  return { exitCode: res.status, durationMs, output: out };
}

/* ---------------- 1. 单元测试 ---------------- */

console.log('\n=== 单元测试（node --test）===\n');
const unit = run(
  process.execPath,
  ['--test', '--test-reporter=tap', ...UNIT_FILES],
  'node --test'
);

function parseTap(summary) {
  const total = /# tests (\d+)/.exec(summary);
  const pass = /# pass (\d+)/.exec(summary);
  const fail = /# fail (\d+)/.exec(summary);
  const skip = /# skipped (\d+)/.exec(summary);
  return {
    total: total ? Number(total[1]) : 0,
    passed: pass ? Number(pass[1]) : 0,
    failed: fail ? Number(fail[1]) : 0,
    skipped: skip ? Number(skip[1]) : 0
  };
}

const unitStats = parseTap(unit.output);

/* ---------------- 2. 端到端 ---------------- */

console.log('\n=== 端到端（playwright / 真实 Chrome）===\n');
const e2e = run(
  process.execPath,
  [path.join(ROOT, 'node_modules/@playwright/test/cli.js'), 'test'],
  'playwright test'
);

function parsePlaywright() {
  const file = path.join(EVIDENCE, 'playwright.json');
  if (!fs.existsSync(file)) return { total: 0, passed: 0, failed: 0, skipped: 0 };
  try {
    const j = JSON.parse(fs.readFileSync(file, 'utf8'));
    let total = 0;
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    const walk = (suite) => {
      for (const spec of suite.specs || []) {
        for (const test of spec.tests || []) {
          total++;
          const status = test.status || 'unknown';
          if (status === 'expected') passed++;
          else if (status === 'skipped') skipped++;
          else failed++;
        }
      }
      for (const child of suite.suites || []) walk(child);
    };
    for (const s of j.suites || []) walk(s);
    return { total, passed, failed, skipped };
  } catch (e) {
    return { total: 0, passed: 0, failed: 0, skipped: 0 };
  }
}

const e2eStats = parsePlaywright();

/* ---------------- 汇总 ---------------- */

const summary = {
  command: 'npm test',
  generatedBy: 'scripts/run-tests.mjs',
  exitCode: unit.exitCode === 0 && e2e.exitCode === 0 ? 0 : 1,
  unit: { ...unitStats, exitCode: unit.exitCode, durationMs: unit.durationMs },
  e2e: { ...e2eStats, exitCode: e2e.exitCode, durationMs: e2e.durationMs },
  total: unitStats.total + e2eStats.total,
  passed: unitStats.passed + e2eStats.passed,
  failed: unitStats.failed + e2eStats.failed,
  skipped: unitStats.skipped + e2eStats.skipped
};

fs.writeFileSync(
  path.join(EVIDENCE, 'test-summary.json'),
  JSON.stringify(summary, null, 2) + '\n',
  'utf8'
);

const logText = log
  .map(
    (l) =>
      `===== ${l.label} =====\n命令: ${l.command}\n退出码: ${l.exitCode}\n耗时: ${l.durationMs}ms\n${'-'.repeat(60)}\n${l.output}\n`
  )
  .join('\n');
fs.writeFileSync(path.join(EVIDENCE, 'npm-test.log'), logText, 'utf8');

console.log('\n===== 测试汇总 =====');
console.log(`单元测试 : ${unitStats.passed}/${unitStats.total} 通过, ${unitStats.failed} 失败, ${unitStats.skipped} 跳过 (exit ${unit.exitCode})`);
console.log(`端到端   : ${e2eStats.passed}/${e2eStats.total} 通过, ${e2eStats.failed} 失败, ${e2eStats.skipped} 跳过 (exit ${e2e.exitCode})`);
console.log(`合计     : ${summary.passed}/${summary.total} 通过, ${summary.failed} 失败`);
console.log(`报告     : reports/evidence/test-summary.json`);
console.log(`日志     : reports/evidence/npm-test.log`);

process.exit(summary.exitCode);

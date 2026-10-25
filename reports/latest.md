# 执行报告 SFLIP-001：礼序 · 故宫外朝三大殿

## 结论

**DELIVERABLE。** 规划案 A1–A11 全部通过，`design-quality-bar.md` A–G 逐条通过（无 FAIL、无未标注的 N/A），
本机测试 **64/64 通过**（单元 50 + 真实 Chrome 端到端 14），
console error 0 / pageerror 0 / 外部自动请求 0，CLS 0，60 帧采样帧时差 median 16.7 ms / p95 16.7 ms。
交付物是可 `file://` 双击打开的单文件 `dist/index.html`（513,388 bytes / gzip 237.9 KiB）。

---

## 1. 交接指纹与被测环境

| 项 | 值 |
|---|---|
| 任务号 | `SFLIP-001` |
| 轮次 | `1` |
| nonce | `17b33045578779d0` |
| brief_sha | `8ef8ad9d58ea0c45916574535e171dc9112aca9f` |
| 规划案来源 commit | `f915eedfb2120ba824b7ea6e47ecb33f999f8d67`（网页 ChatGPT 推送） |
| 简报来源 commit | `3644cb0`（本机） |
| **被测实现 commit** | `bb9cd3f0b4b37042521b65d7b23a8f9ab7597588` —— 全部产品代码（HTML / CSS / JS / SVG / 数据 / 测试 / 证据）都在此提交内，本报告与「字体子集去时间戳」加固紧随其后落库 |
| **被测产物** | `dist/index.html` sha256 `5ede1bd35e7eb8f2a478a737bf7f73ef550ab60650651d82f41893ce541287ca` —— 由最终工作树**两次独立执行「字体子集 → 构建」**复现得到（两次 sha256 完全相同），因此该 sha 精确标识被测产物，与提交先后无关 |
| 平台 | macOS 26.4.1 (25E253) · arm64 |
| Node / npm | v26.0.0 / 11.12.1 |
| 浏览器 | Google Chrome **155.0.0.0**（Playwright `channel: 'chrome'`，headless） |
| Playwright | `@playwright/test` 1.64.1（唯一开发依赖） |
| 视口 / 刷新率 | 1440×900 @dpr1；帧时差 16.7 ms 反推 **60 Hz** |
| 产物体积 | 513,388 bytes = **501.4 KiB**（gzip -9：237.9 KiB） |
| 字体 | 4 个 woff2 子集内嵌，原始 191,580 bytes |

指纹校验：`handoff.sh verify` → 「校验通过」；`plan-gate.sh require-plan` → 退出码 **0**。

---

## 2. 抢跑自检

- 闸门放行时间：规划案推送后（`f915eed`），`require-plan` 首次返回退出码 0。
- **规划案到位之前，本机在受管路径下写下的实现文件：0 个。**
  受管路径（`index.html`、`web/`、`assets/`、`styles/`、`scripts/`、`src/`、`public/`）在简报提交后全部处于
  `PLAN_BLOCK`；闸门探针实测：故意提交 `web/__gate_probe.js` 被拦下并打印「网页规划案还没到位 → 受管路径被拦截」。
  规划案到位前本机只写了白名单物料：`handoff/briefs/SFLIP-001.md`、`notes/facts-three-halls.md`、`handoff/gate.json`、`handoff/session.md`。
- 规划案到位后，本机按方案实现了 P01–P12 全部工作包。

---

## 3. 方案执行映射（P01–P12）

| 工作包 | 落地文件 | 状态 |
|---|---|---|
| P01 工程骨架与单文件构建 | `package.json`、`package-lock.json`、`scripts/build.mjs`、`scripts/serve.mjs` | 完成 |
| P02 令牌 / 字体 / 无障碍 reset | `src/styles/tokens.css`、`src/styles/base.css`、`src/assets/fonts/*.woff2`、`src/assets/licenses/Noto-OFL.txt`、`scripts/extract-glyphs.mjs` | 完成 |
| P03 完整内容与数据契约 | `src/content/halls.json`、`index.html`（七章全文）、`src/js/data.js` | 完成 |
| P04 轴线与太和殿 SVG | `src/art/axis.svg`、`src/art/taihe.svg` | 完成 |
| P05 中和殿与保和殿 SVG | `src/art/zhonghe.svg`、`src/art/baohe.svg` | 完成 |
| P06 内容网格 / 指标 / 匾联 / 比较 | `src/styles/layout.css`（C04/C06/C07/C09/C10/C11） | 完成 |
| P07 导航 / 焦点 / 弹层 / 状态 | `src/js/navigation.js`、`src/js/status.js`、`index.html`（header / dialog） | 完成 |
| P08 六套动画时间轴 | `src/js/motion.js`、`src/styles/motion.css` | 完成（含 T1/T3/T4 的结构适配，见 §6） |
| P09 四态与异常边界 | `src/js/boot.js`、`src/js/status.js`、`[data-state]` 样式 | 完成 |
| P10 全断点与 200% 文字 | `src/styles/layout.css` 全部 @media、`scroll-margin-top` | 完成 |
| P11 浏览器验收 / 性能 / 内容核查 | `tests/*.test.mjs`、`tests/e2e.spec.mjs`、`playwright.config.mjs`、`scripts/evidence.mjs`、`reports/evidence/*` | 完成 |
| P12 报告与收口 | `reports/latest.md`（本文）、`README.md` | 完成 |

---

## 4. A1–A11 验收对照

| # | 标准 | 怎么验的 | 结果 | 证据 |
|---|---|---|---|---|
| A1 | `npm ci && npm run build` 退出 0；`dist/index.html` 存在且 `file://` 与 http 两种方式完整显示 | `npm ci` → `npm run build`；e2e 用 `pathToFileURL` 打开 `dist/index.html` | **通过** | `reports/evidence/test-summary.json`、`npm-test.log` |
| A2 | console error 0 / pageerror 0 / **外部自动请求 0** | Playwright `page.on('console'/'pageerror'/'request')` 采集，file:// 与 http 两路 | **通过**（0 / 0 / 0） | `browser-errors.json`、`network.json` |
| A3 | 320 / 375 / 480 / 768 / 1024 / 1440 无横向溢出；可点区 ≥44×44；200% 字号不丢内容 | 逐宽度实测 `scrollWidth ≤ clientWidth`；遍历全部 `a/button/[role=button]` 量包围盒；`font-size:200%` 后复测 | **通过**（6 宽度溢出 0；小于 44px 的控件 0） | `overflow.json`、`tap-targets.json`（`[]`）、`text-200percent.png` |
| A4 | 键盘完成全部核心操作；焦点环可见；Esc 关浮层 | Tab → 跳转主内容 → Enter → 聚焦索引按钮 → Enter 开 dialog → Esc → 断言焦点回到 `#index-open`；热点按钮键盘展开/收起 | **通过** | `keyboard-focus.png`、e2e 用例 6 / 7 |
| A5 | `prefers-reduced-motion` 下不隐藏任何内容 | Playwright `reducedMotion:'reduce'` context；断言三殿 SVG 透明度 >0.9、正文长度 >200、**探针帧数不增长** | **通过** | `reduced-motion.png`、e2e 用例 8 |
| A6 | 正文 ≥4.5:1 / 大字 ≥3:1 / 边框 ≥3:1 / 禁用 ≥2:1 | `scripts/evidence.mjs` 用 sRGB 标准算法逐对计算 38 组 | **通过**（38/38） | `contrast.json` |
| A7 | 连续 60 帧：frameId 唯一、时间戳严格递增、≥30 帧视觉变化、帧时差达标 | 70 次滚动驱动；读 `window.__sflipProbe.frames` 末 60 条 + 页面内自装样式签名采样 | **通过**（60/60 唯一、严格递增、**57/60 帧有视觉变化**、median 16.7ms / p95 16.7ms / max 16.8ms） | `perf-60frames.json` |
| A8 | CLS ≤ 0.1；首屏可交互 ≤2500ms | `PerformanceObserver({type:'layout-shift', buffered:true})` 仅累计 `!hadRecentInput`；`performance.getEntriesByType('navigation')` | **通过**（**CLS = 0**；FCP 64 ms，domInteractive 10.4 ms，loadEventEnd 28.6 ms） | `cls.json`、`perf-navigation.json` |
| A9 | `npm test` 退出 0；条数从 stdout 解析 | `scripts/run-tests.mjs` 跑 node:test（TAP reporter）→ 解析 `# tests/# pass/# fail`，再跑 Playwright → 解析 `playwright.json`，写 `test-summary.json` | **通过**（**64/64**：单元 50/50、e2e 14/14） | `test-summary.json`、`npm-test.log`、`playwright.json` |
| A10 | 三殿各自形制/数字/用途/匾额/对联/沿革齐备，DOM 文本 + 视觉双重检查 | e2e 读 `document.body.innerText` 逐项断言；禁用 JS 后再读一遍 | **通过** | e2e 用例 3 / 14、`no-js.png` |
| A11 | 三段构图/颜色重心/动效节奏可区分 | 三图并排截图肉眼盲辨 + 动效元数据互不相同 | **通过** | `a11-three-roofs-1440.png`、`hall-{taihe,zhonghe,baohe}-1440.png` |

---

## 5. 设计落地对照（design-quality-bar.md A–G）

| 条目 | 结论 | 证据 |
|---|---|---|
| A1 排版 | 通过 | 字族 `--font-display` / `--font-body` / `--font-num` 三族 + 完整 fallback；字阶 9 级（12/14/16/20/25/31/39/48/61，比例 1.25）；正文 `max-width: 40ch`；行高正文 1.7 / 标题 1.26；`h1–h6` 全部重置；数字用 `font-variant-numeric: tabular-nums`；`font-feature-settings: "kern" 1, "palt" 1` |
| A2 色彩 | 通过 | 全部颜色在 `src/styles/tokens.css`（唯一真源），其余 CSS 无裸 hex（`contrast.test.mjs` 断言）；38 组 CR 全部达标，最低正文档 5.30:1（`text-paper-muted` on `bg-paper`）；焦点色与悬停/选中可区分；语义状态不只靠颜色（带图标 + 文字） |
| A3 间距与栅格 | 通过 | 4px 基准 `--space-1..9` = 4/8/12/16/24/32/48/64/96；容器 max 1168px；正文与图块间隙 desktop 64 / 移动 32；同组标题到正文 16/24 |
| A4 形状与层级 | 通过 | 圆角 4/8/12/16/999 五档；阴影 0–4 五档 + 集中 z-index 表（`--z-base`…`--z-focus`）；分隔用边框或间距二选一 |
| A5 图标与媒体 | 通过 | 自绘 9 枚 24×24 线描图标（stroke-width 1.75，round cap/join），同一网格；**零 emoji**（`data.test.mjs` 断言）；SVG 有 `role="img"` + `<title>`/`<desc>`；装饰组 `aria-hidden`；`aspect-ratio` 固定，无布局跳动 |
| B1 状态完整性 | 通过 | 可交互组件（导航 / 索引 / 热点 / CTA / 开关）均有 default / hover / pressed / focus / disabled；空 / 载 / 错 / 成四态由 `?sflip_state=` 与状态条承载；纯静态组件标注不适用 |
| B2 反馈与时序 | 通过 | 实测交互反馈 **4.9 ms**（≤100 ms）；加载态有进度文字；无重复提交面 |
| B3 导航与 IA | 通过 | 原生 `<a href="#…">` + JS 增强 `aria-current`；层级 2 层（章节 → 小节）；无劫持滚动；危险操作与主操作不并排（无破坏性操作） |
| B4 文案 | 通过 | 状态条有具体中文（"三殿导览已就绪…" / "线稿已就位，正在启动光影层…" / "装饰效果未能启动，三殿文字与线稿仍可阅读…"）；按钮写动词短语；无「操作失败」「确定吗？」 |
| B5 响应式 | 通过 | 断点 480 / 768 / 1024 / 1280 写死，各断点有明确布局规则；≤767 导航收为图标、指标 2 列；实测 320–1440 六宽度零溢出 |
| C 无障碍 | 通过 | 键盘走完主流程（实测）；焦点环 2px + 2px offset；标题层级不跳级（H1 仅序章）；图片有 `title`/`desc`；图标按钮有 `aria-label`；`prefers-reduced-motion` 尊重；200% 字号不丢内容 |
| D 性能 | 通过 | 首屏 FCP 64 ms / domInteractive 10.4 ms（≤2500 ms）；交互反馈 4.9 ms；CLS 0；动画**只用 `translate` / `scale` / `opacity`**（不碰 top/left/width/height）；60 帧 median 16.7 ms |
| E 工程与一致性 | 通过 | 令牌单一真源；同类组件圆角/间距/状态一致；零运行时依赖、零构建依赖、唯一开发依赖；目录与命名一致；无 TODO / 死代码 |
| F 交付前自检 | 通过 | 见 §6 视觉自检表 + §7 逐条证据 |
| G 禁项 | 通过（0 命中） | 无浏览器默认样式残留；无占位文案；同类元素一致；四态齐备；焦点可见、键盘可走；移动端零横向滚动、控件 ≥44px；无 emoji、无多套图标；无裸 hex、对比不足；动画未掉帧、未无视 reduced-motion |

---

## 6. 视觉自检

| 检查项 | 看的是什么 | 看到什么 | 结论 |
|---|---|---|---|
| 默认态 1440 | 首屏 | 左文右图分栏；H1「一道中轴，三重殿宇」为衬线显示体；右侧中轴线总图完整可见，无截檐 | 通过（`hero-1440.png`） |
| 太和殿 | 双檐庑殿、大体量 | 上下两重檐、外扩副檐、正脊两端螭吻、11 根朱柱、檐脊 11 个可数走兽符号、三层须弥座 | 通过（`hall-taihe-1440.png`） |
| 中和殿 | 四角攒尖 / 中央宝顶 / 方形留白 | 正上方俯视，四条斜脊汇于鎏金宝顶与金色晕轮，同心方框台座，南面槅扇较密 | 通过（`hall-zhonghe-1440.png`） |
| 保和殿 | 歇山 / 山面 / 殿试长卷 / 减柱造 | 侧前方斜视，右侧可见朱色山面三角，9 根外檐柱齐全，虚线负形标示减去的前檐六根内金柱，右挂殿试答卷纸格与朱印 | 通过（`hall-baohe-1440.png`） |
| **V5 去标签盲辨** | 三图并排 | 去掉全部文字仍能一眼分出：宽而双檐 / 方而尖顶 / 斜而歇山带山面 | **通过**（`a11-three-roofs-1440.png`） |
| 匾额与对联 | 可完整阅读 | 三条匾额与三副对联在纸底卡片上完整呈现，标点为全角，无截断 | 通过（`hall-*-1440.png`） |
| 六档宽度 | 无横向溢出 | 320 / 375 / 480 / 768 / 1024 / 1440 实测 `scrollWidth == clientWidth` | 通过（`overflow.json`） |
| 组件各态 | hover/press/focus/disabled/empty/loading/error/success | 逐态截图四态 + 键盘焦点截图 | 通过（`state-*.png`、`keyboard-focus.png`） |
| 键盘 / ARIA | 焦点顺序、Esc、回焦点 | Tab 首落跳转链接；dialog Esc 关闭后焦点回到触发按钮 | 通过（e2e 用例 6） |
| reduced-motion | 只关装饰 | 三殿 SVG 与全文仍 100% 可见，采样帧不再增长 | 通过（`reduced-motion.png`） |
| 节奏与 4px 令牌 | 间距 / 圆角 | 卡片 8px、按钮 8px、标签 4px、浮层 16px；所有间距落在 4px 梯度 | 通过 |
| 无灰占位 / emoji / 混乱投影 | 全页 | 建筑图为程序化设色线稿；零 emoji；阴影仅 5 档 | 通过 |

---

## 7. 测试证据

命令：`npm test` → `node scripts/run-tests.mjs` → 单元（node:test）+ 端到端（Playwright / 真实 Chrome）。

```
===== 测试汇总 =====
单元测试 : 50/50 通过, 0 失败, 0 跳过 (exit 0)
端到端   : 14/14 通过, 0 失败, 0 跳过 (exit 0)
合计     : 64/64 通过, 0 失败
```

- 数量来源：`reports/evidence/test-summary.json`，由 `scripts/run-tests.mjs` 从 **node:test 的 TAP 输出**与
  **Playwright 的 JSON reporter** 解析，不是手写。
- 完整 stdout + stderr + 退出码：`reports/evidence/npm-test.log`。
- 单元测试清单（条数由各文件的 TAP `# tests` 行实读）：`tests/data.test.mjs`（**17** 条）、
  `tests/build.test.mjs`（**12** 条）、`tests/geometry.test.mjs`（**12** 条）、
  `tests/contrast.test.mjs`（**9** 条），合计 **50** 条。
- 端到端清单：`tests/e2e.spec.mjs`（14 条）。

**浏览器错误 / 网络清单**

| 项 | 值 |
|---|---|
| console error | **0** |
| pageerror | **0** |
| 外部 http/https/ws 请求 | **0** |
| file:// 总请求 | 1（页面自身），字体 / SVG / CSS / JS 全部内嵌为 data URI |
| file:// 复测 | 通过（`tests/e2e.spec.mjs` 用例 1 / 2 / 14；`no-js.png` 证明禁用 JS 仍可完整阅读） |

**60 帧性能采样**（`reports/evidence/perf-60frames.json`）

| 项 | 值 | 目标 |
|---|---|---|
| 总采样帧 | 257 | — |
| 取样 | 末 60 帧 | — |
| frameId 唯一 | **60 / 60** | 互不相同 |
| 时间戳严格递增 | **是** | 严格递增 |
| 出现视觉变化的帧 | **57 / 60** | ≥30 |
| 帧时差 median | **16.7 ms** | ≤20 ms |
| 帧时差 p95 | **16.7 ms** | ≤33.4 ms |
| 帧时差 max | **16.8 ms** | — |

**导航与交互**（`reports/evidence/perf-navigation.json`）：FCP 64 ms · domInteractive 10.4 ms · loadEventEnd 28.6 ms · 交互反馈 4.9 ms · 文档高 11,348 px。
**CLS**（`reports/evidence/cls.json`）：**0**（加载与 7 段滚动期间，无任何 `hadRecentInput=false` 的 layout-shift）。
**对比度**（`reports/evidence/contrast.json`）：**38 / 38 通过**，最低正文档 5.30:1，最高 16.75:1。

---

## 8. 偏离规划案之处

> 规划案是施工图；以下每一处偏离都有明确的技术原因、判据与影响，且**没有降低任何一条验收标准**。

1. **规划案 §4.3 T1「两道檐层从 y=+36 与 y=+18 相继归位」→ 实现为「屋身+檐口整体下落 36px → 斗栱延迟下落 18px → 柱群视差 12→−6px → 11 只脊兽逐只显影」**
   - 原因：交付的 SVG 图层结构里，上檐与下檐的瓦垄线、脊线、螭吻分属 `roof` 组内的不同子元素，`eaves` 组是与之平行的檐口曲线组；要把「两道檐层」各自单独平移，必须重排 SVG 几何分组，重排后檐口曲线会与屋面脱开，产生可见错位（质量线 A5 媒体一致性、D 性能）。
   - 实际做法：`roof` 与 `eaves` 同幅同速下落（两者保持咬合），`dougong` 在其后 18px 归位，柱群做深度视差，11 只脊兽按 70ms/只错峰显影 —— 共 4 组并发运动 + 11 步计数，视觉复杂度高于原方案。
   - 判据：质量线 D（只用 transform/opacity）、A5（不破坏已通过的视觉）、§4.3 的「多—重—大」节奏。
   - 影响：无信息损失；动效语义（层层落位 + 逐只数兽）保持。

2. **规划案 §4.3 T4「歇山屋顶两个坡面分别向外平移 18px 再归位」→ 实现为「整组屋面下落 18px 归位 + 殿试纸卷由 translateX 24px→0 滑入（延后 280ms）+ 9 只小兽错峰显影」**
   - 原因：保和殿上层歇山的前坡多边形与右侧山坡多边形共用山尖顶点，单独反向平移会把山面撕开。
   - 判据 / 影响：同 1；殿试纸卷的滑入与延后节奏完全按原方案执行。

3. **规划案 §4.3 T5「五个文本点单向顺序显影（标注用 opacity，不移动文字布局）」→ 实现为「年份标记 opacity 0.25→1 + 整条 translateY 8px→0；正文文字恒为 opacity 1」**
   - 原因：组件规格 C10 明确要求「文字始终可见」，若整条 opacity 归零会与之矛盾（§3.2 与 §4.3 的内部张力，按「质量线与组件规格优先于单条动效描述」取舍）。
   - 影响：信息在任何时刻都可读；顺序显影的叙事效果保留。

4. **规划案 §5.4「总 HTML ≤900 KiB / gzip 等效 ≤300 KiB」→ 实施为「按排版角色切分字体子集」**
   - 原因：四套全量 CJK 子集原始 663 KiB，base64 后 884 KiB，单页将达 1,114 KiB（虽在 1.2 MiB 硬门槛内，但超出 900 KiB 目标且 gzip 达 703 KiB，远超 300 KiB）。
   - 实际做法：`scripts/extract-glyphs.mjs` 按角色分集 —— Noto Serif SC 两字重只收**展示型**元素字符（240 字）、Noto Sans SC 400 收**全站**字符（935 字）、Noto Sans SC 600 只收**界面标签型**字符（148 字）。四份 woff2 合计 187.1 KiB。
   - 结果：单页 **501.4 KiB**（≤900 KiB ✓），gzip **237.9 KiB**（≤300 KiB ✓），硬门槛 1.2 MiB ✓。
   - 影响与已知代价：展示型字符集之外的汉字（如正文里的生僻字）在标题位置会回退到字体栈里的 `Songti SC` / `STSong`。已写入 README「技术限制」。未做 `unicode-range` 限制，逐字回退由浏览器处理。

5. **规划案 §5.2 文件清单未列 `scripts/evidence.mjs`**
   - 原因：§9 要求交付「颜色样本 CR 表 / 浏览器错误清单 / 网络清单 / 导航计时」作为可复核证据。
   - 影响：新增一个**只读输入、只输出结论**的辅助校验脚本，不进入产品代码，不改变任何接口。

6. **SVG 的动效元数据是交付后补加的**
   - 原因：规划案 §4.3 假定建筑图自带可动子层；实际交付的 SVG 只有图层分组 id，没有动效目标。
   - 做法：对 4 个 SVG 做一次**几何等价的标注**（只加 `data-anim` 属性与包装组，不改任何坐标与路径），并在 `tests/geometry.test.mjs` 中断言这些属性存在。
   - 验证：标注前后重新渲染 4 张图并肉眼比对，**画面完全一致**。
   - 影响：无视觉回归；动效目标变为可测试的一等数据。

7. **规划案 §5.2 声明「构建依赖 0」** → 实际 `npm run build` 只用 Node 内置模块（fs/path/crypto/child_process），**确实是 0 构建依赖**；唯一开发依赖是 `@playwright/test`。此项无偏离。

8. **超出规划案的加固：整条流水线字节可复现**
   - 规划案 §5.3 只要求「构建重复结果字节一致（**排除时间戳**）」。实测发现 fontTools 会把
     当前时间写进 woff2 的 `head.modified`，导致**字体子集步骤**每次产出的字节都不同
     （本机实测：连续两次子集的 sha256 不同）。
   - 处理：在 `scripts/extract-glyphs.mjs` 末尾抹掉 `head.created` / `head.modified`。
     注意 fontTools 的时间戳开关在**字体对象**上（`TTFont.recalcTimestamp`），不在 `head` 表上——
     第一次写成 `f['head'].recalcTimestamp = False` 无效，实测确认后才改正。
   - 结果：**两次独立执行「子集 → 构建」，字体 sha256 完全一致，`dist/index.html` sha256 也完全一致**
     （`5ede1bd35e7eb8f2…`）。这是比规划案更强的性质。
   - 影响：无产品影响；`tests/build.test.mjs` 的「重复构建字节一致」断言因此覆盖到完整流水线。

---

## 9. 未知项调查结果（U1–U8）

| 编号 | 类型 | 实际怎么查的 | 查到了什么 | 据此做了什么决定 | 用了默认值吗 |
|---|---|---|---|---|---|
| U1 滚动时间线支持面 | 有入口 | Playwright 内 `CSS.supports()` 实测 Chrome 155 | `animation-timeline: scroll()` = true、`view-timeline-name` = true、`timeline-scope` = true、`translate`/`scale` 独立属性 = true、`transform-box: fill-box` = true、`<dialog>.showModal` = true、`font-feature-settings: "palt"` = true | **仍不依赖 `animation-timeline`**（规划案 §2.2 判断：非 Baseline 且非关键内容依赖），改用单一 rAF + 独立 `translate`/`scale` 属性；独立属性是必须的 —— 用 `transform` 会覆盖 SVG 元素自身的 `transform` 属性 | 否（实测） |
| U2 字体子集工具 | 有入口 | `python3 -c "import fontTools,brotli"` + 实际子集化 | fontTools **4.60.2** + brotli 可用；产出 4 个 woff2，最大 119,600 bytes（≤300 KiB ✓）；OFL 许可已随仓 | 按「排版角色」切分四集（见 §8.4） | 否（实测） |
| U3 file:// 协议 | 有入口 | Playwright `pathToFileURL(dist/index.html)` 打开，采集 console/pageerror/request；并额外禁用 JS 打开一次 | 三殿内容、全部 SVG、全部按钮存在；console error 0、pageerror 0、**网络请求 0**（除页面自身）；禁用 JS 后正文仍完整可读 | 单文件构建成立，不做降级 | 否（实测） |
| U4 本机真实性能 | 有入口 | `PerformanceObserver` 采 CLS；`performance.getEntriesByType('navigation')`；rAF 探针采 60 帧 | CLS **0**；FCP 64 ms、domInteractive 10.4 ms、loadEventEnd 28.6 ms；60 帧 median/p95 **16.7 / 16.7 ms**、max 16.8 ms；57/60 帧有视觉变化 | 全部达标，**未触发**规划案的降级分支（关粒子 / 减可动组 / 去滚动跟随） | 否（实测） |
| U5 官方事实复核 | 有入口 | 本机 `web_fetch` 直取故宫博物院官方英文页 `intl.dpm.org.cn/hallsinfo/374.html`（太和殿）与 `367.html`（中和殿） | **无冲突**，且官方口径逐条印证：太和殿「the ten figurines at each of its roof corners」＝ 10 只走兽、「white marble three-tiered terrace」＝三层汉白玉台基、「Imperial Way…carved with dragon patterns」＝御路云龙、「reconstructed during the Kangxi era」＝康熙重建、「renamed…Huangji dian by the Jiajing Emperor」＝1562 改名；中和殿「followed the architectural form of the ancient 'bright hall' (ming tang). It is a square building with windows on four sides」＝明堂形制 + 方形四面窗、「examined sacrificial writings and farm implements」＝阅祝版查农具、「renamed…by the Jiajing Emperor」「designated by the Shunzhi Emperor」＝改名两节点 | 原文照用，无需改写任何一句 | 否（实测） |
| U6 字体准备环境失效 | 无入口 | 未触发：官方 OFL 源下载成功（25,125,512 + 17,772,300 bytes）、子集化与许可随仓全部完成 | — | — | 否（未触发） |
| U7 真实低端移动端 | 无真机入口 | Playwright 375×812 @dpr2 + **CDP `Emulation.setCPUThrottlingRate: 4`**，同 70 次滚动 + 60 帧采样 | 仍锁 **60 fps**（median 16.7 / p95 16.7 / max 16.8 ms）；参与变换的组数 **31**（规划案上限 40） | 按规划案 U7 分支「模拟 p95≤33.4 则保持 ≤40 groups」→ **保留现有实现**（连续滚动跟随动画），不降级为「仅入场」 | 否（模拟实测；**真机未测**，见 §11） |
| U8 精确历史建筑测绘 | 无客观入口 | 无授权 CAD / 构件实测数据；只采用已核简报与官方页面的屋顶类型、间数、面积、匾额 | 无法核验构件尺寸与角度 | 4 张 SVG 全部显式标注「依据公开建筑信息绘制的艺术示意（非测绘比例）」；不推断毫米级参数；几何测试只断言**可数的结构关系**（11 开间 / 10+1 脊兽 / 3×3 / 9×5 / 四斜脊 / 宝顶） | **是（默认）** |

---

## 10. 本机环境与限制

- macOS 26.4.1 arm64 / Node v26.0.0 / npm 11.12.1 / **无 TTY**（全部命令非交互）/ 无付费 API / 无真机。
- **本机 `web_search` 工具不可用**：用户订阅额度用尽，返回 402（`the user's plan balance has run out`）。
  因此本机的品类调研无法进行 —— 这正是 sflipmloop 把「调研」交给网页版 ChatGPT High 的原因。
  本机改用 `web_fetch` 直取 URL 做事实核验（U5 即由此完成）。
- 构建期允许联网（npm registry、GitHub raw 字体源），**运行时零外部请求**。
- Playwright 用系统 Google Chrome（`channel: 'chrome'`），不依赖额外浏览器下载。

---

## 11. 已知限制 / 未测项

1. **未在真实 iOS 设备上实测**（NOT TESTED: actual iOS device）。只有 375×812 @dpr2 + 4× CPU 降速的模拟证据
   （结果仍为 60 fps）。Safari 的抗锯齿、GPU 图层占用与主屏小字表现未做真机验证。
   页面在非 Chromium 环境下仍保证 HTML 静态可见（无 JS 也可完整阅读）。
2. **建筑图是艺术性示意，不是工程复原**。檐口 / 斗栱 / 构件的精确尺寸与角度无法核验，
   未以虚假参数填补；页面与 README 均显式声明。
3. **展示型字符集以外的汉字在标题位置会回退到系统衬线字体**（`Songti SC` / `STSong`），
   跨机器的标题字形一致性因此不是绝对的。详见 §8.4。
4. **中和殿与保和殿没有「含台基通高」的官方数据**，页面只记殿身高度，不做推算。
5. **保和殿殿试写明「乾隆五十四年（1789）起」**，未说成所有朝代恒定。
6. **未配置 CI、未触发 CI、未等待 CI**。本轮验收结论**只以本机测试证据为准**。
7. **未部署到公网**（本轮范围外）。交付物为本地单文件与 public GitHub 仓库。

---

## 12. CI 与远程检查

- 本仓库**没有配置任何 GitHub Actions 工作流**（`.github/` 不存在，`gh api .../actions/workflows` 返回 `total_count: 0`）。
- 推送前用 `scripts/check-workflows.sh` 复核，判定：**「推送不会触发任何远程测试」→ 安全**。
- 因此本轮推送**没有意外触发**任何远程工作流，也不需要改共享工作流或加 `paths-ignore`。
- 本机没有等待任何 CI；**验收结论只以本机测试证据为准**。

---

## 13. 交接是否真实发生

| 项 | 事实 |
|---|---|
| 投递通道 | **A —— 网页 ChatGPT 聊天模式**。已确认浏览器顶部为「聊天」而非「工作 / agent」；思考强度显示 **High**（模型选择器 `6 High`） |
| 网页读到的简报 | `handoff/briefs/SFLIP-001.md`，blob sha `8ef8ad9d58ea0c45916574535e171dc9112aca9f` |
| 网页交回的规划案 | `handoff/plans/SFLIP-001.md`，commit `f915eed`，70,547 bytes / 522 行 |
| 指纹匹配 | **匹配**。`handoff.sh verify` 输出「校验通过」；`plan-gate.sh require-plan` 退出码 0 |
| 网页的调研 | 规划案 §2 列明 5 个标杆（故宫 × Google Arts & Culture《三大殿的独特设计》、故宫官方 Explore/Architecture、The Met 360° Project、Smithsonian 3D、Rijksmuseum Rijksstudio）+ 8 项规范与技术实证（WCAG 2.2、IBM Carbon Typography、Material Design 3 Motion、MDN Scroll-driven Animations、GSAP ScrollTrigger、Noto SC 字体授权、Chrome 性能诊断、Node 原生测试），并逐一写明学到了什么与不照搬什么 |
| 交接仓可见性 | **public**。原因：网页聊天模式靠匿名读 GitHub blob 链接，private 仓会读不到；这是交接的前提，非疏忽 |
| 是否由本机代写规划案 | **否**。规划案由网页 ChatGPT High 在其自己的 clone 里推送（commit `f915eed`，作者 `noyzin2006-arch`），本机只做 `fetch` + `merge` + `verify` |
| 本轮实际用的网页提示词全文 | 见下 |

```
仓库 noyzin2006-arch/forbidden-city-three-halls（public）
base=https://github.com/noyzin2006-arch/forbidden-city-three-halls/blob/main/
只读这 3 个文件：handoff/briefs/SFLIP-001.md、handoff/spec/plan-spec.md、handoff/spec/design-quality-bar.md
先上网调研该品类当下最高水准的产品与设计系统，列出学习结论，再写规划案。
写入 https://github.com/noyzin2006-arch/forbidden-city-three-halls/blob/main/handoff/plans/SFLIP-001.md 然后推送。
若无法写入仓库，就直接在回复里输出规划案全文（markdown 代码块）。
文件开头原样带上（不要改写、不要重排）：
kind: plan
task: SFLIP-001
round: 1
nonce: 17b33045578779d0
brief_sha: 8ef8ad9d58ea0c45916574535e171dc9112aca9f
```

---

## 14. 本轮实际改动

- commit `bb9cd3f0b4b37042521b65d7b23a8f9ab7597588` —— 「feat: 礼序 · 故宫外朝三大殿沉浸式单页（实现 + 测试 + 证据）」
- 新增文件：

```
index.html
package.json / package-lock.json
playwright.config.mjs
README.md
src/content/halls.json
src/art/{axis,taihe,zhonghe,baohe}.svg
src/styles/{tokens,base,layout,motion}.css
src/js/{status,data,navigation,motion,boot}.js
src/assets/fonts/{NotoSerifSC,NotoSansSC}-{400,600}.woff2 + glyphs-*.txt
src/assets/licenses/Noto-OFL.txt
scripts/{build,serve,extract-glyphs,run-tests,evidence}.mjs
tests/{data,build,geometry,contrast}.test.mjs
tests/e2e.spec.mjs
dist/index.html + dist/build-manifest.json
reports/evidence/（14 个证据文件：日志 / JSON / 截图）
reports/latest.md
```

- 设计令牌文件：`src/styles/tokens.css`（唯一真源，含 §8.4 新增的 `--accent-vermilion-light` 与 `--print-bg` / `--print-fg`，
  二者均为把裸 hex 从非令牌文件里清走而新增，非设计变更）。
- 未改动：`handoff/spec/*`、`handoff/briefs/*`、`handoff/gate.json`、`.github/**`。

---

## 15. 后续

**无。** 本轮交付自足：可 `file://` 双击打开的 `dist/index.html`、public GitHub 仓库、
本机实测证据与本报告。部署到公网属本轮范围外，如需要可另行决定。

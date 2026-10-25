# 礼序 · 故宫外朝三大殿

> 太和殿 · 中和殿 · 保和殿 —— 一张沉浸式单页网页。
> 自绘建筑线稿 + 滚动叙事动画 + 零外部请求的离线单文件交付。

---

## 这是什么

一张介绍故宫外朝三大殿的中文单页。它沿着紫禁城的中轴线自南向北走过三座殿宇，
用**自绘的 SVG 建筑线稿**（不是照片、不是 3D 模型、不是图标拼贴）配上滚动叙事动画，
讲清三件事：

- **它们长什么样** —— 三种完全不同的屋顶：重檐庑殿顶 / 单檐四角攒尖顶 / 重檐歇山顶；
- **它们有多大** —— 11 开间 2377 m²、3 间见方 580 m²、9 间 1240 m²；
- **它们做什么** —— 大朝仪与传胪、典礼前的阅视与查验、殿试与赐宴。

三殿共用一座高 8.13 m 的三层汉白玉台基，共覆黄琉璃瓦、同用朱红立柱与汉白玉栏板。
共享的是等级与秩序，区别的是屋顶、开间与职掌。

## 快速启动（macOS）

```bash
cd forbidden-city-three-halls

npm ci            # 安装唯一的开发依赖 @playwright/test
npm run build     # 生成 dist/index.html（单文件，自足）
npm run dev       # 本地预览 http://127.0.0.1:4173/
npm test          # 单元测试 + 真实 Chrome 端到端
```

`npm run build` 产出的是**一个 HTML 文件**，所有 CSS / JS / SVG / 字体全部内嵌。

```bash
open dist/index.html      # 双击直接看 —— file:// 协议同样完整可用
```

## 文件协议（file://）为什么能直接打开

普通前端项目用 ES modules 或外链样式表，`file://` 下会被浏览器的同源策略挡掉。
本项目因此不走打包器，而是由 `scripts/build.mjs` 把
`src/styles/*.css`、`src/js/*.js`、`src/art/*.svg` 与 base64 的 woff2 字体
拼进 `index.html` 的注入位，产出**没有 `<script src>`、没有 `type="module"`、没有外链样式表**
的单文件。构建时有一条硬性守卫：一旦产物里出现外链资源、`fetch()`、`XMLHttpRequest`
或 `WebSocket`，构建立即失败。

## 内容来源

文字与数字来自故宫博物院官方公开资料与公开百科条目，逐条核对后写入：

- 故宫博物院官方中文站 <https://www.dpm.org.cn/>
- 故宫博物院官方国际站 · 建筑探索 <https://intl.dpm.org.cn/explore.html>
- 故宫博物院 × Google Arts & Culture《三大殿的独特设计》
  <https://artsandculture.google.com/story/the-unique-design-of-the-three-great-halls-the-palace-museum/1AWx0BllwxhDJg?hl=en>
- 中文维基百科：太和殿 / 中和殿 / 保和殿
- UNESCO 世界遗产：北京中轴线——中国理想都城秩序的杰作 <https://whc.unesco.org/en/list/1714>

这些链接**只在你主动点击时才会打开**，页面本身不发起任何自动网络请求。

## 构件图的非测绘说明

**本页所有建筑图均为依据公开建筑信息绘制的艺术性示意（非测绘比例）。**

图中的柱网、脊兽、斗栱、台基层数、减柱造位置都是**示意性表达**，用于帮助辨认形制差异，
不作为工程测量或复原依据，也不宣称任何构件的毫米级尺寸。页面不包含任何实景照片、
第三方图像资产或受版权保护的素材。字体使用 SIL Open Font License 的 Noto Serif SC /
Noto Sans SC 子集，许可全文见 `src/assets/licenses/Noto-OFL.txt`。

## 减少动效

本机系统若开启了「减弱动态效果」（macOS：设置 → 辅助功能 → 显示 → 减弱动态效果），
页面会自动停用全部装饰动画，正文与线稿照常完整可读。
也可以随时用顶栏的「关闭动态装饰」按钮手动关闭，选择会被记住（同标签页内）。

两种情况下都不会丢失任何一个数字或一条对联。

## 技术限制与已知限制

- **未在真实 iOS 设备上实测。** 只有本机 Chrome 的 375px 模拟证据；Safari 的抗锯齿、
  GPU 图层占用与主屏小字表现未做真机验证。
- **中和殿与保和殿没有「含台基的通高」官方数据**，页面因此只记殿身高度（29 m / 29.50 m），
  不做推算——三大殿共用的那座 8.13 m 台基也不被加到任何一殿的高度上。
- **保和殿的殿试是乾隆五十四年（1789）起才固定于此**，页面不会说成所有朝代恒定。
- **建筑图的精确造型无法核验**，已知限制，不以虚假参数填补。
- 页面依赖原生 `translate` / `scale` / `opacity` 独立变换属性（而非 `transform`），
  以免覆盖 SVG 元素自身的 `transform` 属性。

## 目录结构

```
index.html                  语义页面模板（正文全部在这里，不靠 JS 注入）
src/content/halls.json      三殿结构化数据（构建期与正文互为校验）
src/art/{axis,taihe,zhonghe,baohe}.svg
                             四张自绘建筑线稿，含 title/desc 与动效元数据
src/styles/tokens.css       唯一设计令牌真源（颜色 / 字阶 / 间距 / 动效）
src/styles/{base,layout,motion}.css
src/js/{status,data,navigation,motion,boot}.js
scripts/build.mjs           单文件构建 + 外链守卫 + 正文一致性核对
scripts/serve.mjs           只监听 127.0.0.1 的极简预览服务
scripts/extract-glyphs.mjs  按排版角色切分字体子集（fontTools）
scripts/run-tests.mjs       唯一测试入口（单元 + 端到端，单一退出码）
tests/                      单元测试与 Playwright 端到端
reports/latest.md           执行报告与验收证据
```

## 许可

代码与自绘矢量图随本仓库交付。字体为 SIL Open Font License 1.1，
许可全文见 `src/assets/licenses/Noto-OFL.txt`。

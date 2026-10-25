kind: plan
task: SFLIP-001
round: 1
nonce: 17b33045578779d0
brief_sha: 8ef8ad9d58ea0c45916574535e171dc9112aca9f

# SFLIP-001 首轮完整执行规划｜礼序·故宫外朝三大殿
**规划性质：** 一次性交付给 macOS 执行 Agent；仅设计、研究、规划，不代表已实现或本机实测。  
**研究日期：** 2026-10-25。**权威内容底稿：** handoff/briefs/SFLIP-001.md；受限只读范围为该简报、plan-spec.md、design-quality-bar.md 三个文件。  
**总裁决：** 采用路线 A——全程序化、可缩放 SVG 建筑图像 + 原生 CSS/JS 合成层叙事动画；不使用实景照片、视频、Three.js、外部热链；以真实可读的长文章为基底，以滚动动画增强。**运行页面是离线单页，不是 3D 模型、照片拼贴或信息卡片墙。**

## 1. 需求、范围与非目标

### 1.1 任务与体验承诺
用户原话：“启动 s flip m loop 制作一个极其酷炫精美的介绍故宫太和殿、中和殿、保和殿这三大殿的一个网页，有各种炫酷的动画、艺术的表达。”

转化为体验目标：访客在前 5 秒辨认出“故宫三大殿 / 一条中轴线 / 三种不同屋顶”；在后续 3–5 分钟沿中轴线从南向北阅读三殿，通过能检验真伪的建筑线稿、图表、礼制故事与动态切换认识“威严—中和—文脉”；结束时能说出重檐庑殿顶 / 单檐攒尖顶 / 重檐歇山顶的区别，以及三殿的主要用途。页面的动画是解释信息的工具，不遮蔽正文。

### 1.2 本轮范围
1. 一张语义完整的中文单页：序章（中轴线）→ 太和殿 → 中和殿 → 保和殿 → 沿革时间轴 → 数字比较 → 引文/来源/页脚。
2. 三套独立、自绘、无版权负担的 SVG：每套具有对应建筑**屋顶类型**、开间数和专属图解；元素均标明“艺术性示意，非测绘复原”。共享汉白玉三层台基、中轴线、黄瓦朱柱语汇。
3. 原生固定导航与定位指示、三殿目录跳转、回到顶部、建筑档案原生详情折叠、可暂停装饰动效的控制开关。Esc 关闭弹出式“导览索引”（若打开）。
4. 至少五种有信息作用的视觉编排：开篇轴线收束、太和殿重檐分层、柱网透视、 中和殿正方对称/宝顶聚焦、保和殿殿试文字长卷、五时点沿革接力。非同一 fade-up 复制三遍。
5. 375/480/768/1024/1280/1440px 响应式、键盘与读屏、减弱动效、离线加载、真实 Chrome 与 Playwright 测试、截图和执行报告。

### 1.3 硬边界
**不做：** 后端、账号、服务端、表单、支付、多语言、真实照片资产、图库 CDNs、在线地图、视频/音频、360 漫游、可旋转 3D、复杂 WebGL、部署/CI、上传/分享、图片版权采购。此处“艺术表达”指非写实建筑版画，而非捏造历史构件。没有图库时绝不出现灰占位符。
**不能偷换：** 不把“保和殿殿试”画成所有朝代恒定；1789 年起成为固定场所；不把三殿外轮廓画成同一庑殿顶；“11/5、3/3、9/5”为间数而非测绘米数。三殿共用三层台基高 8.13 m，切勿给每殿叠加 8.13 m 后得假高度。

### 1.4 验收编号与判定
沿用简报 A1–A11，不改编号：
- **A1** 在全新克隆上执行 npm ci && npm run build，exit 0；dist/index.html 存在，file:// 双击及 127.0.0.1 静态服务器两种方式完整显示/操作。构建脚本必须产出**无 module/import 的单 HTML**，而不只支持 http 运行的 ES modules。
- **A2** 生产版 Chrome console.error/pageerror 均 0；非同源 HTTP(S)/WebSocket 请求 0；file:// 模式所有网络请求 0；图标、字体、SVG、JS、CSS 均本地/内嵌。
- **A3** 375、1440，以及附加的 320、480、768、1024px 都无水平溢出；全部交互控件实际 bounding box ≥44×44 CSS px；浏览器文字 200% 下无截断/遮挡。
- **A4** Tab/Shift+Tab、Enter/Space、Esc、浏览器后退/前进完成导航；focus-visible ≥2px，且不被裁切。
- **A5** reduced-motion 下任何文字与建筑不能因 opacity:0、transform、sticky 视差而隐藏；所有核心信息依然存在。
- **A6** WCAG 文本 ≥4.5、合法大字 ≥3、必要图标与边框 ≥3、禁用外观 ≥2 的程序化实测。
- **A7** 真正运行的 Chrome 活跃动画中采样连续 60 个 rAF 帧，frameId 各异、时间戳严格递增；另报 frame-delta 的 median / p95 / max 与逐帧视觉变更计数，不能只以 60 次循环冒充顺滑。
- **A8** LayoutShiftObserver 记录 CLS ≤0.1；本机生产版首屏交互完成 ≤2500ms（真实计时，冷/热启动数据分开）；轻量 UI 输入反馈 ≤100ms。
- **A9** npm test exit 0；用 Node 测试输出或 Playwright reporter 解析实际总数/通过数/失败数，不得事先写死。
- **A10** 三殿每一殿都可找到形制、数字、用途、匾额、完整对联、沿革；DOM 文本及视觉双重检查。
- **A11** 三段有不同构图/颜色重心/动效节奏，且统一按钮、目录、正文、卡片规格；对照截图及动效表判定。

### 1.5 依赖、兼容与实物承诺
本机事实：macOS 26.4.1 arm64、Node 26.0.0、npm 11.12.1、无 TTY、Chromium 缓存、Chrome 已装；不索取 API key。交付主要支持桌面 Chromium 最新版及 iOS Safari 现代版本，非支持环境保留可读的 HTML 正文。所有关键文本直接存在 HTML 中，不依赖 JS 异步获取。资源授权只采用开源字体 SIL OFL；不复制故宫官网或 Google Arts & Culture 的照片、布局截图及品牌标识。明确离线与双击保证靠内联分发格式解决，不寄希望于浏览器放宽本地模块 CORS。

## 2. 网上调研、最高水准参照与提炼

### 2.1 研究过的产品（4 个，不把“网页可访问”冒充已完成本机视觉审计）
| 标杆与类型／核验网址 | 官网可查证的具体做法 | 本作学习并落点 | 不照搬 |
|---|---|---|---|
| 故宫博物院 × Google Arts & Culture《The Unique Design of the Three Great Halls》；官方策展内容 https://artsandculture.google.com/story/the-unique-design-of-the-three-great-halls-the-palace-museum/1AWx0BllwxhDJg?hl=en | 明确三殿“序列中的差异、建筑层级、功能”；逐殿用构件/功能注释，有可探索图像 | 整站的叙事轴线与三种屋顶的准确区分；“总—分—回望”章节结构；每段图与文字必须互证 | 不复用其照片、音频播放器、图片热链，不将第三方视觉当授权素材 |
| 故宫博物院官方 Explore/Architecture； https://intl.dpm.org.cn/explore.html 与 https://intl.dpm.org.cn/explore/build_maps.html | 官方提供建筑地图与特定大殿入口，建筑名称具有真实位置层级 | 首屏中轴线刻度图 + 每殿明确南北方位，不能用随意三卡片顺序；文案在建筑语义上服从官方 | 不假装项目含 GIS 地图、原尺寸精确 CAD |
| 大都会艺术博物馆 The Met 360° Project； https://www.metmuseum.org/art/online-features/met-360-project | 官网说明以异于日常参观的视角呈现空间（俯视、空馆、时间流动），六段沉浸式内容 | 用三种镜头意图：太和殿仰视、中和殿居中俯视、保和殿斜轴展开；让“看法”承担叙事 | 不嵌入 360 视频，不加重首屏大文件/强制旋转 |
| Smithsonian 3D； https://3d.si.edu/ | 官网可核查有策展集合与可探索 3D 文物入口，探索与档案并存 | 视觉戏剧性之外保留可查证、可直接跳转的说明与数字；艺术图旁设“形制/礼制/营建”档案区 | 不为“3D”名义引入无来源的假精度网格与高 GPU 占用 |
| Rijksmuseum Rijksstudio，馆方新闻 https://www.rijksmuseum.nl/en/press/press-releases/rijksmuseum-en-dell-technologies-slaan-handen-ineen-om-volledige-collectie-digitaal-te-delen-met-de-wereld | 官网页面确认开放高分辨率藏品浏览、用户可放大细节（以《夜巡》为例） | 三殿各选一个“见微知著”的构件：螭吻/宝顶/云龙御路，使用本项目自绘的放大注释框 | 不移植馆藏图片；不要求手势缩放才能阅读信息 |

**学习结论（先有研究再定方案）：** 文化遗产高质量体验并非“满屏粒子/视差”，而是**被准确校核的内容、一个清晰空间脉络、受控的视角、局部放大与随时退出特效的能力**。本项目品质线：静态截图就可识别三种建筑，动效开启后进一步解释层级与礼仪，关闭动效不会损失一个数字或一条对联。以上网站的运行时动效内部实现、获奖排序未逐帧核验，故不声称它们 2026 年“排名第一”。

### 2.2 规范与技术实证
- **WCAG 2.2 正式规范** https://www.w3.org/TR/WCAG22/ ：正文 4.5:1、大字 3:1、非文本 3:1；本任务把全部按钮增至 44px（严格于其 AA 的 24px 最低面积规则）。落实到测试与焦点、可关闭层。
- **IBM Carbon Typography** https://www.carbondesignsystem.com/building-blocks/foundations/typography/overview ：将展示型大字与阅读型正文分成清晰字阶，两套比例统一，而非每段临时改字号。仅学习原则，不引入 Carbon 包。
- **Material Design 3 Motion** https://m3.material.io/styles/motion/easing-and-duration ：不同动效在时间与 easing 上分工，交互反馈短、叙事动作长；本项目的具体曲线在 3.1 节定死。
- **MDN CSS Scroll-driven Animations** https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations 及 https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-timeline ：滚动时间线可减少滚动监听主线程工作，但 2026-10-25 并非全浏览器 Baseline；因此**不把 animation-timeline 当关键内容依赖**。渐进增强只用可检测支持的装饰效果。
- **GSAP ScrollTrigger 官方文档** https://gsap.com/docs/v3/Plugins/ScrollTrigger/ ：scrub/pin 成熟；官方亦提醒不要直接变换 pinned 节点；本作只有三段、无复杂水平长卷，拒绝增加其包体与生命周期维护，采用浏览器原生 sticky + 单个 rAF 调度；若遇环境冲突仅降级静态，不临时引 GSAP。
- **Noto Serif SC 字体授权/仓库** https://github.com/google/fonts/blob/main/ofl/notoserifsc/METADATA.pb ；Noto Sans SC https://github.com/google/fonts/blob/main/ofl/notosanssc/METADATA.pb ：OFL 许可，可在构建准备阶段子集化后本地嵌入。**严禁生产版访问 fonts.googleapis.com / gstatic**。
- **Chrome 性能诊断** https://developer.chrome.com/docs/devtools/performance-insights 和 https://web.dev/articles/cls ：帧时差、CLS 应仪器检测；SVG/DOM 帧动画仅合成 transform、opacity；不持续重排或测量每帧布局。
- **原生 Node 测试** https://nodejs.org/api/test.html ：Node 26 内建 node:test 适用于内容、构建产物、安全与数据单测；真实浏览器用本机 Playwright。
**技术取舍结论：** 不使用 Three.js/WebGL、canvas 帧绘画、React 或动画框架。理由分别是无需真实 3D、Canvas 逐帧重绘不符合“变换/透明度”性能基线、无状态复杂度、原生 API 可覆盖预定 6 套效果。依赖最少、离线可检测、静态可退化，是本场景更可信的高级体验。

### 2.3 历史资料优先级及措辞
优先级：简报已经验过的事实底稿 → 故宫博物院原始网页 → 官方策展故事 → 其他说明。官方参考：https://intl.dpm.org.cn/hallsinfo/374.html （太和殿）；https://intl.dpm.org.cn/hallsinfo/367.html （中和殿）；https://artsandculture.google.com/story/the-unique-design-of-the-three-great-halls-the-palace-museum/1AWx0BllwxhDJg?hl=en （三殿结构）。仅以此作为执行方可选的事实复核入口，不把新网页当项目运行依赖。完整措辞以 brief 为准；来源链接作为正文脚注可见，但点击才联网（A2 的自动请求仍为 0）。

## 3. 设计语言：固定令牌与组件规格

### 3.1 设计令牌——唯一色板和字阶源
所有色彩/阴影/z-index/间距/动效/排版量在 **src/styles/tokens.css** 的 :root 声明；其他 CSS 只引用 var(--*)，禁止散落裸色值；SVG 的 fill/stroke 同样只用 currentColor 或 var(--*)； JS 仅改 class、data-*、transform、opacity，不直接赋颜色。

**颜色表（暗色主展厅 + 一段纸色档案；不是自动深浅反转）：**
| 令牌 | HEX | 使用约束 |
|---|---|---|
| --bg-page | #101716 | 全局深背景 |
| --bg-panel | #1B2826 | 数字牌/目录面板 |
| --bg-raised | #263633 | 弹层/悬浮 |
| --bg-ink | #0C1110 | 建筑舞台底 |
| --bg-paper | #F4ECD9 | 档案/时间轴纸张 |
| --text-primary | #F7F0DF | 深色正文/标题 |
| --text-secondary | #D9CFB8 | 深色次文本 |
| --text-muted | #C8BDA3 | 深色三级注释；不小于 14px |
| --text-on-paper | #222920 | 纸上主文本 |
| --text-paper-secondary | #514D42 | 纸上次文本 |
| --text-paper-muted | #6B5F4C | 纸上三级，实测对比约 5.3:1 |
| --accent-gold | #E8BD67 | 黄瓦亮线、强调字/按键轮廓；深面上约 7:1–10:1 |
| --accent-vermilion | #874A26 | **仅**纸面强调、朱柱在 SVG 作为装饰色；不得把此色直接作为深底小字 |
| --accent-jade | #A9D3B8 | 中和殿聚焦轮廓（深底） |
| --border-dark | #82938A | 深色控件/必要矢量线，最不利深 raised 面仍约 3.9:1 |
| --border-paper | #6B5F4C | 浅色必需边线（约 5.3:1） |
| --state-success | #A9E2BC | 深色状态文字与图标 |
| --state-warning | #FFE1A1 | 深色警示 |
| --state-danger | #FFB3B3 | 深色报错 |
| --state-info | #9ECDEB | 深色信息 |
| --state-success-paper | #256241 | 纸上成功 |
| --state-warning-paper | #805123 | 纸上警示 |
| --state-danger-paper | #924024 | 纸上报错 |
| --state-info-paper | #285B81 | 纸上信息 |
| --focus | #FFE1A1 | 深底焦点，纸底改用 --text-on-paper |
| --disabled-text | #82938A | 深底禁用提示；实际对比 > 3，禁用不只靠色 |
| --overlay-scrim | #101716 | 叠加背景时用 color-mix / rgba(16,23,22,.84) 仅在 tokens.css 定义 |

**禁止假造的色差：** 上述对比度为设计预估，正式值必须由程序以 sRGB 标准算法算出并记录所有前景/背景/半透明合成对；不合格则按优先级替换成 --text-primary 或 --text-on-paper，禁止放宽 A6。所有正文（包括引文）在确定的实底色容器显示；漂浮纹理不得压在字下。装饰性色并不自动满足功能性图标对比度，功能图标固定 --border-dark/--border-paper。

**字体：** 中文标题 Noto Serif SC（本地子集、400/600）；中文正文 Noto Sans SC（本地子集、400/600）；西文字数、章节编号用 Georgia 400/700 与 ui-monospace/SFMono-Regular/Menlo/Consolas/monospace（数字等宽）。完整声明：
- --font-display: "Noto Serif SC Local","Songti SC","STSong","Noto Serif CJK SC",serif
- --font-body: "Noto Sans SC Local","Noto Sans CJK SC","PingFang SC","Microsoft YaHei",sans-serif
- --font-num: ui-monospace,"SFMono-Regular",Menlo,Consolas,monospace
子集 woff2 用 font-display:swap；首屏两种字体关键字重均预加载/在 HTML 中内嵌；只在资源准备时联网。宋体标题字形清楚但正文不用极细仿宋。

**固定字阶：** 采用标称比例 1.25，读数字默认 tabular-nums，CJK 标点执行 font-feature-settings: "kern" 1, "palt" 1（浏览器不支持则保留默认，不通过插空格模拟）。
| token | desktop字号 / mobile字号 | line-height | weight | letter-spacing | 用途/最大行宽 |
|---|---|---|---|---|---|
| --type-caption | 12px /12px | 1.5 |600 | .12em | 顶部章号、带解释标签 |
| --type-label | 14px /14px | 1.45 |600 | .08em | 索引、元信息（文字仍需 4.5:1） |
| --type-body | 16px /16px | 1.7 |400 | .015em | 说明正文，max-width:40ch |
| --type-lead | 20px /18px | 1.6 |400 | .01em | 段首导语，max-width:30ch |
| --type-h4 | 25px /23px | 1.3 |600 | .01em | 子专题，max-width:20ch |
| --type-h3 | 31px /29px | 1.26 |600 | .01em | 导览段标题 |
| --type-h2 | 39px /36px | 1.2 |600 | .02em | 三殿名，max-width:12ch |
| --type-h1 | 61px /44px | 1.16 |600 | .04em | 首屏主题标题，最多两行 |
| --type-metric | 48px /36px | 1.15 |400 | -.02em | 数字数据，tabular-nums |
不要对 h1–h6 继承浏览器样式。宽屏正文章宽 max 38–40 个汉字；超宽屏舞台依旧中心对齐。

**栅格：** --space-1..9 = 4/8/12/16/24/32/48/64/96px。容器 max 1168px，最外 desktop padding 64px（≥1280）、48px（1024–1279）、32px（768–1023）、24px（481–767）、16px（≤480）。文字块与图块间隙 desktop 64/移动 32；同组标题到正文 16/24；卡片 24；标签到值 8；文章段落 24。禁止 13、17、27px 临时补丁破节奏。

**半径/线/阴影：** --radius-sm/md/lg/xl/pill = 4/8/12/16/999px；正文平面面板 8、浮层 16、按钮 8、编号标签 4、圆形状态 999。描边 1px 令牌，焦点描边 2px + 2px offset，不可被遮；SVG 建筑主轮廓 2px，内部纹理 1px，非模糊。阴影 0 none，1: 0 4px 12px rgba(0,0,0,.14)，2: 0 10px 24px rgba(...,.2)，3: 0 20px 48px rgba(...,.3)，4: 0 28px 64px rgba(...,.4)；rgba 实际值集中在 tokens.css。不可在同一区块混搭分隔线、重阴影、强底色三重边界。

**层级：** --z-base 0；--z-scene 1；--z-content 2；--z-nav 10；--z-scrim 20；--z-dialog 30；--z-feedback 40；--z-focus 50。所有组件用 var。
**动效令牌：**
- --dur-press 120ms；--dur-hover 180ms；--dur-ui 240ms；--dur-reveal 480ms；--dur-enter 800ms；--dur-hero 1600ms。
- --ease-out cubic-bezier(.16,1,.3,1)；--ease-inout cubic-bezier(.65,0,.35,1)；--ease-precision cubic-bezier(.22,.68,0,1.01)（仅装饰层，不用于真实位置动画）；--ease-linear linear。
- 鼠标 hover/press 仅 pointer:fine 与 hover:hover 下生效；rAF 视觉必须 transform/opacity；SVG 几何/遮罩本身静态，不逐帧改 d、stroke-dasharray、滤镜半径。
- reduced-motion 时 duration 0ms、animation:none、scroll-behavior:auto、所有 stage 图形与正文 opacity:1/transform:none、取消 sticky parallax 与循环粒子，仅允许 focus/active 等瞬时状态变更。
- 自定义“停止动态装饰”按钮永久在首屏导航可达，初始跟随系统，用户主动选择后用 sessionStorage 保存（存取异常则内存保持）；不覆盖 OS reduced-motion=true 的禁止运动。

**图标：** 单一自绘 24×24 SVG 线描系统：stroke-width=1.75、linecap=round、linejoin=round、fill=none，16/20/24 三档，容器至少 44px。图标名：arrow-down, arrow-up, menu, close, pause, play, book, compass, info；不可用 emoji、文本箭头当唯一标签。
**网格：** ≤480 1列、481–767 1列、768–1023 正文+图 5/7列、1024–1279 4/8列、≥1280 5/7列；图片舞台 aspect-ratio 16/10 桌面、4/3 平板、5/4 移动，svg viewBox 恒定保持 preserveAspectRatio="xMidYMid meet"，不裁掉檐口。

### 3.2 组件规格（C01–C12）
组件状态通用契约 **S**：default=正文字体/背景令牌；hover=仅精确指针增加 1px 可见边缘且 transform translateY(-2px)、180ms；pressed=translateY(0)/scale(.98)、120ms；focus=2px --focus +2px offset；disabled=aria-disabled="true" + --disabled-text + 禁止事件 + 屏幕可读“暂不可用”；loading=就地小型线框/进度文字“正在展开建筑图解…”（1s 以上显示百分比或阶段，10s 有取消，禁止无限旋转）；error=同位 --state-danger +“图解未能显示，正文仍可阅读。返回文字说明。”；empty=同位 --state-info +“此章节暂无线稿，请先阅读形制说明。”；success=完成后的短暂 aria-live="polite" 文字“已定位至××殿”。纯展示组件无动作时 hover/pressed/disabled **不适用**，必须在验收矩阵中标明“不适用：无交互”，不是伪装存在。除视觉节点外，四态状态仍有静态/故障注入可观测表示，不允许无文案红边框。

| 编号／组件 | 结构/尺寸/风格/焦点/行为 | 空/加载/错误/成功（对纯静态组件按 S 解释） |
|---|---|---|
| C01 跳转主内容 | 首 DOM 可聚焦 a href="#main"，聚焦时 44px 高、16px、8px 圆角、--bg-raised，z-focus；默认视觉隐藏但仍在 Tab 顺序 | 空/载/错：不适用，始终可见可操作；成功：焦点到 main，且不盖标题 |
| C02 顶部导航 | 高 72px 桌面/64px 移动，左“故宫·三大殿”16px，右 3 殿锚点、动效按钮与索引按钮，底边 1px；sticky top:0；激活态文字“正在阅览：太和殿”+aria-current="location" | 空：保留主页/三殿可用锚点；加载：只动导览图标而不阻断；错：显示“导览定位暂失效，请向下滚动”；成：目标定位并可读 announcement |
| C03 导览索引浮层 | <dialog> 左右内边距 32，宽 min(560px,calc(100vw - 32px))，暗底 raised/16px角/阴影3；标题 + 3 条 52px 锚点 + 关闭；Tab 受原生 dialog 约束；Esc/遮罩点击关闭，关闭后焦点回触发按钮 | 空：三个固定锚点仍存在；载：索引立即开，不等待 JS 远程资源；错：“导览索引未启动，可使用页内目录”，关闭；成：点击项先关闭再定位 |
| C04 剧院式序章 | min-height: min(820px,100svh)，上部大标题/引导语，下部三殿透视总轴 SVG；图占宽 65%、可见首屏 32% 主体；背景 --bg-page；首屏有“沿中轴线进入”主 CTA 52px 高 | 空：静态中轴线文字图；载：SVG 先在 HTML 可见，特效待初始化不遮挡；错：保留建筑图和正文；成：进入太和殿 |
| C05 章节导航标尺 | 页面侧边 1px 轴线、3章编号，桌面宽 52px；移动收为顶部 3段文字 chips，每项 44px；当前段 aria-current | 空：固定三段；载：不闪；错：仍有原生 href；成：标注读到哪一段 |
| C06 建筑 SVG 舞台 | figure + inline svg + figcaption；外容器最小 320×280/最大依 grid；SVG 根据真实屋顶**各有独立图**，背景 ink；语义图用 role="img" + <title><desc>，重复装饰 g aria-hidden="true" | 空：“线稿未生成；请读下方形制说明”；载：基础线稿先见，渐进组块透明度上升；错：图保留、文本替代；成：所有几何到位，figcaption 标“艺术示意” |
| C07 数据横列 | 3–4 个固定指标，每张 min-height 120/移动 100，背景 panel，8px角，padding24，数字 48px（移动36），标签14；无需 hover 点击 | 空：不伪造 0，用“未有可靠数值”替换；载：仅描边纸标不用骨架灰块；错：该格保留文本解释“数据未核实”；成：具体数字及单位一起出现 |
| C08 注释热点 | 仅用于非装饰构件；44px 按钮，24px线图标，触发会显示相邻有标题的说明区（不是 hover-only tooltip），aria-expanded/aria-controls；默认锚点图解位置并有旁侧文字备份 | 空：区域写“此处以形制说明为准”；载：直接用文字备份；错：保留文字，不关闭焦点；成：显示构件名/特征/出处，聚焦稳定 |
| C09 文化引文 | blockquote（非装饰文字）含完整匾额与对联，纸底/墨字，左 3px 令牌色线、padding24，长联按自然断行，max-width:40ch；只读无 hover | 空：隐藏不存在的卡片并显示“史料条目待核对”；载/错：直接回退简报静态文本；成：完整读完 |
| C10 时间轴 | ol 时间点 1420、1562、1645、1695–1697、1789，纸底，水平桌面5节点/移动竖向5节点；每节点 h4/p，移动不截断 | 空：显示“时间线可改读以下完整文字”；载：文字始终可见；错：显示线性 ol；成：读者在 1789 看见保和殿殿试用途转变 |
| C11 比较条 | 仅比较**面积**2377/580/1240 m²；3条最大条长100%，余者按面积线性，不伪称建筑立面同比例；纸底，固定坐标与数值；无可点击行为 | 空/错：“请阅读下方建筑面积文字比较”；载：数字先显示，条动画待启；成：3条与数字一致 |
| C12 反馈条/页脚 | aria-live polite（错误用 assertive），16px、最小44px；页脚显示“资料范围、艺术示意说明、资料链接、回到顶部” | 空：“三殿介绍已全部载入”；载：“绘制装饰细节中，正文可直接阅读”；错：明确故障类型与返文本路径；成：“已到达三殿导览终点” |

**样式状态补充：** 所有可操作组件 C01/02/03/05/08/12 必须实现 S 的 default/hover/pressed/focus/disabled；disabled 仅在无法执行时使用，不预先把核心锚点禁用。用户不应遇见错误仿真模式；测试可通过 URL 查询参数 ?sflip_state=empty|loading|error 激活组件四态视觉回归，此参数仅在测试脚本启动时允许（生产构建可保留只用于 QA，但不能影响正常页面）。成功态的 aria-live 更新后 1200ms 清空，避免读屏噪声。

## 4. 体验设计与叙事镜头

### 4.1 信息架构（单页、无隐藏正文）
- **顶部导航**：标题 / 殿序链接 / 动效开关 / 导览按钮。
- **序章 #intro**：“一道中轴，三重殿宇”；文字副题“从威仪，到中和，再到文脉。”；入口 CTA。
- **#taihe 太和殿 / 威仪**：正面低机位建筑剪影；形制与规格；龙纹/10只走兽/柱网细节；典礼；匾额与对联；沿革。
- **#zhonghe 中和殿 / 节制**：正方形屋面与金顶俯视图，3×3 对称开间；祭祀前阅祝版、阅农具；宝座与肩舆；匾额联句；沿革。
- **#baohe 保和殿 / 文脉**：歇山顶侧向建筑与“殿试答卷纸格”并置；减柱造的开阔空间；清代宴飨/1789后殿试；云龙石雕；匾额对联与沿革。
- **#time 时间**：五历史节点，三殿同名演变可并列解释。
- **#compare 对照**：建筑面积、屋顶、开间、用途、匾额与年代的文本表；“返回开始”。
- **#sources 来源/方法**：引用原文、建筑图为艺术性示意、非工程测绘，外链仅用户点击时打开；可读且不热链。

标题语义 H1 仅序章；H2 为三殿、时序、比较；每节 H3 “形制/礼仪/营建/匾联”；数字卡里的单词不是独立 H2。页内锚点浏览器历史可工作，初始载入带 hash 时能定位且不被 sticky nav 遮挡（scroll-margin-top:88px desktop/72px mobile）。

### 4.2 三殿视觉语法与可画的几何要求
**共用空间语法：** 全部线图以 viewBox="0 0 1200 720" 为原始舞台；平面底座采用 3 层叠置台基，米数只在文字标注，不按像素冒充准确尺寸；x 中心恒为600。黄瓦平面使用每 24px 一道薄线、朱柱每柱宽 14–20px、斗栱使用 12px 对称梯级形；与主题结构有关的标签始终在独立 DOM 层，不绘进模糊 canvas。所有景观 x 坐标必须落在 60..1140，四边留 ≥48 SVG px。

- **太和殿，正视仰角，序列“多—重—大”。** SVG 分组顺序：三重台基（底 y=630/595/560）、栏杆（y=544）、11开间柱网（x=180..1020，按10等间隔）、两重庑殿式“正脊/四坡”的主檐和副檐轮廓（檐沿大于柱网，每层左右相对抬升），顶部两端螭吻与檐脊走兽用 1+10 组可数图标以一侧展示；绝不能画成仅一层屋顶或五尖攒尖。以文字指明“脊兽为符号化图示，非精细拟兽雕塑”。首视画面建筑宽占 78%，高度占 66%。视觉突出“11开间、10只脊兽、72柱、2377m²”；全部做图文双重标注。
- **中和殿，俯视的正方形构图，“收—静—正”。** 单层四角攒尖顶四条斜脊汇于正中鎏金宝顶；方形台座图形在中心可见；3×3 开间标在俯视边上；四面门洞/四边廊关系在注释中示意。SVG 切勿使用圆顶或四层宝塔，建筑占舞台宽 50%、四周留大空白，外框正方。图旁的 3×3 九宫仅作分间示意，注明“不等于柱位实测”。
- **保和殿，侧前方斜视，“展开—流动—书写”。** 重檐歇山顶必须能看到山面三角轮廓（与太和殿庑殿顶区别），九开间、五进深只作文字/示意刻度；檐角每层9小兽的图示注明数量；前檐六根减去的内金柱以**虚线负形**表示（不要在外檐外侧少画六根承重柱）；云龙石雕以石阶上静态线绘区呈现。建筑宽占画面约 72%，旁边有 20% 面积的纸卷/答卷格式，绝不把殿试镜头画成明代始终常设。
**审查主图三问：** 去掉标签能否分出三种屋顶？三图一字排开能否分出体量/方形/山面？任何符号化图解是否有“非测绘”注记？任一否即返工该图。

### 4.3 时序表（图内子图层独立变换，不重复三段一套）
| 场景 / 触发 | 动画与关键位置 | 时长、曲线与阶段 | 退出 / reduced-motion |
|---|---|---|---|
| T0 首屏 load+首个可见帧 | 中轴线视觉由远到近：仅 3个已绘制 SVG g 组 scale(.92→1) 与 opacity(0→1)；H1 静态存在 | 1600ms --ease-out；标题先展示，图 160ms 后开始 | 首屏离开后取消 RAF；reduced 为静态完整鸟瞰 |
| T1 #taihe 进入视口 35% | 两道檐层从 y=+36 与 y=+18 相继归位，朱柱群前后视差≤12px；数字章号先于柱阵 | 800ms 进入 + 3段各140ms stagger，--ease-out；局部 scroll progress 区间[.12,.75] | 离开即固定最终态，不反复闪烁；reduced 全显 |
| T2 #taihe 的“脊兽”段到 50% | 11个计数符号在檐角按 70ms/个逐一由 opacity .2→1，重心不移动；10+骑凤仙人保持语义明确 | 11×70ms +200ms hold，--ease-inout | 一次动画，不重播；reduced 固定全部可数 |
| T3 #zhonghe 入视 40% | 四向屋脊 SVG g 从各自向中心 translate(±18px) 合拢，中心宝顶 scale(.8→1)，四角四向镜像 | 总 720ms --ease-inout，中心在第480ms 出现；节奏近乎停顿 | 图固定正方全显，不无限“呼吸”；reduced 静态 |
| T4 #baohe 入视 35% | 歇山屋顶两个坡面分别向外平移 18px 再归位；下方殿试纸格由 transform translateX(24px→0) 出现；注释随进度分层 | 960ms --ease-out，纸卷延后280ms，四段散布时序 | 上下滚可保持已触发终态；reduced 没有飞入的纸张 |
| T5 #time 时间轴到达 | 1420→1562→1645→1695–97→1789 五个文本点单向顺序显影；对应标注用 opacity，不移动文字布局 | 每点180ms，间隔120ms；--ease-out | 最后一处 1789 显示后结束；reduced 5点全显 |
| T6 #compare 到达 | 3条面积图的**内部填充元素** scaleX(0→比例)，transform-origin:left，不改 width；数字不滚动 | 620ms --ease-out，第二/三条各延后120ms | compare 离开停止；reduced 3条全长静态 |
| T7 菜单/CTA/导览按钮 | hover y:-2、按下 scale(.98)；浮层 opacity+translateY(8px→0) | 120/180/240ms；--ease-out | Esc、点关闭、选锚点退出；reduced 立即显示/关闭 |

**位置驱动算法：** 三章节高度 desktop 约 145vh–180vh，但**正文块永远在文档流中**；舞台容器 CSS position:sticky; top:88px; max-height:calc(100svh - 104px)，只粘住 SVG 而非整个正文；每章在 mobile ≤767 改 position:relative，避免滚动陷阱。IntersectionObserver 仅开始/停止章节状态；具体 progress=(viewportHeight - rect.top)/(viewportHeight + rect.height) clamp 0..1，scroll/resize 监听使用 passive:true，只写脏标志；唯一 rAF 调度可视章节的 transform 与 opacity。信息本体不设初始隐藏，动画图层有“base art”常显，低性能/禁动效只关 enhancements。每次失焦、页面 hidden、出视口、元素被移除，取消动画并保留可读最终态；resize/font load 后重新计算边界但不改变语义顺序。

### 4.4 两条用户旅程
**快速用户：** 打开看到“故宫外朝三大殿”和三个殿名 → 按“查看三大殿”或 Tab 选太和殿 → 文字对应建筑 → 按顶部“中和殿”→ 见正方与宝顶 → 选择“保和殿”→ 读殿试与减柱造 → 末尾一眼对比三条面积与屋顶 → 返回开篇。点击当下 ≤100ms 更新 aria-current 和状态文字；URL #hash 能分享当前章节；浏览器后退是正常 hash 历史，不使用 pushState 连续刷历史。
**深入用户：** 太和殿逐个看脊兽及宝座事实 → 展开“匾额与对联” → 用 Tab 逐段读无横滚联句 → 继续中和殿对照四角攒尖 → 保和殿对照歇山/减柱造 → 历年表看 1420/1562/1645 与重建节点 → 点击外链资料（新标签 rel="noopener noreferrer"）查源；点击链接前网站不主动请求。

### 4.5 四态与精确文案
**正常：** “沿中轴，读懂三座殿宇。” / “已定位至太和殿。”  
**加载（仅装饰启动或主动展开图解）：** “线稿已就位，正在启动光影层。文字导览可直接阅读。”；若 >1秒“正在绘制第 2/3 段，可继续阅读”，若 >10秒展示“停止装饰效果”按钮，实际取消动画。  
**错误（字体/动态初始化/个别 SVG 坏掉）：** “装饰效果未能启动，三殿文字与线稿仍可阅读。选择‘关闭动态效果’继续。”；SVG 缺失“保和殿图解不可用，下方有完整形制说明。”；无弹窗连环报错。  
**空（数据校验失败，例如比较项缺值）：** “建筑面积数据未完整载入。请先阅读三殿的形制与用途说明。”；不把缺失画成 0 条。  
**成功：** “已展开‘太和殿·匾联’。”、“已关闭动态效果”、“已到达三大殿导览终点”。  
所有状态不凭色彩传达，配统一 info/warning/success 图标及文字；成功状态 1.2s 清理。无破坏性操作、提交或拖拽；因此删除确认、表单验证、撤销/上传均不适用并在 QA 清单注明理由。

### 4.6 响应式定则
- ≤480：一列、16px 页面边距、顶部 64px，导航仅 logo/菜单/动效开关；“目录”在 dialog 提供全三殿；主标题 44px；SVG 5:4，舞台无 sticky，指标2列（第三项换行）/极窄≤340改1列；图解注释始终随图之后呈现；全部按钮≥44px。
- 481–767：24px边距，一列；顶部 64px；目录按钮，h1 44px；4:3舞台，所有指标2列。
- 768–1023：32px边距，正文5列/图7列；顶部72px；章节标题左对齐；舞台开始 sticky，章节正文右侧；指标3列。
- 1024–1279：48px边距，正文4/图8列；图景 16:10；目录为直接三锚点；时间轴为一横行 5点。
- ≥1280：64px边距 max1168，正文5/图7列；侧边垂直导航标尺 visible（与顶栏不重复可点击动作）；不随无限屏宽增大字形。横向表格永不产生水平滚动，比较区在窄屏改竖排。

## 5. 技术实现、接口与边界

### 5.1 固定工程选择：原生，最小依赖，单文件交付
- **运行时依赖：0。** 原生 HTML/SVG/CSS/ES2022 JS，正文服务器静态提供。
- **构建依赖：0。** scripts/build.mjs 使用 Node fs/path 将 src/styles/tokens.css、base.css、layout.css、motion.css 和 src/js/*.js 按固定顺序拼接到 index.html 的占位标记，嵌入 SVG 资产与 base64 woff2 字体，检查外链禁例，产出 dist/index.html；不用 Vite（普通 Vite 模块拆包会让 file:// 双击失败），不用 bundler。
- **测试开发依赖：仅 @playwright/test（生成 package-lock 的精确版本，不在规划中猜一个 2026 的最新版）；Node 内建 node:test 运行单元测试。** 浏览器缓存已存在，但 Playwright 包可用性以 npm ci 后的验证为准。
- **本机预览：** scripts/serve.mjs 只监听 127.0.0.1，精确提供 dist/index.html（及必要时报告截图目录的测试独立操作），默认 4173，GET/HEAD，所有其他文件返回404；不绑定 0.0.0.0，不暴露仓库。
- **运行时 0 外链资源：** 字体子集经构建期取官方开源源文件、转 WOFF2、提交到 src/assets/fonts/ 并在构建时 base64 内嵌；所有建筑 SVG 在 src/art/*.svg 打包内嵌（或模板中 inline）；图标由自绘 symbol 内联，JS/CSS inline。dist 除 index.html、LICENSES.txt 外无运行必需资源。开箱 file:// 与 http:// 都不发联网请求。Source 链接 href 指向官网，是用户主动点击才发出的跳转，不计入 A2 自动请求。
- **字体许可与来源：** 提交 src/assets/licenses/Noto-OFL.txt，记录字体仓库来源、下载日期及子集操作；未取得字体时使用 7.2 U6 方案，不能热链替代或假称已嵌入。

### 5.2 文件/模块签名（全是**将要创建**的路径，不宣称当前存在）
| 文件 | 入口 / 导出 / 唯一职责 |
|---|---|
| index.html | 原始语义页面，完整文章、figure/figcaption/blockquote/ol、CSS/JS 构建占位标记，不将三殿正文交给 JS 注入 |
| src/content/halls.json | 数组 3条，键 id/name/english/roof/baysWidth/baysDepth/areaSqm/heightM/totalHeightM|null/plaque/couplet/uses[]/history[]/details[]/source[] |
| src/art/taihe.svg / zhonghe.svg / baohe.svg / axis.svg | 静态文物艺术示意，viewBox 1200×720、按 architecture layer 命名，带 title/desc，不含第三方图 |
| src/styles/tokens.css | 唯一令牌真源，媒体查询同时处理 fontsize、配色；所有裸色只在此 |
| src/styles/base.css | reset、字体、容器、语义、focus、screen reader、reduced motion |
| src/styles/layout.css | C01–C12 栅格与响应式、场景 sticky、类型一致性 |
| src/styles/motion.css | 只动画 transform/opacity 的 class 与 keyframes；prefers-reduced-motion 明确 override |
| src/js/boot.js | initApp(doc= document): returns {destroy,ready}；错误隔离，初始化菜单、导航、段落、性能探针 |
| src/js/navigation.js | initNavigation({root, sections, announce}):()=>void；菜单 Esc、Hash/active-section、返回原焦点 |
| src/js/motion.js | initMotion({sections, reduced, onSample}):{destroy,refresh,pause,resume}；单一 rAF、调度可视场景 |
| src/js/data.js | validateHallData(halls):{ok:boolean, errors:string[]}；compareBarScale(area,max):number；formatMetric |
| src/js/status.js | setStatus(type, message):void，clearStatus():void；固定文案及 aria-live |
| scripts/build.mjs / serve.mjs / extract-glyphs.mjs | 单 HTML 构建 / 精简 localhost 服务 / 全站中英字表 |
| tests/data.test.mjs / build.test.mjs / geometry.test.mjs / contrast.test.mjs | Node 单测：内容、产物、屋顶轮廓/计数、色彩阈值 |
| tests/e2e.spec.mjs / playwright.config.mjs | Chrome file/http 访问、键盘、滚动、性能、截图、失败证据 |
| reports/latest.md / reports/evidence/* | Mac 执行证据、图片、完整 stdout、未知项表 |

**数据契约：** id 只允许 taihe/zhonghe/baohe；areaSqm = 2377/580/1240；baysWidth/baysDepth = [11,5]/[3,3]/[9,5]；roof 只允许 double-hip / single-pyramidal / double-hip-gable；heightM 按简报 26.92 /29 /29.50，taihe.totalHeightM=35.05、其余 totalHeightM=null（不可擅自给出含台基总高）；中和/保和不拿“29与29.5”再叠8.13编造官方总高。每殿 plaque/couplet 必须是简报原文全文。
**内容真源：** halls.json 有结构化数字用于测试/可视化，index.html 中文本必须与其构建期一致；scripts/build.mjs 用正则核对该 3组名称+屋顶+全部面积+匾额文字，失败即 exit1；构建不“远程抓正文”。可用 build 注入 hall data 的字串，但不将正文变成 JS-only 页面。

### 5.3 关键实现算法与陷阱
1. **单 HTML builder：** 按顺序读取模板、四 CSS、JS；替换唯一注入标志（出现次数不是1立即失败）；对 </script> 内容按构建时安全转义；禁止 <script src>、type="module"、<link rel="stylesheet" href=...>、@import/url(http)、src="https:..."、fetch()/XMLHttpRequest/WebSocket 等生产资源依赖。禁止把导航用户明确点击的 https href 当自动加载错误。写 dist.tmp 原子 rename 成 dist/index.html，构建重复结果字节一致（排除时间戳）。
2. **字体：** 构建期准备 Noto Serif SC 与 Noto Sans SC OFL 的必要字形子集，字符来源为最终 index 文本 + JSON 中文名 + 0–9、标点、常见英文，不在运行时远程加载；woff2 嵌入 @font-face。若子集超 300KiB/族，先缩至当前页面涉及字形而非舍弃字符；子集过程中保留许可文字；总 HTML ≤900KiB gzip 等效≤300KiB 优先（首次强制门槛 1.2MiB，超出就 U2 方案）。
3. **SVG 构件：** 在 src/art 中按 roof、eaves、columns、terrace、annotations、decor 分组，所有 SVG 保留 title/desc 可达性；建筑物角度为意象，不假扮测绘。SVG 在原地标注数量；太和兽数为“骑凤仙人 + 10只”、保和“上下檐角各9只”；保和减柱“内前檐6根”不能直接删除外柱。
4. **动画：** scroll 事件只是 dirty=true 和 ensureRAF()；rAF(ts) 中每帧最多测量当前可见两个 section 的 getBoundingClientRect，一次性完成写 transform/opacity；所有读先于写，限制2个可见场景、最多40个变换 SVG groups，背景粒子≤18并仅在 hero 激活；pagehide/visibilitychange/paused 取消调度。动画进度由数值 clamp 得到，避免跨帧离散 if/else 造成“幻灯片”。
5. **导航：** 原生 <a href="#..."> 做主跳转；JS 增强 aria-current；hashchange/IntersectionObserver 不抢焦点、不强制 scrollTop；点击后如需聚焦 h2，设置 tabindex="-1" 并 focus({preventScroll:true})；用户按 Esc 只关闭打开的 dialog。浏览器 Back/Forward 维持自然 URL history。
6. **弱性能/离线降级：** 不开 GPU 全屏 blur/filter，不使用 smooth-scroll polyfill。第一屏内始终有完整可读图/文本；JS 抛错捕获后 status 提示并将根节点标记 data-motion="off"；文件协议 mode 下仍能打开。Storage denied 用内存变量；字体加载失败保留字体堆栈并等待一帧重新测量 CLS；SVG 执行错误仅丢失增强层。
7. **安全与长文本：** 使用 textContent 更新状态与 aria，而非用户字符串 innerHTML；内容由本地白名单 JSON 定义；对联按自然中文断行，overflow-wrap:anywhere 只作为窄屏兜底；绝不 truncate。不存在>200列表；无数据库/并发提交。
8. **首屏性能：** 首屏 DOM/SVG静态优先，无阻塞网络；HTML 内联少量 CSS/JS，图片 width/height/aspect-ratio 固定、舞台保留尺寸；禁止大尺寸 box-shadow 的帧动画及每帧写 top/left/height/width；避免在首次 rAF 注入大批 DOM。对 devicePixelRatio 大的设备也不启用高DPI Canvas；没有 Canvas 帧循环。

### 5.4 预算与测试接口
构建后 dist/index.html hard limit 1.2MiB，目标≤900KiB；首屏静态可见≤500ms、可交互≤2500ms 本机 Chrome，CLS≤0.1；每次轻量交互 feedback≤100ms；阅读段 JS 执行单帧目标≤6ms、帧 median≤20ms、p95≤33.4ms（60Hz 实测环境，若设备刷新率不同同时记录刷新间隔）；所有外部请求0。测试开关 ?sflip_probe=1 暴露只读 window.__sflipProbe = {frames:[{frameId,timestamp,progress,sceneId}], statuses:[]}，最多300条，正常页不暴露或不增加采样开销；frameId 每个 rAF 执行时递增，timestamp 来自 rAF callback 而非 Date.now。测试脚本驱动滚动至少70次画面进度，读取连续60条并 assert 唯一/严格递增/median/p95，且60帧中至少30帧出现与上一帧不同的 transform/opacity（防空转虚报）。关闭动画时 probe.frames 长度不得增加。以浏览器录制的 frame delta 为性能证据，不把“独立帧 ID”当“不掉帧”充分条件。

## 6. 可执行工作包（按依赖顺序；每项七要素齐全）

**P01（依赖：无）工程骨架与固定字体策略**
- **前置：** Node/npm/Chrome 可调用；确认只写项目应用文件与 reports，不改手交接 spec/brief。
- **步骤：** 创建 package.json、package-lock.json、index.html 基础语义、scripts/build.mjs 与 serve.mjs；npm scripts 为 build/dev/test/test:e2e；唯一 @playwright/test 开发依赖。
- **位置：** package.json scripts；scripts/build.mjs:build；scripts/serve.mjs:createServer。
- **产物：** npm ci 可重现；dist/index.html 内联 CSS/JS 的最小页面；file:// 与 server 同显。
- **自查：** npm ci && npm run build && test -f dist/index.html；确认源码无 module script。
- **测试：** node --test tests/build.test.mjs：单 HTML、无远程资产及路径遍历拒绝。
- **完成：** A1 基础、A2 基础通过；设计规范 E 统一源、A1 排版重置。

**P02（依赖 P01）令牌、字体、无障碍 reset**
- **前置：** builder 已能替换 CSS 并输出。
- **步骤：** 建立 tokens.css 的完整 3.1 表；base.css 指定 font stack、h1..h6/reset/skip-link、focus-visible、reduced-motion；准备 Noto 两族 OFL 子集+许可证；在构建中本地内嵌字体。
- **位置：** src/styles/tokens.css :root；base.css @font-face/:focus-visible；scripts/extract-glyphs.mjs。
- **产物：** 令牌、字体资源、许可、无默认样式页面。
- **自查：** 检查 12px–61px 字阶/4px 间距；断网 file:// 可见中文且 document.fonts.check 返回结果。
- **测试：** contrast.test.mjs 使用 sRGB 算法遍历配色，assert 各类别阈值；检查无 src/css JS 裸 hex。
- **完成：** A6 与 quality A1–A4、C/E 排版/色彩/令牌基线通过。

**P03（依赖 P01,P02）完整内容与数据契约**
- **前置：** 清楚脚手架与主布局约束；简报原文已保留。
- **步骤：** 填 halls.json 固定三条全部 5 类资料；写 index.html 七章段落、图像的 title/desc、完整三殿联语、来源与示意免责声明；写数据校验和比较函数。
- **位置：** src/content/halls.json；index.html #taihe/#zhonghe/#baohe；src/js/data.js validateHallData/compareBarScale。
- **产物：** 无JS仍完整阅读的 3 殿正文；无占位文字。
- **自查：** 查看 DOM 中每殿名+屋顶+匾额+联句+沿革是否均出现；全文不以图片文字代替。
- **测试：** data.test.mjs 断言面积、开间、用途、年代、匾额、联句不空，历史数字不被误加 8.13。
- **完成：** A10；quality A1 A5 B3 B4 C1/内容可读。

**P04（依赖 P03）轴线与太和殿结构 SVG**
- **前置：** 令牌已有金/朱/石三材料语汇。
- **步骤：** 在 SVG 1200×720 分层自绘 axis、taihe：三层台基、11开间、两层庑殿檐、斗栱、栏杆、72柱注释、骑凤仙人+10脊兽计数；注入 figure 和 figcaption；按 4.2 坐标检查对称和材质层次。
- **位置：** src/art/axis.svg、src/art/taihe.svg；index.html #intro/#taihe。
- **产物：** 首屏非灰色建筑总轴图与太和专图。
- **自查：** 1440/375 图不截檐口；肉眼分辨双檐；兽计数准确；文字声明非测绘。
- **测试：** geometry.test.mjs 校验 11 bays、11 beast markers 与 SVG title/desc，Playwright 截首屏/太和。
- **完成：** A11 的“威仪”；quality A5媒体、A3、D静态结构。

**P05（依赖 P04）中和殿与保和殿独立图**
- **前置：** 已建立 SVG 建筑图层命名规范。
- **步骤：** 中和独立攒尖四斜脊合宝顶/3×3、方形留白；保和独立歇山重檐/侧面山墙/9×5/内前檐六根减柱虚线图/云龙石阶。全部配文本备份与图注。
- **位置：** src/art/zhonghe.svg、baohe.svg；index.html #zhonghe/#baohe。
- **产物：** 三图并置依轮廓就可辨认。
- **自查：** “去标签盲辨”三图；中和单层尖顶、保和歇山、太和庑殿无混淆。
- **测试：** geometry.test.mjs：屋顶类型标识、3×3/9×5 数据、aria 图文本；移动截图逐张核。
- **完成：** A11；quality A5插画、E一致性。

**P06（依赖 P03–P05）内容网格、指标、匾联与比较**
- **前置：** 三套图与正文完成。
- **步骤：** layout.css 落地 C04/C06/C07/C09/C10/C11；桌面单双列与移动单列，轴线、可比较面积长条按 actual/max，时间轴5项；纸底对联不断字不截断。
- **位置：** src/styles/layout.css .scene/.metric/.quote/.timeline/.comparison；index.html #time/#compare。
- **产物：** 读写并置的完整静态长卷。
- **自查：** 同类 metric 数字/单位一致、纸底有边距、0 横向滚、长对联完整。
- **测试：** 浏览器断点截图，compareBarScale(2377)=1、(580)=580/2377、(1240)=1240/2377。
- **完成：** A3、A10；quality A1–A4、B5、E。

**P07（依赖 P06）导航与焦点/弹层/状态**
- **前置：** 段落锚点、布局已稳定。
- **步骤：** C01/02/03/05/08/12；实现原生 anchor、dialog.showModal/close、Esc/焦点归还、aria-current、图例热点展开、状态 announce；不通过动效才能点击。
- **位置：** src/js/navigation.js initNavigation；src/js/status.js setStatus；index.html header/dialog。
- **产物：** 纯键盘可走的完整主/次流程。
- **自查：** 不碰鼠标 Tab 开索引→进中和→展开匾联→Esc 关闭→回顶部；URL hash/浏览器后退生效。
- **测试：** Playwright keyboard/accessibility/44px bounding box/active hash。
- **完成：** A4；quality B1–B4、C全部。

**P08（依赖 P04–P07）六套动画时间轴**
- **前置：** 纯静态页可交；不得先隐藏正文再解锁。
- **步骤：** motion.js 一个 requestAnimationFrame scheduler；IntersectionObserver 阶段入场；基于 transform/opacity 实现 T0–T7；保留静态 base layer；离开和页面隐藏时取消；提供控制按钮状态。
- **位置：** src/js/motion.js initMotion/refresh/pause/resume；src/styles/motion.css。
- **产物：** 3种节奏不同的可暂停、有退出的滚动叙事。
- **自查：** 慢滚/快滚/逆滚/停滚：无闪断、不倒播成章、无滚动锁、文本恒显。
- **测试：** tests/e2e.spec.mjs：70次滚动与连续60帧 rAF/视觉变化/帧时差；reduced-motion 快照。
- **完成：** A5、A7、A11；quality B2、C减动效、D动画。

**P09（依赖 P07,P08）四态与异常边界**
- **前置：** 事件生命周期与状态语义已建。
- **步骤：** boot.js try/catch 装饰层初始化；data.js 数据校验失败时展示可阅读的错误与空态；测试注入 sflip_state 三态；storage 抛错 fallback；字体/失焦/resize/JS失败恢复；不遮盖 DOM 正文。
- **位置：** src/js/boot.js initApp；status.js；motion.js destroy；src/styles/base.css [data-state]。
- **产物：** 全局空/载/错/成4态、可跳过特效、无白屏。
- **自查：** 加 ?sflip_state=empty|loading|error 与脚本故障模拟能看到具体中文、可退出并阅读全部内容。
- **测试：** Playwright 4态截图、reduced-motion、文件协议、storage-denied、Script-error injection。
- **完成：** A2/A5；quality B1 B2 B4 C/E。

**P10（依赖 P06–P09）全断点与200%文字**
- **前置：** 所有主要组件/图片已存在。
- **步骤：** 按4.6逐断点调整 grid、菜单、sticky、指标；固定图宽高/比例；使 focus 不裁切，中文长联完整断行；scroll-margin。
- **位置：** src/styles/layout.css @media；base.css focus/text；index.html 图标按钮标签。
- **产物：** 320–1440 正常版、200%字号版、reduced-motion 版。
- **自查：** 320/375/480/768/1024/1440 逐页观察，滚动宽度<=clientWidth，焦点与 CTA 不受导航覆盖。
- **测试：** Playwright viewport / font-size 200% / bounding box >=44px / axe 手检映射（不新增依赖）。
- **完成：** A3 A4 A5；quality A1 A3 B5 C。

**P11（依赖 P10）浏览器验收、性能与内容核查**
- **前置：** 构建已稳定。
- **步骤：** npm ci/build/test/test:e2e，预览模式与 file:// 两路；PerformanceObserver CLS + performance 时间采样；rAF60帧；网络请求分类；颜色采样脚本；现场评估三殿差异，记录回归问题，修缺再复测。
- **位置：** tests/*.test.mjs、tests/e2e.spec.mjs、reports/evidence/*。
- **产物：** 完整 stdout、机器读的 JSON、截图与失败处置表。
- **自查：** A1–A11 每个有对应证据文件/数值/截图。
- **测试：** npm test 0；Playwright reporter 真实统计；重复 build 后 HTML SHA/大小稳定。
- **完成：** 无 gating 项 FAIL；quality F/G逐条证据可查。

**P12（依赖 P11）报告和收口**
- **前置：** 所有复测结果已发生而非仅计划。
- **步骤：** reports/latest.md 写 commit/base环境、指纹、测试 stdout 解析值、A1–A11 证据、quality A–G逐条结果、未知调查分支、视觉对比、限制、不做项；截图以 375/1440 默认+reduced+4态命名；源文件无TODO、死代码、远程资产。
- **位置：** reports/latest.md，reports/evidence/*。
- **产物：** 可审计的一次性交付，不依赖聊天文本。
- **自查：** 逐条追踪 A1–A11 与质量线；Git status 无未提交产物；只提源码/素材/报告，不改交接脚手架。
- **测试：** 所有验收回归重新执行，报告 sha 与被测 commit 匹配。
- **完成：** 结论只能是 DELIVERABLE / NOT_DELIVERABLE，后者必须记录证据和阻断项；不得虚报测试。

## 7. 未知信息清单、入口、判据与保守分支

### 7.0 分类总表
| 编号 | 类别 | 决策项 |
|---|---|---|
| U1 | 有入口 | Chromium/本机原生 CSS scroll timeline 与动画能力 |
| U2 | 有入口 | Noto 子集工具是否可用及产物尺寸 |
| U3 | 有入口 | file:// 下单 HTML 内联图文字体是否完全可用 |
| U4 | 有入口 | 本机真实性能：帧时差、CLS、加载时间 |
| U5 | 有入口 | 官方屋顶形制/用途与 brief 是否冲突 |
| U6 | 无公开入口（需本机资源/环境） | 字体资源下载因网络中断/安装权限失败如何落地 |
| U7 | 无用户真机入口 | 真实低端移动端 GPU 与 Safari 行为 |
| U8 | 无客观精细测绘入口 | 线稿能否达到历史工程级复原精度 |

### 7.1 有入口：逐条限定查询时间
**U1 支持面**
- **问题：** 是否可把 CSS animation-timeline 装饰增强加入目标浏览器。
- **查哪里：** https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-timeline ；本机 Playwright page.evaluate(() => CSS.supports('animation-timeline: scroll()'))。
- **判断：** Chrome 实测返回 true 且装饰层表现可见，判支持；false 判不支持。
- **分支：** true 可选装饰 T0 辅助但主要仍单 rAF；false 完全禁用该 CSS，保留 JS + 静态回退。
- **上限：** 10分钟；超时默认 JS 与静态基底，不导入 polyfill。

**U2 字体可用**
- **问题：** FontTools 能否压出两个可内嵌 woff2 且不漏字。
- **查哪里：** python3 -m fontTools.subset --help；https://github.com/google/fonts/blob/main/ofl/notoserifsc/METADATA.pb 与 https://github.com/google/fonts/blob/main/ofl/notosanssc/METADATA.pb ，测试 document.fonts.check('16px "Noto Sans SC Local"',"太和殿")。
- **判断：** 两个 woff2 文件被内嵌、校验汉字均有字形、各≤300KiB、许可随仓，则“合格”。
- **分支：** 合格嵌入；字体 size 超标，按 extract-glyphs 列仅保留本站字符重新子集；工具未装则按 U6 保守路径。
- **上限：** 25分钟；超过直接 U6，报告说明字体降级，不得热链。

**U3 文件协议**
- **问题：** 双击是否与本地 server 等效。
- **查哪里：** 运行 npm run build，执行 open dist/index.html；Playwright 用 pathToFileURL(process.cwd() + '/dist/index.html') 打开页面。
- **判断：** file:// 下 3节内容、全部 SVG 和按钮存在，console/pageerror 0，网络请求0（不记录浏览器扩展流量）。
- **分支：** 合格交付；若因外链模块/字体 CORS 失败，则内联 CSS/JS 和 woff2 到 index.html，并删除任何外部子资源；仍失败禁止宣称 A1 PASS。
- **上限：** 15分钟，失败即阻断 A1/A2。

**U4 性能**
- **问题：** 60活帧实际是否流畅、CLS/可交互是否达标。
- **查哪里：** Chrome Performance DevTools https://developer.chrome.com/docs/devtools/performance-insights 以及 tests/e2e.spec.mjs。
- **判断：** 60 unique/timestamp递增、≥30 distinct transforms、median≤20ms/p95≤33.4ms（60Hz）、CLS≤.1、交互≤2500ms。
- **分支：** 达标保留；不达标先关18粒子/减少可动 g 到≤16、删除高成本阴影，再关闭 scroll-progress 平滑仅保留单次入场；若核心数据仍不达标则不能交付。
- **上限：** 30分钟/轮，最多2轮；超限登记阻断项而不是虚报。

**U5 事实复核**
- **问题：** 官方对保和殿殿试开始年代、各殿屋顶名称与 brief 是否有冲突。
- **查哪里：** https://intl.dpm.org.cn/hallsinfo/374.html、https://intl.dpm.org.cn/hallsinfo/367.html、https://artsandculture.google.com/story/the-unique-design-of-the-three-great-halls-the-palace-museum/1AWx0BllwxhDJg?hl=en；简报中的确定事实。
- **判断：** 页面能直读原始文字、确有对应描述为有效资料；页面打不开不等于原文错误。
- **分支：** 同意 brief→原文照用；存在实质冲突→优先官方、在报告列“旧文/新文/URL/日期”，更改仅有冲突的一句；无法获取→完全按已核简报，标“未二次核对”，不得改写数字。
- **上限：** 12分钟，超时按简报默认。

### 7.2 无公开调查入口：具体问题、受影响决策、默认值
**U6 字体准备环境失效**
- **待查：** Mac 是否允许下载官方 OFL TTF，python3/pip/woff2 转换工具是否可运行及无TTY权限。
- **怎么查：** 本机 curl --fail --location 官方 git 源到临时目录（禁止保存未授权文件到网站），python3 -m fontTools.subset --help 与试子集；查看错误代码；不要求用户反馈。
- **决策分支：** 若可用，则采用两族子集内联；若下载/许可/工具失败，则整站字体转为固定声明 --font-display Songti SC/STSong/Noto Serif CJK SC/serif 与 --font-body Noto Sans CJK SC/PingFang SC/Microsoft YaHei/sans-serif，并禁用“已内嵌开源字体”的虚假文案；重新测 CLS 与版式。不得依赖运行时 CDN。
- **默认：** 本机已安装的 Songti SC + Noto Sans CJK SC 字体栈；报告标“U6默认降级”，仅在 A1–A11仍满足时可交。

**U7 真机低性能**
- **待查：** 无真机时，iOS Safari 实际抗锯齿、GPU 图层占用以及主屏小字是否稳定。
- **怎么查：** 无实机入口；本机 Playwright 375px emulate mobile/reduced-motion/CPU 4x slowdown + macOS Chrome 性能/截图，记录替代证据，并明确写 NOT TESTED: actual iOS device。
- **决策分支：** 模拟 p95≤33.4 则保持≤40 groups；模拟超标则删粒子并禁用滚动跟随动画仅入场；Safari 未实测则保证 HTML 静态可见（CSS @supports 降级）。
- **默认：** 保守禁用移动端（≤767px）连续 parallax，仅一次 480ms 的 opacity/transform 入场；未做真机测试不是交付失败但必须标剩余风险，不假称真机通过。

**U8 精确历史建筑测绘**
- **待查：** 手头无授权 CAD、构件尺寸/角度完整测绘数据，无法声称檐口/斗栱尺寸真实 1:1。
- **怎么查：** 看官方建筑页面和已核简报给出的可证屋顶类型、间数与面积；运行3图并排人工对照基本轮廓；无量测入口则不推断。
- **决策分支：** 若有合法且可核资料仅校正 SVG 形制但仍写“艺术性示意”；若无则按 4.2 固定比例与标注制作、严禁写“真实比例/精准复原”。
- **默认：** 所有 SVG 显式标“依据公开建筑信息绘制的艺术示意（非测绘比例）”；精确造型无法核验列为已知限制，不以虚假毫米级参数填补。

**7.3 自检：** 八条未知均有决策项、可执行探查/本机兜底；U6–U8 的默认值必须逐条写入报告。任何未知不得变成追问用户、重新找网页版规划者或等待新一轮研究。

## 8. 验收程序、自动化回归与视觉清单

### 8.1 本机命令与预期（在仓库根目录，无交互 CLI）
1. npm ci  → exit0；Node 26/npm 11 环境记录。
2. npm run build  → exit0；生成单页 dist/index.html，生成大小/sha，运行时绝无外链自动请求。
3. npm test  → exit0；node --test 输出单元总数/通过/失败，随后 Playwright 无头 Chrome e2e（或 npm test 内串行执行，确保唯一最终退出码）。
4. npm run dev  → 127.0.0.1:4173；浏览器访问 http://127.0.0.1:4173/（禁止把此请求算外站请求）。
5. node --test tests/data.test.mjs tests/build.test.mjs tests/geometry.test.mjs tests/contrast.test.mjs → 全部 PASS。
6. npx playwright test --reporter=line → exit0；使用实际已经安装的开发依赖，不使 npx 走临时版本漂移。
7. open dist/index.html → 本机默认浏览器 file://；Playwright 另用 file:/// 的绝对路径验证全部资源内联。

**统计唯一真源：** npm test 控制台 stdout 保存到 reports/evidence/npm-test.log（stdout+stderr 和退出码）；Playwright 配 reporter=json 到 reports/evidence/playwright.json，Node runner 用 TAP pass/fail 行或最终 summary 自动解析到 reports/evidence/test-summary.json，字段 {total, passed, failed, skipped, durationMs, command, exitCode}。数目必须从产生日志的命令解析，不能报告直接填 42/42 一类预估。浏览器控制台/error 通过 Playwright page.on('console')/page.on('pageerror') 收集；network 分类判 request URL origin，file:// 任何 http/https/ws/wss 都是违规。源页自主点击官方资料链接在 A2 测试期间不执行。

### 8.2 流程逐一实跑
- 冷启动 1440×900：看到“H1+三个殿名+建筑轴线+入口 CTA”，切至每一殿查看形制/用途/匾联/细节，终点比较可见，浏览器 Back/Forward 定位正确；全流程不使用静态截图代替真实操作。
- 键盘-only：Tab 找跳转主内容，Enter 入正文；Tab 到菜单、Space 开、Tab 到 3殿、Enter 选、Esc 关闭；返回触发按钮；焦点环始终可见。无法用 Esc 关闭弹层即 FAIL。
- reduced motion：Playwright newContext({reducedMotion:'reduce'})；三殿全文、SVG与图标均可见，document 动效 class/状态均 off，采样帧不连续产生。
- 375×812：按钮至少44、版面不水平溢出；200% 文字用浏览器 font-size 覆盖/zoom 两种法测（不只 CSS viewport zoom），无文字被 mask/clip。
- 原生阅读：禁用 JS 启动/人工模拟 JS runtime error，三殿全部事实能按文档顺序阅读；没有空屏。
- 四态：默认、?sflip_state=empty/loading/error 三个可切换截图；空/错状态有具体指引，不禁止主阅读。
- 低性能：滚至每章慢速通过记录完整 sample；与三份静态减动效截图对照是否仍可识别屋顶差异。

### 8.3 颜色、性能、视觉审美硬检
**计算色彩：** tests/contrast.test.mjs 按 sRGB 每通道线性化（≤0.04045 时/12.92，否则 ((c+0.055)/1.055)^2.4），亮度0.2126R+0.7152G+0.0722B，CR=(Lmax+.05)/(Lmin+.05)。覆盖深正文/暗三级/金/深控件线/纸面三级/纸面所有语义色/禁用≥2；功能图标不能借装饰色规避规则。混合半透明背景后再测最低值。
**CLS：** 页面初始化时 PerformanceObserver({type:'layout-shift',buffered:true}) 仅累计 !hadRecentInput entries，在静止 load 与真实滚动期间记录，并说明它是本机运行计量值而非真实用户 Core Web Vitals p75。
**性能：** 记录 performance.getEntriesByType('navigation') 的 domInteractive、首屏可操作按钮的实测第一帧与交互事件反馈时间；响应窗口≤100ms。单组 60帧样本以 requestAnimationFrame callback 的真实 browser timestamp 为准；报 unique IDs、delta median/p95/max、不同 transform 帧数、Chrome 型号/Hz、是否 CPU throttling。
**视觉检查（报告必须逐条勾选并附图）：**
- V1 1440首屏：“故宫·三大殿”独立视觉标题，不是默认浏览器样式；
- V2 太和双檐庑殿、大体量、檐脊兽/11开间与金朱玉三色；
- V3 中和四角攒尖/中央宝顶/方形留白；
- V4 保和歇山顶/山面/殿试长卷/减柱造**内柱**负形；
- V5 把三图并排即认出不同屋顶，不靠数字标签才辨别；
- V6 匾额/对联可完整阅读，≥4.5对比、标点合理；
- V7 375/480/768/1024/1440各宽度 no overflow；
- V8 default/hover/press/focus/disabled/empty/loading/error/success 按组件适用性核；
- V9 键盘/ARIA/关闭弹层/回焦点/高倍字；
- V10 reduced-motion 关闭仅装饰，不丢信息；
- V11 hover/焦点边缘尺寸一致，视觉节奏与 4px 令牌一致；
- V12 不存在灰占位、emoji、混乱投影、无意义的大面积粒子遮字。

### 8.4 最终判定
**DELIVERABLE 当且仅当：** A1–A11 全 PASS + design-quality-bar.md A/B/C/D/E/F/G 每项 PASS 或有明示、客观合理的 N/A（纯静态组件无禁用态等）+ 视觉 V1–V12 全 PASS + 来源与不精确性有明确标注 + repo 报告有准确 commit/测试数据。**NOT_DELIVERABLE：** 任一 console error、外链自动请求、正文缺一殿5类事实、屋顶类型误画、reduced 动效隐藏信息、移动水平溢出、键盘不通、帧测试 FAIL、CLS>0.1、造假测试，均立即不交付。未知真机访问能力仅列限制，不能装作已测。

## 9. 首次交付产物、证据与状态记录

**必须提交的目录与文件：** package.json/package-lock.json、index.html、src/content/halls.json、src/art/{axis,taihe,zhonghe,baohe}.svg、src/styles/{tokens,base,layout,motion}.css、src/js/{boot,data,navigation,motion,status}.js、src/assets/fonts/ 两族子集（若 U6 分支失败则写显式字体降级且不留空二进制占位）、src/assets/licenses/Noto-OFL.txt（在分发字体时）、scripts/{build,serve,extract-glyphs}.mjs、tests/{data,build,geometry,contrast}.test.mjs、tests/e2e.spec.mjs、playwright.config.mjs、README.md、reports/latest.md、reports/evidence 的证据。dist/index.html 应存在构建产物中，若仓库的 .gitignore 既有策略排除 dist，则报告明确写其生成方式，不擅自修改 .gitignore；测试不能假定 dist 已被 Git 跟踪。**严禁修改 handoff/spec、handoff/briefs、handoff/gate.json、.github/**。

**报告 reports/latest.md 强制小节：** 
1. SFLIP-001 交接指纹（task/round/nonce/brief_sha）与被测源码 commit、macOS/Node/npm/Chrome/viewport/刷新率；
2. 方案执行映射 P01–P12，修改文件清单（附实际路径），与任何偏离规划条款；
3. A1–A11 每项 PASS/FAIL/NOT TESTED 的命令、退出码、数据值与证据文件；
4. 浏览器 console/pageerror/network 请求清单；file:// 复测；
5. 完整 npm test stdout 与 json summary（总数/通过/失败由日志解析），Chromium 测试计数；
6. CLS、首屏交互、60帧 timestamp/ID/median/p95/max/视觉变更次数的 JSON 路径；
7. 颜色样本 CR 表、44px 最小点击框、200% 字体和键盘 focus 顺序；
8. 375/1440 默认图、三殿对照图、reduced-motion 与四态图；
9. design-quality-bar.md A–G 按每个小项逐条 PASS/N/A/FAIL + 可检验证据；
10. U1–U8 调查结论，写明是实测还是 U6–U8 默认；所有 NOT TESTED、不做项、版权与历史复原限制；
11. 交付判定 DELIVERABLE/NOT_DELIVERABLE 和残留阻断项。

**证据文件命名**：reports/evidence/npm-ci.log、build.log、npm-test.log、test-summary.json、playwright.json、browser-errors.json、network.json、contrast.json、perf-60frames.json、cls.json、a11-three-roofs-1440.png、hero-1440.png、mobile-375.png、text-200percent.png、reduced-motion.png、state-empty.png、state-loading.png、state-error.png、state-success.png、keyboard-focus.png。无证据则按 NOT TESTED，不用文字“已覆盖”替代截图或日志。

**首次提交界限：** 是交付可运行的静态 HTML 包、脚本、测试与本机证据；不是要求用户提供外链 API、图像授权或再开一轮评审。README 必须包含 macOS 快速启动、文件协议方案、内容来源、构件图的非测绘说明、减少动效操作与技术限制。

## 10. 执行 Agent 遇困处置规则

1. 本规划覆盖不到的新情况：**本机独立排查并解决**。选择顺序是“史实正确 + 内容可读” > “键盘/移动/减弱动效” > “性能/离线” > “装饰性动效”；每次偏离明确参照 3.1 令牌与 8.4 验收，不靠主观试错。
2. 若某 CLI/API 无法使用（例如子集字体工具、本机 Playwright 缓存路径、某 CSS 特性），**以能够实际构建和浏览为准**，按 U1–U8 分支降级，报告逐项记录“偏离章节/原因/替代实现/本机证据”。不造新设计系统，也不引一堆未知第三方包解决一处效果。
3. 若动画使性能、可访问性或内容受损，先砍粒子，再砍滚动视差，最后使用**全静态高质量 SVG**；不得为了 A7 造假空帧。若 A7 必须完成而降级后无法采集 60 有效运动帧，则判 NOT_DELIVERABLE 并报告真实限制，不能二选一虚报。
4. 任何情况下不得回头问用户或网页版 GPT；本轮无后续交互。不要等待 CI/部署/用户素材。最后将真实代码、测试、报告提交到本机目标分支（遵循本机现有工作树策略，不自行修改 handoff 脚手架），并在 reports/latest.md 写明最终状态。
5. 不能获取图片/精细测绘数据时，坚定执行已定路线 A；不使用灰色占位块、不偷用受版权保护照片、不打“精准复原”广告。不要因为一处未知影响全页正文。
6. **质量红线优先：** A1–A11 任一未过则不能宣称 DELIVERABLE；只做真实执行已覆盖范围的判断，没有跑过的步骤记录 NOT TESTED。

**规划交接完成状态： READY_FOR_IMPLEMENTATION；此状态只代表规划完整，不代表应用已经实现或验证。**

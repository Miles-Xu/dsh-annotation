# dsh-annotation-strict — 本地 fork 维护记录

这份文件是给未来更新用的。上游发新版时，**不要**直接把新 `client.js` 覆盖进来；按下面的流程把补丁重新应用一遍，再改版本号。

## 身份

| 项 | 值 |
|---|---|
| 本包 | `dsh-annotation-strict`，版本 `1.4.14-strict.1`，`private: true`（只做本地安装，不发布） |
| 上游包 | `@changfenhuang/dsh-annotation@1.4.11`（npm，2026-10-01） |
| 上游仓库 | <https://github.com/omdsh-dev/dsh-annotation>（MIT） |
| 上游 client.js sha256 | `53c2d23ea1346845b2b2e6b7db8100f8a82879e43de75482009f9754e74a9039` |
| 本 fork client.js sha256 | `f287611179cffb574a0252152b5ebfe5df8b0a02c606fcb724b1e20710426e43` |
| 逐行补丁 | [`client-strict.patch`](./client-strict.patch)（相对上游 `client.js`） |

**为什么要改名**：两个插件都用 `@changfenhuang/dsh-annotation` 这个 id 时，DSH 只允许装一个；改名后可以和 npm 原版并存，也方便随时切回原版对比。改名的连带要求是 `client.js` 的 ModuleLoader `id`、`exports.name`、`cordis.patch.yml` 的 `name` 必须一起改，否则会报 `bundle loaded without registering`。

## 相对上游改了什么

| 文件 | 改动 | 目的 |
|---|---|---|
| `package.json` | 改名、`private: true`、`forkOf` 字段、版本 `1.4.14-strict.1` | 与 npm 原版隔离 |
| `cordis.patch.yml` | insert id / name 改为 `dsh-annotation-strict` | 注册行不撞车 |
| `client.js` | bundle `id`、`exports.name` | 包名一致 |
| `client.js` | `block.format` / `block.formatOnly` 的 zh/en/ru 文案 | 要求逐条单独回应、不合并、不跳过；不能回应也要保留编号说明原因 |
| `client.js` | `decorateAll` 新增 `[data-submission-echo]` 扫描，与 `[data-pending-steering]` 同一微任务内切块 + 贴标签 | 修发送瞬间闪出整段批注块：普通本地回显以前完全没被装饰 |
| `client.js` | 浮层/胶囊/标签/芯片的 token：`border-l3`/`border-l4`、`bg-module-platform`、`label-tertiary`、`brand-primary` | 修 #93：浅色主题边框透明、引用块与卡片同色、placeholder 对比度不足 |
| `client.js` | 胶囊 / 气泡标签 / 回复芯片支持 click 开关；document `pointerdown` 点外部关闭 | 触屏没有 `mouseleave`，修 #91 的面板关不掉；鼠标行为不变 |
| `client.js` | 删除 `reply.unanswered` / `reply.nudge` / `reply.nudgePrompt`、`.dsh-ann-unanswered` / `.dsh-ann-nudge`、`missingIndexes` / `listSeparator` / `markUnansweredAnnotations` / `nudgeUnanswered` | 移除漏答提示与追问：误报多，用户自己看得出来 |
| `client.js` | 带批注的 Enter 由插件自己 `preventDefault + stopPropagation` 后 `submit('queue')`，加 400ms 去重锁 | 修 #61：宿主读到旧草稿导致卡回车，或二次提交打断运行中的回合；运行中一律排队 |
| `client.js` | 两个全屏层默认 `display:none`、层本体 `visibility:hidden`，高亮/编号自身 `visibility:visible` | #81：层盒不参与命中测试，带标记时也不挡标题栏拖拽 |
| `client.js` | 高亮去动画 + `hlNodes` 复用 + `onLayoutChange` 在 rAF 前同步刷新 | #82：消掉滚动时的一帧滞后与透明度抖动 |
| `client.js` | 编号 `numNodes` 池复用；`decorateQueueDock` 把排队预览收成标签；steering 行无 bubble 时退回整行 | 滚动零 DOM 替换；排队/插队都不再暴露批注块原文 |
| `client.js` | `findPrevAnnotationItems` 遇到第一条用户/插队行就停 | 普通消息后的回复不再误继承旧批注 |
| `client.js` | 滚动意图后短时 rAF 刷新标记；标签数据实时化 + 按行 key 清理 | 列表搬运时高亮不漂；hover 不再显示旧轮次批注 |
| `client.js` | 排队计数接受空白分隔的连续编号；单独扫描 `[data-pending-steering]` | 2 条批注不再显示成 ×1；插队 pending 气泡不再露出原文 |
| `client.js` | `MutationObserver` 对含批注块的新插入节点同步 `decorateAll` | 插入瞬间不再先闪整段原文 |
| `client.js` | `locateQuote` 在锚点上下文为空时接受精确文本匹配（`noCtx`） | 修 #89：iOS 触摸选择拿不到锚点时，pending 批注刷新后没有高亮 |
| `lib/index.js`、`src/index.ts` | 导出的 `name` | 与包名一致 |
| `test/steering-row.test.mjs` | 断言覆盖普通发送回显 + steering 回显 | 固定发送瞬间不闪的回归 |
| `test/echo-decoration-browser.mjs` | 新增浏览器夹具 | 真实 MutationObserver 下验证回显切块、持久行装饰、回复芯片、无漏答条 |
| `test/empty-anchor-browser.mjs` | 新增浏览器夹具 | 空锚点 pending 批注刷新后仍渲染高亮（#89） |
| `test/unanswered.test.mjs` | 删除 | 漏答提示已移除 |
| `README*.md`、`CHANGELOG.md`、`FORK.md` | fork 说明、能力表、版本历史 | 避免误装 npm 原版 / 误以为还有漏答提示 |

**行为边界**：不做漏答检查、不弹追问。回复芯片只在模型写出「Annotation N：」且编号能对应到本轮批注时生成；模型不写就是普通文字，插件不提醒、不补发。

## 上游更新流程

> 已经拆好的本地 PR 补丁（回显 / 主题 / 触屏 / 空锚点）和 PR 草稿见
> [`upstream/README.md`](./upstream/README.md)。每个补丁独立基于 1.4.11，
> 不要顺序叠加到同一个工作区。

1. 取新版源码：
   ```sh
   npm pack @changfenhuang/dsh-annotation@<new-version>
   # 或从 GitHub 下 tarball
   ```
2. 解压到 `/tmp/upstream-<new-version>`，先跑一遍上游测试，确认基线可用。
3. 在新版 `client.js` 上重新应用补丁：
   ```sh
   cd /tmp/upstream-<new-version>
   git apply --3way /Users/bytedance/dsh-annotation/client-strict.patch
   ```
   冲突时按这几个锚点手工移植：
   - `window.__ModuleLoader__.load({ id: ... })` 与文件末尾 `exports.name`
   - 样式表里的 token（`border-l3` / `bg-module-platform` / `label-tertiary` / `brand-primary`）
   - `decorateAll()` 里 `[data-submission-echo]` / `[data-pending-steering]` 的回显扫描
   - 胶囊 / 气泡标签 / 回复芯片的 click 与 `closeTipFromOutside`
   - `STR.zh/en/ru` 的 `block` 段（没有 `reply` 段）
   - `decorateAssistantAnnotations()` 里只保留 `decorateAnnotationLabels(el, items)`，不要再加漏答检查
4. 把新版 `client.js` 放回本仓库，更新 `package.json` 的 `forkOf.version` 和 `version`（建议 `<upstream>-strict.<n>`），同步更新本文件的 sha256 与 CHANGELOG。
5. 验证：
   ```sh
   node --check client.js
   node --test test/*.test.mjs
   ```
6. 重新安装（见下），重启 DSH，按“验证清单”走一遍。

## 安装 / 切换 / 回滚

**DSH Desktop**：插件管理器 → 添加插件 → 填本目录绝对路径 `/Users/bytedance/dsh-annotation`。如果已装 npm 原版，先在已安装列表里卸载它，避免两个批注插件同时渲染工具条。

**Web profile**：
```sh
dsh plugin --profile web remove @changfenhuang/dsh-annotation   # 可选，卸掉原版
dsh plugin --profile web add link:/Users/bytedance/dsh-annotation
```

**回滚到 npm 原版**：
```sh
dsh plugin --profile web remove dsh-annotation-strict
dsh plugin --profile web add @changfenhuang/dsh-annotation
```
Desktop 同理，在插件管理器里卸载 strict 再装 npm 包。

> `link:` / 本地路径依赖指向这个目录，**不要移动或删除本仓库**，否则 profile 启动会断链。要换位置就重新安装一次。

## 验证清单

- [ ] `window.__DSH_BOOT__.entries.find(({ id }) => id === 'dsh-annotation-strict')` 返回带 `url` 的条目
- [ ] 选中助手文字 → 出现「批注」→ 写备注 → 保存
- [ ] 输入框旁出现「批注 ×1」，hover 能看到原文和备注
- [ ] 回车发送后，自己的气泡只显示问题 + 标签，不显示整段批注块
- [ ] **发送瞬间不闪 JSON**：按回车后本地回显已经是「问题 + 标签」，不是先整段原文再变小
- [ ] 回复里的 `Annotation 1：` 变成可悬浮芯片；点击/点外部能开合
- [ ] 浅色主题下批注卡片有可见边框、引用块与卡片不同色、placeholder 能看清
- [ ] 回复末尾**没有**「还有 N 条批注未回应」提示条
- [ ] 刷新页面，待发送批注与历史消息标签都能恢复
- [ ] 空闲时带批注回车：只发一次，无卡顿、无重复气泡
- [ ] 运行中带批注回车：消息排队，不打断当前回合；回合结束后只处理一次
- [ ] 滚动探针：`npm i --no-save playwright && node test/scroll-drift-probe.mjs client.js`。本 fork 期望 `maxDrift=0`、`opacityMin=1`、`replacements=0`；1.4.11 基线是 90px / 0.00008 / 96。

## 已知限制

- **不做漏答检查**：是否回应由用户自己看；插件不数编号、不提醒、不追问。这是产品选择，不是待办。
- 模型用自然语言回答、不写 `Annotation N:` 时不会出现芯片；插件不会补发或纠正。
- 回复芯片的条目映射只认紧邻的上一条用户/插队消息；如果宿主把当前用户行渲染成不在 `allMessageRows` 里的结构，芯片可能不出现，但不会误报「漏答」。
- 带批注的发送一律走 `queue`：运行中不会按用户的 busy-Enter 偏好改成 steer，这是为了避免打断上一轮而做的取舍。
- 上游问题：#82 已用真实滚轮探针验证（`maxDrift=0`、`opacityMin=1`、`replacements=0`）；#81 已实机确认，带 2 条待发送批注时标题栏拖动正常、高亮可见。
- 上游测试矩阵最高到 DSH 0.2.0-rc.2；DSH NEXT 2.0.18 只做了手动冒烟。
- 本包 `private`，不能 `npm publish`；要发布得先处理包名与上游商标/署名。

## 变更记录

- **2026-11-07**：1.4.14-strict.1。修 #89 空锚点精确匹配：iOS 触摸选择保存的 pending 批注刷新后重新显示高亮；新增 `test/empty-anchor-browser.mjs`。

- **2026-11-07**：1.4.13-strict.1。修发送回显闪烁（普通 `data-submission-echo` 以前完全没被装饰）；移除漏答提示/追问；浅色主题 token（#93）；触屏点击/外部关闭（#91）；新增 `test/echo-decoration-browser.mjs`。121 个单测、回显/胶囊/浮层夹具通过。

- **2026-10-18**：向 `omdsh-dev/dsh-annotation` 提交 PR [#85](https://github.com/omdsh-dev/dsh-annotation/pull/85)（分支 `Miles-Xu:fix/annotation-stability`），内容为本 fork 的修复与 UX 改动；上游若合并，后续更新可改为跟随上游。

- **2026-10-18**：从 `@changfenhuang/dsh-annotation@1.4.11` fork，改名 `dsh-annotation-strict`；新增漏答提示 + 追问，收紧三语协议文案；修 #61 的回车重复提交/卡回车（直接 submit + 400ms 去重锁）；101 个单测通过；实机验证空闲带批注回车只发一次。

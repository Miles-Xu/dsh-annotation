# 上游模块补丁（本地）

这四个补丁是从本 fork `1.4.14-strict.1` 回切到上游
`@changfenhuang/dsh-annotation@1.4.11` 生成的，**只放在本地，没有推送 GitHub**。

- 上游仓库：<https://github.com/omdsh-dev/dsh-annotation>
- 基线：`v1.4.11`，`client.js` sha256
  `53c2d23ea1346845b2b2e6b7db8100f8a82879e43de75482009f9754e74a9039`
- 每个补丁都**独立基于 1.4.11**，不是叠加序列。
  0002 与 0003 会改到同几行样式（token / `cursor`），请一个 PR 一个分支；
  不要按 0001→0002→0003 顺序叠在同一个工作区里。
- 补丁里已经带了对应的回归测试；测试文件是新增的，不会改上游原有测试。

## 模块

| 补丁 | 对应问题 | 改了什么 | 回归测试 |
|---|---|---|---|
| `0001-echo-predecorate.patch` | 发送瞬间闪出整段批注块（本 fork 新增） | `MutationObserver` 对「新插入节点自带批注块」同步执行 `decorateAll`；`decorateAll` 新增 `[data-submission-echo]` / `[data-pending-steering]` 扫描，在绘制前切块 + 贴标签 | `test/echo-decoration-browser.mjs` |
| `0002-light-theme-tokens.patch` | #93 浅色主题边框透明 / 引用块同色 / placeholder 对比度 1.2:1 | `border-inverted` → `border-l3`/`border-l4`；浮层底色 → `bg-module-platform`；`label-dimmed` → `label-tertiary`；`text-accent` → `brand-primary`；引用块 / 列表项换 `bg-module-platform` | `test/light-theme-tokens.test.mjs` |
| `0003-touch-chip-toggle.patch` | #91 触屏点开批注数量徽章后面板关不掉 | 胶囊 / 气泡标签 / 回复芯片支持 `click` 开关；document 级 `pointerdown` 点外部关闭；鼠标 hover 不变 | `test/touch-chip-close-browser.mjs` |
| `0004-empty-anchor.patch` | #89 iOS 触摸选择的空锚点让 pending 批注刷新后没有高亮 | `locateQuote` 在锚点上下文为空时接受精确文本匹配（`noCtx`）；与社区 PR #90 判据一致 | `test/empty-anchor-browser.mjs` |

## 怎么用

在一个干净的 `v1.4.11` checkout 里，每次只应用一个补丁：

```sh
git clone https://github.com/omdsh-dev/dsh-annotation.git /tmp/dsh-annotation-pr
cd /tmp/dsh-annotation-pr
git checkout v1.4.11

git apply /Users/bytedance/dsh-annotation/upstream/0001-echo-predecorate.patch
node --check client.js
node --test test/*.test.mjs

# 需要 Playwright 的浏览器回归（补丁自带测试）：
# PLAYWRIGHT_MODULE=/path/to/playwright node test/echo-decoration-browser.mjs
```

`0002`、`0003`、`0004` 同理，各自新开分支，不要在同一分支连续 apply。

## PR 草稿

### 0001

**Title:** `fix: decorate the submission echo before paint to remove the send-time flash`

**Body:**
- The host renders a local submission echo (`[data-submission-echo]`) with the raw draft before the durable `user/message` row arrives. The echo is not in `allMessageRows`, so `decorateAll` never saw it; the full annotation block stayed visible until the durable row replaced it.
- The observer now runs `decorateAll` synchronously when an inserted node already contains an annotation block (still before paint), and `decorateAll` scans `[data-submission-echo]` alongside `[data-pending-steering]`.
- Test: `test/echo-decoration-browser.mjs` asserts the echo and the durable row both show only the question plus the tag, and that the reply chip still renders.
- No protocol or layout change; this only removes the one-frame flash.

### 0002

**Title:** `fix: use visible theme tokens on light theme (#93)`

**Body:**
- `--dsw-alias-border-inverted` is fully transparent in the light theme, so every annotation surface lost its border; `bg-layer-1/2` are both white, so the quote block merged into the card; `label-dimmed` is a disabled color (1.2:1 placeholder contrast).
- Mapping: borders → `border-l3` / `border-l4`; floating surfaces → `bg-module-platform`; quote/list rows → `bg-module-platform`; placeholder → `label-tertiary`; accent → `brand-primary`.
- Test: `test/light-theme-tokens.test.mjs` pins the token set.

### 0003

**Title:** `fix: close annotation panels on touch and outside tap (#91)`

**Body:**
- The pending chip / bubble tag / reply chip panels only had `mouseenter`/`mouseleave`. Touch has no `mouseleave`, so a tap opened the panel and it stayed until the session changed.
- Click toggles the panel on touch; a document-level `pointerdown` outside the trigger and panel closes it. Mouse hover behavior is unchanged.
- Test: `test/touch-chip-close-browser.mjs`.

### 0004

**Title:** `fix: keep the highlight for empty annotation anchors (#89)`

**Body:**
- Real iOS touch selections can produce a pending annotation whose `seqKey` / `rowHead` / `textOffset` / `ctxBefore` / `ctxAfter` are all empty. `locateQuote` then builds `ctx = { before: '', after: '' }` rather than `null`; `ctxScore` is always 0, and the old `bestScore > 0` guard discarded the exact text match, so the highlight disappeared after save/reload.
- Accept the exact match when the saved context is empty; behavior with a populated context is unchanged.
- Test: `test/empty-anchor-browser.mjs`. The criterion matches community PR #90, rewritten against this code structure.

## 与 PR #85 的关系

PR #85 已经覆盖 #61 / #81 / #82 和队列/插队 UI；这四个补丁不重复那些改动。建议先单独提交 0001（收益最大、风险最低），再按维护者反馈决定 0002–0004 的节奏。

## 验证状态

- 四个补丁分别在干净 `v1.4.11` 上 `git apply --check` 通过。
- 0001 / 0003 / 0004 的浏览器测试在「上游 + 对应补丁」的临时目录里实际跑过并通过。
- 0002 的 token 单测在「上游 + 0002」的临时目录里通过。
- 组合后的完整功能以本 fork `1.4.14-strict.1` 为准；本目录只用于拆 PR。

// #82 回归探针：真实滚轮 + 逐帧采样高亮块与原文 Range 的 top 偏差、透明度、
// 高亮 DOM 被替换的次数，以及标记层的 top（#81 的标题栏让位）。
//
// 用法（Playwright 不是本包依赖，需临时安装）：
//   npm i --no-save playwright
//   node test/scroll-drift-probe.mjs client.js
//   node test/scroll-drift-probe.mjs /path/to/baseline-client.js
//
// 2026-10-18 实测（Chromium，24 次滚轮 × 90px）：
//   1.4.11 基线：maxDrift=90px，opacity 0.00008–1，替换 96 次
//   本 fork：   maxDrift=0px， opacity 1，      替换 0 次，layerTop=76px
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const clientPath = process.argv[2]
const client = readFileSync(clientPath, 'utf8')
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1000, height: 800 } })

await page.route('http://annotation.test/', route => route.fulfill({ contentType: 'text/html', body: `
<style>
  body{margin:0;font:16px sans-serif}
  #column{position:fixed;left:100px;top:0;width:700px;height:740px;display:flex;flex-direction:column}
  .actual_header{flex:none;height:76px;background:white}
  .actual_scrollBody{height:504px;overflow:auto;flex:none}
  #content{padding-top:80px}
  .row{padding:8px 0}
  .actual_composerCard{height:160px;background:white}
</style>
<section id="column">
  <header class="actual_header">Conversation</header>
  <div class="actual_scrollBody" data-conversation-scroll>
    <div id="content">
      <div class="row" data-time-hover-root data-chat-flow-kind="assistant-step">
        <p id="quote">Scroll drift probe passage: this sentence is deliberately long enough to wrap across more than one line inside the conversation column, so the annotation produces multiple highlight rectangles and any per-frame offset is easy to measure while the wheel is moving.</p>
      </div>
      <div style="height:2600px"></div>
    </div>
  </div>
  <div class="actual_composerCard" data-composer-card><div contenteditable="true" data-composer-input>Question</div></div>
</section>` }))

await page.goto('http://annotation.test/')
await page.evaluate(() => { window.__ModuleLoader__ = { load(entry) { window.api = entry.factory(() => ({})) } } })
await page.addScriptTag({ content: client })
await page.evaluate(() => {
  window.dispose = window.api.apply({
    sessions: { list: { getSnapshot: () => ({ current: 'session' }), subscribe: () => () => {} }, scope: () => ({}) },
  })
})

await page.evaluate(() => {
  const range = document.createRange()
  range.selectNodeContents(document.querySelector('#quote'))
  getSelection().removeAllRanges()
  getSelection().addRange(range)
})
await page.locator('.dsh-ann-bar button').first().click()
await page.locator('.dsh-ann-input').fill('probe')
await page.locator('.dsh-ann-action').click()
await page.locator('.dsh-ann-hl').first().waitFor({ state: 'attached' })
await page.waitForTimeout(200)

await page.mouse.move(400, 300)
await page.evaluate(() => {
  window.__samples = []
  window.__stop = false
  window.__replacements = 0
  window.__numReplacements = 0
  const range = document.createRange()
  range.selectNodeContents(document.querySelector('#quote'))
  const obs = new MutationObserver(muts => {
    for (const m of muts) for (const n of m.addedNodes) {
      if (n.classList && n.classList.contains('dsh-ann-hl')) window.__replacements++
      if (n.classList && n.classList.contains('dsh-ann-num')) window.__numReplacements++
    }
  })
  obs.observe(document.body, { childList: true, subtree: true })
  const tick = () => {
    const hl = document.querySelector('.dsh-ann-hl')
    if (hl !== null) {
      window.__samples.push({
        d: hl.getBoundingClientRect().top - range.getBoundingClientRect().top,
        op: parseFloat(getComputedStyle(hl).opacity),
      })
    }
    if (!window.__stop) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
})

for (let i = 0; i < 24; i++) {
  await page.mouse.wheel(0, 90)
  await page.waitForTimeout(16)
}
await page.evaluate(() => { window.__stop = true })
const result = await page.evaluate(() => ({ samples: window.__samples, replacements: window.__replacements, numReplacements: window.__numReplacements, layerTop: document.querySelector('[data-annotation-overlay]').style.top }))
const ds = result.samples.map(s => Math.abs(s.d))
const ops = result.samples.map(s => s.op)
console.log(JSON.stringify({
  client: clientPath,
  samples: result.samples.length,
  maxDrift: Math.max(...ds),
  driftOver1: ds.filter(d => d > 1).length,
  driftOver5: ds.filter(d => d > 5).length,
  opacityMin: Math.min(...ops),
  opacityMax: Math.max(...ops),
  opacityBelow05: ops.filter(o => o < 0.5).length,
  replacements: result.replacements,
  numReplacements: result.numReplacements,
  layerTop: result.layerTop,
}))
await browser.close()

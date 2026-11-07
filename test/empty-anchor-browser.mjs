// Regression for #89 / PR #90: a real iOS touch selection can produce a pending
// annotation whose anchor fields are all empty. locateQuote() then has
// { before: '', after: '' } (not null), ctxScore is always 0, and the old
// `bestScore > 0` guard discarded an exact text match — no highlight after save
// or reload. Empty context must accept the exact match.
import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } })
  const errors = []
  page.on('pageerror', error => errors.push(String(error)))
  await page.route('http://annotation.test/', route => route.fulfill({ contentType: 'text/html; charset=utf-8', body: `
    <style>
      body { margin:0; font-family:system-ui }
      #quote { position:absolute; left:260px; top:280px; width:480px; }
      [data-composer-card] { position:fixed; left:200px; bottom:24px; width:600px; height:140px; background:#fff; }
    </style>
    <div data-chat-flow-kind="assistant-step"><p id="quote">触摸选择后保存的原文，锚点字段全空。</p></div>
    <div data-composer-card><div data-composer-input contenteditable="true"></div></div>` }))
  await page.goto('http://annotation.test/')
  await page.evaluate(() => {
    localStorage.setItem('dsh.annotation.pending.v1.session', JSON.stringify([{
      id: 'touch-1',
      text: '触摸选择后保存的原文，锚点字段全空。',
      note: '空锚点',
      seqKey: '',
      rowHead: '',
      textOffset: -1,
      ctxBefore: '',
      ctxAfter: '',
    }]))
    window.__ModuleLoader__ = { load(entry) { window.api = entry.factory(() => ({})) } }
  })
  await page.addScriptTag({ path: new URL('../client.js', import.meta.url).pathname })
  await page.evaluate(() => {
    window.dispose = window.api.apply({
      sessions: {
        list: { getSnapshot: () => ({ current: 'session' }), subscribe: () => () => {} },
        scope: () => ({}),
      },
      conversation: { input: { for: () => ({ state: { getSnapshot: () => ({ draft: '' }), subscribe: () => () => {} } }) } },
      locale: { getSnapshot: () => ({ active: 'zh' }), subscribe: () => () => {} },
    })
  })
  await page.locator('[data-annotation-chip]').waitFor({ timeout: 3000 })
  await page.evaluate(() => window.dispatchEvent(new Event('resize')))
  await page.locator('.dsh-ann-hl').first().waitFor({ timeout: 3000 })
  assert.ok(await page.locator('.dsh-ann-hl').count() > 0, 'empty anchors still render a highlight')
  assert.match(await page.locator('[data-annotation-chip]').textContent(), /1/)
  assert.deepEqual(errors, [])
  console.log('PASS: empty-anchor touch selection renders its highlight (#89)')
} finally {
  await browser.close()
}

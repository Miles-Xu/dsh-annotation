import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8')

test('滚轮/触摸/键盘滚动意图会启动短时 rAF 刷新', () => {
  assert.match(source, /function kickMarkerLoop\(/)
  assert.match(source, /function onScrollIntent\(/)
  assert.match(source, /addEventListener\('wheel', onScrollIntent/)
  assert.match(source, /addEventListener\('touchmove', onScrollIntent/)
  assert.match(source, /addEventListener\('keydown', onScrollIntent/)
  assert.match(source, /markerLoopRaf = requestAnimationFrame\(markerLoopTick\)/)
  assert.match(source, /renderMarkers\(\)\n        markerLoopRaf = requestAnimationFrame\(markerLoopTick\)/)
})

test('标签 hover 读取实时数据而不是创建时闭包', () => {
  assert.match(source, /var list = tag\.__annotationItems \|\| \[\]/)
  assert.doesNotMatch(source, /\(function \(list\) \{/)
})

test('复用行时更新标签数据并按行 key 清理', () => {
  assert.match(source, /existing\.__annotationItems = items/)
  assert.match(source, /function rowKeyOf\(/)
  assert.match(source, /function pruneStaleTags\(/)
  assert.match(source, /tag\.__rowKey !== key/)
  assert.match(source, /tag\.__rowKey = rowKeyOf\(row\)/)
})

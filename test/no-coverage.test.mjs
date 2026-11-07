import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8')

test('漏答提示与追问已移除', () => {
  for (const token of [
    'data-annotation-unanswered',
    'dsh-ann-unanswered',
    'dsh-ann-nudge',
    'missingIndexes',
    'markUnansweredAnnotations',
    'nudgeUnanswered',
    'reply.unanswered',
    'reply.nudge',
  ]) {
    assert.equal(source.includes(token), false, `client.js still contains ${token}`)
  }
})

test('普通发送回显与插队回显共用绘制前装饰路径', () => {
  assert.match(source, /querySelectorAll\('\[data-submission-echo\], \[data-pending-steering\]'\)/)
  assert.match(source, /hasAnnotationInsert/)
})

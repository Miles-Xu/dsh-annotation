import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const client = readFileSync(new URL('../client.js', import.meta.url), 'utf8')
const patch = readFileSync(new URL('../cordis.patch.yml', import.meta.url), 'utf8')

function quote(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

test('client bundle id 与 package name 完全一致', () => {
  assert.match(client, new RegExp(`id: '${quote(manifest.name)}'`))
  assert.match(client, new RegExp(`exports\\.name = '${quote(manifest.name)}'`))
})

test('cordis.patch.yml 注册的 name 与 package name 一致', () => {
  assert.match(patch, new RegExp(`name: '${quote(manifest.name)}'`))
})

test('fork 元数据完整，且不会被误发布', () => {
  assert.equal(manifest.private, true)
  assert.equal(manifest.forkOf.name, '@changfenhuang/dsh-annotation')
  assert.match(manifest.version, /-strict\.\d+$/)
})

test('bundle / client 声明仍然存在', () => {
  assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml')
  assert.equal(manifest.dsh.client.platform, 'web')
  assert.ok(manifest.dsh.client.inject.includes('@deepseek-ai/dsh-client-ui-conversation'))
})

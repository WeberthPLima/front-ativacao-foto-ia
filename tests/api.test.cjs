const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
const source = fs.readFileSync('src/lib/api.ts', 'utf8').replaceAll('import.meta.env', '({})')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const api = { exports: {} }
new Function('module', 'exports', 'window', compiled)(api, api.exports, { location: { origin: 'https://festa.example' } })
const { mergeInteraction, buildPublicResultUrl, resolveRenderableUrl } = api.exports

test('share token survives style, generation and status responses', () => {
  let current = { id: 'one', shareToken: 'secret', shareUrl: 'http://localhost:5173/resultado/secret' }
  for (const status of ['style_selected', 'processing', 'completed']) {
    current = mergeInteraction(current, { id: 'one', status, shareToken: null, shareUrl: null })
    assert.equal(current.shareToken, 'secret')
  }
  assert.equal(buildPublicResultUrl(current.shareToken, current.shareUrl), 'https://festa.example/resultado/secret')
  assert.equal(mergeInteraction(current, { id: 'two', shareToken: 'new' }).shareToken, 'new')
  assert.equal(mergeInteraction(current, null), null)
})

test('local API images use the reachable frontend proxy', () => {
  assert.equal(resolveRenderableUrl('http://localhost:3333/files/foto.png'), 'https://festa.example/files/foto.png')
  assert.equal(resolveRenderableUrl('https://cdn.example/files/foto.png'), 'https://cdn.example/files/foto.png')
  assert.equal(buildPublicResultUrl(null, null), '')
})

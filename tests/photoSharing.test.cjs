const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
const compiled = ts.transpileModule(fs.readFileSync('src/lib/photoSharing.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
function load(navigator, fetch = global.fetch) {
  const module = { exports: {} }
  new Function('module', 'exports', 'navigator', 'fetch', compiled)(module, module.exports, navigator, fetch)
  return module.exports
}
test('shares the prepared image file immediately without replacing it with a URL', async () => {
  const file = new File(['image'], 'foto.png', { type: 'image/png' })
  let called = false
  const api = load({ canShare: data => data.files[0] === file, share: data => {
    called = true
    assert.deepEqual(Object.keys(data), ['files'])
    assert.equal(data.files[0], file)
    return Promise.resolve()
  } })
  const result = api.sharePhotoFile(file)
  assert.equal(called, true)
  assert.equal(await result, 'shared')
})
test('handles unsupported file sharing and cancellation without sharing a link', async () => {
  const file = new File(['image'], 'foto.png', { type: 'image/png' })
  assert.equal(await load({}).sharePhotoFile(file), 'unsupported')
  assert.equal(await load({ canShare: () => false, share: () => assert.fail() }).sharePhotoFile(file), 'unsupported')
  assert.equal(await load({ canShare: () => true, share: async () => { throw new DOMException('cancelled', 'AbortError') } }).sharePhotoFile(file), 'cancelled')
})
test('validates the downloaded file before enabling file sharing', async () => {
  const api = load({}, async () => new Response('image', { headers: { 'Content-Type': 'image/png' } }))
  const file = await api.prepareShareFile('/v1/media/token')
  assert.equal(file.type, 'image/png')
  assert.equal(await file.text(), 'image')
  await assert.rejects(load({}, async () => new Response('<html>error</html>')).prepareShareFile('/v1/media/token'), /foto válida/)
})

import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const base = '/App-Blueprint/'
const html = fs.readFileSync('dist/index.html', 'utf8')
assert(!html.includes('/src/main.tsx'), 'Pages must publish the production build, not the source HTML.')
const modules = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(match => match[1])
assert(modules.length > 0, 'The production entry point must load JavaScript.')
const references = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1])
for (const reference of references) {
  const asset = new URL(reference, `https://pages.test${base}`)
  assert(asset.origin === 'https://pages.test' && asset.pathname.startsWith(base), `Asset must resolve under the Pages subpath: ${reference}`)
  assert(fs.existsSync(path.join('dist', decodeURIComponent(asset.pathname.slice(base.length)))), `Missing built asset: ${reference}`)
}
for (const file of ['sw.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png']) {
  assert(fs.existsSync(path.join('dist', file)), `Missing PWA asset: ${file}`)
}
console.log(`Pages build verified: ${modules.length} module entry point and ${references.length} asset references under ${base}`)

import { readFileSync, readdirSync } from 'node:fs'
const ROOT = new URL('../dist/', import.meta.url)
const assets = readdirSync(new URL('assets/', ROOT))
const jsFile = assets.find((f) => f.endsWith('.js'))
const js = readFileSync(new URL(`assets/${jsFile}`, ROOT), 'utf8')

// 검색 패턴들 — JS 안에 어떤 형태로 들어있는지
const patterns = [
  '</script>',
  '<\\/script>',
  '</SCRIPT>',
  '\\u003c/script',
  '%3C/script',
  '/script>',
]
for (const p of patterns) {
  const idx = js.indexOf(p)
  console.log(`  "${p}": firstIdx=${idx} count=${js.split(p).length - 1}`)
}
console.log('---')
// '/script>' 의 첫 발견 위치 주변 출력
const i = js.indexOf('/script>')
if (i >= 0) {
  console.log(`first /script> @${i}:`)
  console.log('  ', JSON.stringify(js.slice(Math.max(0, i - 60), i + 30)))
}

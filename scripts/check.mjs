import { readFileSync, readdirSync } from 'node:fs'

const distDir = new URL('../dist/', import.meta.url)
const assetsDir = new URL('../dist/assets/', import.meta.url)

const inlined = readFileSync(new URL('inlined.html', distDir), 'utf8')
const jsFile = readdirSync(assetsDir).find((f) => f.endsWith('.js'))
const js = readFileSync(new URL(`assets/${jsFile}`, distDir), 'utf8')

const inlinedCloseTags = (inlined.match(/<\/script>/gi) || []).length
const inlinedEscaped = (inlined.match(/<\\\/script>/gi) || []).length
const jsCloseTags = (js.match(/<\/script>/gi) || []).length
const jsLowercase = (js.match(/<\/script/gi) || []).length

console.log({
  inlinedCloseTagsLiteral: inlinedCloseTags,
  inlinedEscaped: inlinedEscaped,
  jsCloseTagsLiteral: jsCloseTags,
  jsAnyCase: jsLowercase,
  inlinedBytes: inlined.length,
  jsBytes: js.length,
})

// 어디에 있는지 첫 5개 인덱스
const idxs = []
let pos = 0
while ((pos = inlined.indexOf('</script>', pos)) !== -1) {
  idxs.push(pos)
  pos++
  if (idxs.length >= 5) break
}
console.log('first occurrences in inlined.html:', idxs)
for (const i of idxs) {
  console.log(`  @${i}: ...${JSON.stringify(inlined.slice(Math.max(0, i - 40), i + 20))}`)
}

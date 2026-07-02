// 빌드 산출물(dist/) 의 index.html + assets/*.css + assets/*.js 를
// 하나의 자가완비 HTML 로 합친다.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'

const ROOT = new URL('../dist/', import.meta.url)

let html = readFileSync(new URL('index.html', ROOT), 'utf8')

const assets = readdirSync(new URL('assets/', ROOT))
const cssFile = assets.find((f) => f.endsWith('.css'))
const jsFile = assets.find((f) => f.endsWith('.js'))

const css = readFileSync(new URL(`assets/${cssFile}`, ROOT), 'utf8')
let js = readFileSync(new URL(`assets/${jsFile}`, ROOT), 'utf8')

// ★ 인라인 <script> 안의 닫는 태그 시퀀스를 안전한 형태로 깨뜨려야 한다.
//   HTML 파서는 대소문자 무시 + `</script ...>` / `</script\t>` 등도 닫는 태그로 본다.
//   가장 안전: '</' 다음에 'script' 가 오는 모든 경우를 escape.
const SCRIPT_RE = /<\/(script)/gi
const before = (js.match(SCRIPT_RE) || []).length
js = js.replace(SCRIPT_RE, '<\\/$1')
const after = (js.match(SCRIPT_RE) || []).length
console.log(`escaped </script: ${before} → ${after} remaining`)

// HTML 주석 조기 시작 방지
js = js.replace(/<!--/g, '<\\!--')

// 외부 참조 제거 → 인라인 삽입
// ★ String.replace 의 replacement 인수가 문자열이면 $& / $' / $` / $n 이 특수 해석된다.
//   replacement 가 함수면 그런 해석이 일어나지 않으므로 함수 형태로 넘긴다.
html = html.replace(
  /<link[^>]*rel="stylesheet"[^>]*>/,
  () => `<style>\n${css}\n</style>`,
)
html = html.replace(
  /<script[^>]*src="[^"]*"[^>]*><\/script>/,
  () => `<script type="module">\n${js}\n</script>`,
)

writeFileSync(new URL('inlined.html', ROOT), html, 'utf8')
console.log('OK', html.length, 'bytes →', new URL('inlined.html', ROOT).pathname)

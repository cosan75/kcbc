import type { QuestionItem } from '../types'

/**
 * 스킬.md 파싱
 * 패턴: ## 📝 문항 N (서술형|논술형) — 도메인: 단원
 *       [총배점] [자료박스] **(k)** ... **(N점)**
 */

const HEADER_RE = /^##\s*📝?\s*문항\s*(\d+)\s*\((서술형|논술형)\)\s*—\s*([^:]+):\s*(.+)$/

export function parseQuestions(md: string): QuestionItem[] {
  const lines = md.split('\n')
  const blocks: { header: string; body: string }[] = []
  let current: { header: string; body: string } | null = null

  for (const line of lines) {
    if (HEADER_RE.test(line.trim())) {
      if (current) blocks.push(current)
      current = { header: line.trim(), body: '' }
    } else if (current) {
      current.body += line + '\n'
    }
  }
  if (current) blocks.push(current)

  const items: QuestionItem[] = []
  for (const b of blocks) {
    const m = b.header.match(HEADER_RE)
    if (!m) continue
    const no = Number(m[1])
    const type = m[2] as '서술형' | '논술형'
    const domain = m[3].trim()
    const title = m[4].trim()

    // 자료 박스 — "특집:" 다음 줄 또는 │ 안의 의미 있는 한 줄
    const materialLabel =
      b.body.match(/특집:\s*([^│\n]+)/)?.[1]?.trim() ||
      b.body.match(/▲\s*([^│\n]+)/)?.[1]?.trim() ||
      ''
    const materialDescMatch =
      b.body.match(/\[\s*총배점.*?\][\s\S]*?```([\s\S]*?)```/)?.[1] || ''
    const firstMeaningfulLine =
      materialDescMatch
        .split('\n')
        .map((l) =>
          l
            .replace(/[│┌┐└┘─]+/g, '')
            .replace(/^\s*[\w]+\s*/, '')
            .trim(),
        )
        .find((l) => l.length > 0 && !/안내|발행|특집/.test(l)) || ''

    // 총배점 — 도입 지시문의 [N점]
    const totalScore = Number(
      b.body.match(/\[\s*(\d+)\s*점\s*\]/)?.[1] || '0',
    )

    // 하위 문항 배점들
    const subScores = Array.from(
      b.body.matchAll(/\*\*\((\d+)점\)\*\*/g),
    ).map((mm) => Number(mm[1]))

    items.push({
      no,
      type,
      domain,
      title,
      materialLabel: materialLabel || '자료 박스',
      materialDesc: firstMeaningfulLine,
      totalScore,
      subScores,
    })
  }
  return items.sort((a, b) => a.no - b.no)
}

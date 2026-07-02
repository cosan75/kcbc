import type { Pillar, FlowStep, LessonCase } from '../types'

/**
 * CLAUDE.md 파싱
 * - §2 5대 구성 요소 표
 * - §3 7단계 번호 리스트
 * - §5 명제적 지식 예시 (사회)
 * - §6 절차적 지식 예시 (수학)
 * - §7 체크리스트
 */

function stripBold(s: string): string {
  return s.replace(/\*\*/g, '').trim()
}

/** 마크다운 테이블의 본문 행만 반환 */
function parseTableRows(block: string): string[][] {
  return block
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('|') && !/^\|[-:\s|]+\|$/.test(l))
    .map((l) =>
      l
        .replace(/^\||\|$/g, '')
        .split('|')
        .map((c) => stripBold(c.trim())),
    )
}

/** §2 5대 구성 요소 추출 */
export function parsePillars(md: string): Pillar[] {
  const m = md.match(/## 2\.[\s\S]*?(\n##\s|$)/)
  if (!m) return []
  const rows = parseTableRows(m[0])
  // 첫 행은 헤더
  return rows.slice(1).map(([name, meaning, question]) => ({
    name: (name || '').replace(/\(.*?\)/g, '').trim(),
    meaning: meaning || '',
    question: (question || '').replace(/^"|"$/g, ''),
  }))
}

/** §3 7단계 추출 */
export function parseSteps(md: string): FlowStep[] {
  const m = md.match(/## 3\.[\s\S]*?(\n##\s|$)/)
  if (!m) return []
  const lines = m[0].split('\n')
  const steps: FlowStep[] = []
  for (const line of lines) {
    const re = /^(\d+)\.\s+\*\*(.+?)\(([^)]+)\)\*\*\s*[—-]\s*(.+?)(\s*★\s*KCBC\s*핵심)?$/
    const mm = line.trim().match(re)
    if (mm) {
      steps.push({
        num: Number(mm[1]),
        ko: mm[2],
        en: mm[3],
        desc: mm[4].replace(/★.*$/, '').trim(),
        star: Boolean(mm[5]),
      })
    }
  }
  return steps
}

/** §5 / §6 레슨 케이스 추출 */
function parseLessonSection(
  md: string,
  sectionNum: 5 | 6,
  knowledgeType: '명제적' | '절차적',
  defaults: { subject: string; unit: string },
): LessonCase {
  const re = new RegExp(`## ${sectionNum}\\.[\\s\\S]*?(\\n## (?!${sectionNum}-)|$)`)
  const m = md.match(re)
  const body = m ? m[0] : ''

  const pickList = (header: string): string[] => {
    const r = new RegExp(`### ${sectionNum}-\\d+\\.\\s*${header}[\\s\\S]*?(?=### |$)`)
    const mm = body.match(r)
    if (!mm) return []
    return mm[0]
      .split('\n')
      .filter((l) => /^\s*-\s+/.test(l))
      .map((l) => stripBold(l.replace(/^\s*-\s+/, '').trim()))
  }

  const pickFirstAfter = (label: string): string => {
    const r = new RegExp(`###[^\\n]*${label}[^\\n]*\\n([\\s\\S]*?)(?=###|## )`)
    const mm = body.match(r)
    return mm ? stripBold(mm[1].trim().split('\n')[0]) : ''
  }

  // 학생상
  const studentImage = pickFirstAfter('학생상')

  // 핵심가치
  const values = pickList('핵심가치')

  // 핵심개념 (Macro / Micro)
  const conceptBlock = body.match(/###[^\n]*핵심개념[\s\S]*?(?=###|## )/)?.[0] || ''
  const macroLens = stripBold(
    conceptBlock.match(/렌즈\s*개념[^:]*:\s*\**\s*([^\n]+)/)?.[1]?.trim() || '',
  ).replace(/\*+$/, '')
  const microConcepts = stripBold(
    conceptBlock.match(/단원\s*개념[^:]*:\s*\**\s*([^\n]+)/)?.[1]?.trim() || '',
  ).replace(/\*+$/, '')

  // 핵심기능
  const skills = pickList('핵심기능')

  // 일반화 진술문: ⑤ 일반화 행에서 따옴표 안의 문장
  const tableMatch = body.match(/\|\s*⑤[^|]*\|[^|]*\|\s*"([^"]+)"/)
  const generalization = tableMatch ? stripBold(tableMatch[1].trim()) : ''

  // 수행 과제: 평가 섹션의 첫 항목
  const taskMatch = body.match(/###[^\n]*평가[\s\S]*?수행\s*과제:\*\*\s*([^\n]+)/)
  const task = taskMatch ? stripBold(taskMatch[1].trim()) : ''

  return {
    subject: defaults.subject,
    unit: defaults.unit,
    knowledgeType,
    studentImage,
    values,
    macroLens,
    microConcepts,
    skills,
    task,
    generalization,
  }
}

export function parseLessons(md: string) {
  return {
    propositional: parseLessonSection(md, 5, '명제적', {
      subject: '사회',
      unit: '우리나라의 지리 환경',
    }),
    procedural: parseLessonSection(md, 6, '절차적', {
      subject: '수학',
      unit: '분수의 덧셈과 뺄셈',
    }),
  }
}

/** §7 체크리스트 항목 */
export function parseChecklist(md: string): string[] {
  const m = md.match(/## 7\.[\s\S]*?(?=\n## |$)/)
  if (!m) return []
  return m[0]
    .split('\n')
    .filter((l) => /^\s*-\s*\[\s\]\s+/.test(l))
    .map((l) => stripBold(l.replace(/^\s*-\s*\[\s\]\s+/, '').trim()))
}

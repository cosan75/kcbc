// 사용자 작성 데이터를 CLAUDE.md §5·§6 / 스킬.md 양식으로 변환

import type {
  LessonDraft,
  AssessmentDraft,
  StagedAssessment,
  StagedItem,
  QuestionStage,
  ProficiencyLevel,
  SubQuestion,
  RubricLevel,
  GradingRecord,
  KrGrade,
} from '../domain'
import {
  STAGE_EN,
  STAGED_STAGES,
  PROFICIENCY_LEVELS,
  MAIL_COMPETENCIES,
  DEFAULT_RUBRIC,
} from '../domain'

export function lessonToMarkdown(lesson: LessonDraft): string {
  const lines: string[] = []
  lines.push(`# ${lesson.subject} — ${lesson.title}`)
  lines.push('')
  lines.push(`> **학년**: ${lesson.grade || '-'}　|　**지식 유형**: ${lesson.knowledgeType} 지식`)
  lines.push('')
  lines.push('## 1. 학생상')
  lines.push(lesson.studentImage || '-')
  lines.push('')
  lines.push('## 2. 핵심가치')
  if (lesson.values.length) {
    lesson.values.forEach((v) => lines.push(`- ${v}`))
  } else lines.push('-')
  lines.push('')
  lines.push('## 3. 핵심개념')
  lines.push(`- **렌즈 개념(Macro):** ${lesson.macroLens || '-'}`)
  lines.push(
    `- **단원 개념(Micro):** ${lesson.microConcepts.length ? lesson.microConcepts.join(', ') : '-'}`,
  )
  lines.push('')
  lines.push('## 4. 핵심기능')
  if (lesson.skills.length) {
    lesson.skills.forEach((s) => lines.push(`- ${s}`))
  } else lines.push('-')
  lines.push('')
  lines.push('## 5. 교수 설계 (7단계 적용)')
  lines.push('')
  lines.push('| 단계 | 학습 활동 | 안내 질문 |')
  lines.push('|---|---|---|')
  const stageMarks = ['①', '②', '③', '④', '⑤', '⑥', '⑦']
  for (let i = 0; i < 7; i++) {
    const s = lesson.stages[i]
    const mark = stageMarks[i]
    const name = s?.ko || ''
    const star = i === 4 ? ' ★ 일반화' : ''
    const act = s?.activity || '-'
    const q = s?.question ? `"${s.question}"` : '-'
    lines.push(`| ${mark} ${name}${star} | ${act} | ${q} |`)
  }
  lines.push('')
  if (lesson.generalization) {
    lines.push('### ⑤ 일반화 진술문')
    lines.push(`> ${lesson.generalization}`)
    lines.push('')
  }
  lines.push('## 6. 평가')
  lines.push(`- **수행 과제:** ${lesson.evaluation.task || '-'}`)
  if (lesson.evaluation.rubric.length) {
    lines.push('- **루브릭 기준:**')
    lesson.evaluation.rubric.forEach((r, i) => lines.push(`  ${i + 1}. ${r}`))
  }
  if (lesson.evaluation.formative) {
    lines.push(`- **형성평가:** ${lesson.evaluation.formative}`)
  }
  lines.push('')
  lines.push('---')
  lines.push(
    `_생성: ${new Date(lesson.createdAt).toLocaleString('ko-KR')} · KCBC Builder_`,
  )
  return lines.join('\n')
}

/** STAGE_EN 가져오기 (참고용 export) */
export const stageEn = STAGE_EN

export function assessmentToMarkdown(a: AssessmentDraft): string {
  const lines: string[] = []
  lines.push(`## 📝 문항 ${a.no} (${a.type}) — ${a.domain}: ${a.title}`)
  lines.push('')
  lines.push(`**${a.prompt} [${a.totalScore}점]**`)
  lines.push('')
  if (a.material) {
    lines.push('```')
    lines.push(a.material.trimEnd())
    lines.push('```')
  }
  if (a.source) {
    lines.push(` [삽화 출처: ${a.source}]`)
  }
  lines.push('')
  a.subQuestions.forEach((sq, i) => {
    const idx = i + 1
    lines.push(`**(${idx})** ${sq.text} **(${sq.score}점)**`)
    lines.push('')
  })
  lines.push('---')
  lines.push('')
  lines.push('### 채점 기준')
  lines.push('')
  lines.push('| 단계 | 기준 | 점수 |')
  lines.push('|---|---|---|')
  a.rubric.forEach((r) =>
    lines.push(`| **${r.level}** | ${r.criteria} | ${r.score} |`),
  )
  lines.push('')
  return lines.join('\n')
}

/* ============================================================
 *  단계형 평가문항 작성기 — MD 내보내기 & 평가문항 변환
 * ============================================================ */

function findStage(k: QuestionStage) {
  return STAGED_STAGES.find((s) => s.key === k)!
}
function findLevel(k: ProficiencyLevel) {
  return PROFICIENCY_LEVELS.find((l) => l.key === k)!
}
function findMail(k: StagedItem['competency']) {
  return MAIL_COMPETENCIES.find((m) => m.key === k)!
}

export function stagedToMarkdown(s: StagedAssessment): string {
  const lines: string[] = []
  lines.push(`# 단계형 평가문항 작성지 — ${s.title || '제목 없음'}`)
  lines.push('')
  lines.push(
    `> **교과**: ${s.subject || '-'}　|　**학년**: ${s.grade || '-'}　|　` +
      `**작성**: ${new Date(s.createdAt).toLocaleDateString('ko-KR')}`,
  )
  lines.push('')
  if (s.importantQuestion) {
    lines.push('## ⭐ 단원을 관통하는 ‘중요한 질문’')
    lines.push(`> ${s.importantQuestion}`)
    lines.push('')
  }
  if (s.contextMaterial) {
    lines.push('## 📄 자료 / 맥락')
    lines.push('```')
    lines.push(s.contextMaterial.trim())
    lines.push('```')
    lines.push('')
  }

  lines.push('## 🧭 단계형 매트릭스 (질문 단계 × PISA 숙련도)')
  lines.push('')
  // header
  const cols = ['수준 \\ 단계', ...STAGED_STAGES.map((st) => `${st.ko} (${st.en})`)]
  lines.push(`| ${cols.join(' | ')} |`)
  lines.push(`| ${cols.map(() => '---').join(' | ')} |`)
  for (const lv of PROFICIENCY_LEVELS) {
    const row = [`**${lv.ko}**`]
    for (const st of STAGED_STAGES) {
      const it = s.items.find((x) => x.stage === st.key && x.level === lv.key)
      if (!it || !it.question) {
        row.push('–')
      } else {
        const tag = findMail(it.competency).short
        const q = it.question.replace(/\|/g, '\\|').replace(/\n/g, ' ')
        row.push(`[${tag}] ${q}`)
      }
    }
    lines.push(`| ${row.join(' | ')} |`)
  }
  lines.push('')

  lines.push('## 📋 셀별 상세')
  lines.push('')
  for (const st of STAGED_STAGES) {
    const cells = s.items.filter((x) => x.stage === st.key && x.question)
    if (!cells.length) continue
    lines.push(`### ${st.ko} (${st.en}) — ${st.hint}`)
    lines.push('')
    for (const it of cells) {
      const lv = findLevel(it.level)
      const m = findMail(it.competency)
      lines.push(`**[${lv.ko} · ${m.ko}]** ${it.question}`)
      if (it.evidence) lines.push(`  - 응답 증거: ${it.evidence}`)
      if (it.scoreHint) lines.push(`  - 채점 힌트: ${it.scoreHint}`)
      lines.push('')
    }
  }

  lines.push('---')
  lines.push(
    `_KCBC Builder · 단계형 작성기 · ${new Date(s.updatedAt).toLocaleString('ko-KR')}_`,
  )
  return lines.join('\n')
}

/**
 * 단계형 항목을 기존 AssessmentDraft 양식(서·논술형)으로 변환.
 * - 평가화 단계 셀(저/중/고)을 우선 사용
 * - 비어 있으면 정교화 단계 셀로 대체
 * - 배점은 저:2 / 중:3 / 고:5 자동 분배 → totalScore 합산
 */
export function stagedToAssessmentDraft(
  s: StagedAssessment,
  baseNo: number,
): Omit<AssessmentDraft, 'id'> {
  const pick = (lv: ProficiencyLevel): StagedItem | undefined => {
    // 4국면 축소 이후: refine 셀만 사용. itemize는 legacy fallback.
    return (
      s.items.find((x) => x.stage === 'refine' && x.level === lv && x.question) ||
      s.items.find((x) => x.stage === 'itemize' && x.level === lv && x.question)
    )
  }
  const lowItem = pick('low')
  const midItem = pick('mid')
  const highItem = pick('high')
  const picked = [lowItem, midItem, highItem].filter(Boolean) as StagedItem[]

  const scoreByLevel: Record<ProficiencyLevel, number> = { low: 2, mid: 3, high: 5 }
  const sub: SubQuestion[] = picked.map((it) => ({
    text: it.question,
    score: scoreByLevel[it.level],
  }))
  const total = sub.reduce((a, b) => a + b.score, 0) || 8

  const rubric: RubricLevel[] = DEFAULT_RUBRIC.map((r) => {
    if (r.level === '상' && highItem)
      return { ...r, criteria: highItem.scoreHint || highItem.evidence || r.criteria }
    if (r.level === '중' && midItem)
      return { ...r, criteria: midItem.scoreHint || midItem.evidence || r.criteria }
    if (r.level === '하' && lowItem)
      return { ...r, criteria: lowItem.scoreHint || lowItem.evidence || r.criteria }
    return { ...r }
  })

  const now = Date.now()
  return {
    no: baseNo,
    type: picked.length > 1 ? '논술형' : '서술형',
    domain: s.subject || '기타',
    title: s.title || '단계형 변환 문항',
    prompt: s.importantQuestion
      ? `다음 자료를 읽고 ‘${s.importantQuestion}’에 대해 답하시오.`
      : '다음 자료를 읽고 물음에 답하시오.',
    totalScore: total,
    material: s.contextMaterial,
    materialLabel: s.title,
    source: '— 단계형 작성기에서 자동 변환 —',
    subQuestions: sub.length ? sub : [{ text: '', score: total }],
    rubric,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * 외부 OCR 채점 도구의 채점기록 한 건 텍스트를 파싱.
 * 사용자가 사이트에서 라벨+값을 통째로 복사 → 붙여넣은 텍스트를 받음.
 * 라벨: 첨부 파일, 학생 응답, 점수/등급, 채점 근거, 학생에게 전달할 피드백
 */
export function parseOcrRecord(raw: string): Partial<GradingRecord> {
  const out: Partial<GradingRecord> = {}
  const text = raw.replace(/\r/g, '').trim()
  if (!text) return out

  // 정규식 매처 — 라벨별로 다음 라벨 또는 끝까지 캡쳐
  const NEXT_LABEL = '(?=\\n(?:첨부 ?파일|학생 응답|점수\\s*\\/\\s*등급|점수\\/등급|채점 근거|학생에게 전달할 피드백|날짜|완료)|$)'
  const grab = (label: string): string | undefined => {
    const re = new RegExp(`${label}\\s*[:：]?\\s*\\n?([\\s\\S]*?)${NEXT_LABEL}`)
    const m = text.match(re)
    return m ? m[1].trim() : undefined
  }

  // 등급
  const gradeRaw = grab('점수\\s*\\/\\s*등급') || grab('점수\\/등급')
  if (gradeRaw) {
    const g = gradeRaw.split('\n')[0].trim()
    if (g.includes('잘함')) out.grade = '잘함'
    else if (g.includes('보통')) out.grade = '보통'
    else if (g.includes('노력')) out.grade = '노력 요함'
  }

  const attach = grab('첨부\\s*파일')
  if (attach) {
    // "0_a2944c12.pdf" 같은 파일명만 추출
    const m = attach.match(/[\w.\-]+\.(pdf|png|jpe?g|webp)/i)
    out.attachmentName = m ? m[0] : attach.split('\n')[0]
  }

  const ocr =
    grab('학생 응답\\s*\\([^)]*\\)') ||
    grab('학생 응답 펼쳐보기[^\\n]*') ||
    grab('학생 응답 접기[^\\n]*') ||
    grab('학생 응답')
  if (ocr) out.ocrText = ocr

  const rationale = grab('채점 근거')
  if (rationale) out.rationale = rationale

  const feedback = grab('학생에게 전달할 피드백')
  if (feedback) out.feedback = feedback

  // 날짜 라인 추출 (예: 2026. 6. 27. 오후 2:43:44)
  const dateMatch = text.match(/(20\d{2})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(오전|오후)?\s*(\d{1,2}):(\d{2}):?(\d{2})?/)
  if (dateMatch) {
    const [, y, mo, da, ampm, hh, mm, ss] = dateMatch
    let hour = Number(hh)
    if (ampm === '오후' && hour < 12) hour += 12
    if (ampm === '오전' && hour === 12) hour = 0
    const dt = new Date(
      Number(y), Number(mo) - 1, Number(da), hour, Number(mm), Number(ss ?? 0),
    )
    out.gradedAt = dt.getTime()
  }
  return out
}

/**
 * 평가 하나에 대한 학급 채점 리포트 (MD).
 * 등급 분포 + 학급 평균 + 학생별 채점 근거 + 피드백 종합.
 */
export function classReportToMarkdown(
  evaluationTitle: string,
  records: GradingRecord[],
): string {
  const lines: string[] = []
  lines.push(`# 학급 채점 리포트 — ${evaluationTitle}`)
  lines.push('')
  lines.push(
    `> 작성: ${new Date().toLocaleString('ko-KR')}　|　대상 ${records.length}명`,
  )
  lines.push('')

  // 등급 분포
  const counts = { '잘함': 0, '보통': 0, '노력 요함': 0 }
  records.forEach((r) => counts[r.grade]++)
  const total = records.length || 1
  const pct = (n: number) => Math.round((n / total) * 100)
  lines.push('## 📊 등급 분포')
  lines.push('')
  lines.push('| 등급 | 학생 수 | 비율 |')
  lines.push('|---|---|---|')
  lines.push(`| 잘함 | ${counts['잘함']} | ${pct(counts['잘함'])}% |`)
  lines.push(`| 보통 | ${counts['보통']} | ${pct(counts['보통'])}% |`)
  lines.push(`| 노력 요함 | ${counts['노력 요함']} | ${pct(counts['노력 요함'])}% |`)
  lines.push('')

  // 학급 평균 (잘함=3, 보통=2, 노력요함=1)
  const score =
    (counts['잘함'] * 3 + counts['보통'] * 2 + counts['노력 요함'] * 1) /
    Math.max(records.length, 1)
  lines.push(`**학급 평균 등급**: ${score.toFixed(2)} / 3.00`)
  lines.push('')

  // 학생별 상세
  lines.push('## 👥 학생별 채점 결과')
  lines.push('')
  records
    .slice()
    .sort((a, b) => a.studentLabel.localeCompare(b.studentLabel, 'ko-KR'))
    .forEach((r) => {
      lines.push(`### ${r.studentLabel} — ${r.grade}`)
      if (r.rationale) lines.push(`- **근거**: ${r.rationale}`)
      if (r.feedback) lines.push(`- **피드백**: ${r.feedback}`)
      lines.push('')
    })
  return lines.join('\n')
}

/* ============================================================
 *  교사용 모범답안 합성 (상·중·하 3단)
 *  - 셀의 evidence(응답 증거) + scoreHint(채점 힌트) + 자료를 합성
 *  - AI 호출 없이 결정성 100% — 같은 입력이면 같은 출력
 * ============================================================ */

export interface SampleAnswerBundle {
  /** 하위문항 인덱스 (0-based) */
  index: number
  /** 문항 원문 */
  question: string
  /** 배점 */
  score: number
  /** 상/중/하 모범답안 (등급별 다른 깊이) */
  tiers: {
    level: '상' | '중' | '하'
    text: string
    keyPoints: string[]      // 채점 시 확인할 핵심어
  }[]
}

/** 자료 본문에서 첫 의미 있는 줄 1개 (인용용) */
function firstMeaningfulLine(text: string): string {
  const lines = text
    .split(/[\n\r]+/)
    .map((l) => l.trim())
    .filter((l) => l && !/^[┌└│├─┤├]/.test(l) && !/^\(출처:/.test(l))
  return lines[0] || ''
}

/** 텍스트에서 짧은 인용 한 토막 추출 (40자 내외) */
function shortQuote(text: string, max = 40): string {
  if (!text) return ''
  const clean = text.replace(/['"‘’“”]/g, '').trim()
  if (clean.length <= max) return clean
  return clean.slice(0, max) + '…'
}

/** 단일 셀(StagedItem) 한 건에 대한 상/중/하 모범답안 합성 */
function buildTiersForCell(
  it: StagedItem,
  materialQuote: string,
): SampleAnswerBundle['tiers'] {
  const evidence = it.evidence?.trim() || ''
  const hint = it.scoreHint?.trim() || ''
  const baseKeys: string[] = []
  if (evidence) baseKeys.push(...evidence.split(/[,·、]/).map((s) => s.trim()).filter(Boolean).slice(0, 3))
  if (hint) baseKeys.push(...hint.split(/[,·、]/).map((s) => s.trim()).filter(Boolean).slice(0, 2))

  // 상 — evidence + scoreHint + 자료 인용
  const sang = [
    materialQuote ? `자료(${shortQuote(materialQuote)})를 근거로,` : '주어진 자료를 근거로,',
    evidence
      ? `${evidence}를 모두 제시하며`
      : '핵심 근거 두 가지 이상을 제시하며',
    hint ? `${hint}한다.` : '인과·비교·평가의 흐름으로 자기 입장을 정당화한다.',
  ].join(' ')

  // 중 — evidence 일부만, 자료 표면 언급
  const evidenceShort = evidence
    ? shortQuote(evidence.split(/[,·、]/)[0]?.trim() || evidence, 30)
    : ''
  const jung = [
    materialQuote ? `자료에서 ${shortQuote(materialQuote, 28)} 등을 언급하며,` : '자료의 일부를 언급하며,',
    evidenceShort ? `${evidenceShort}를 제시함.` : '핵심 근거를 일부 제시함.',
    '연결·정당화는 다소 미흡함.',
  ].join(' ')

  // 하 — 자료 표면 인용만
  const ha = materialQuote
    ? `자료의 ${shortQuote(materialQuote, 22)}만 단편적으로 옮겨 적음. 자기 해석·근거 연결은 드러나지 않음.`
    : '자료와 직접 연결되지 않는 답을 작성하거나 한두 단어로 답함.'

  const tiers: SampleAnswerBundle['tiers'] = [
    { level: '상', text: sang, keyPoints: baseKeys.length ? baseKeys : ['자료 인용', '근거 2개 이상', '인과·비교 흐름'] },
    { level: '중', text: jung, keyPoints: baseKeys.slice(0, 2).length ? baseKeys.slice(0, 2) : ['자료 일부 언급', '근거 1개'] },
    { level: '하', text: ha, keyPoints: ['자료 표면 인용', '근거 부족'] },
  ]
  return tiers
}

/**
 * 단계형 작성지 → 교사용 모범답안 묶음.
 * 정교화/평가화 단계의 채워진 셀 각각에 대해 상/중/하 답안 3종 자동 합성.
 */
export function buildSampleAnswers(s: StagedAssessment): SampleAnswerBundle[] {
  const materialQuote = firstMeaningfulLine(s.contextMaterial || '')

  // 우선순위: itemize 평가화 셀 → refine 정교화 셀, 수준 high → mid → low 순
  const levelOrder = (l: ProficiencyLevel) =>
    l === 'high' ? 0 : l === 'mid' ? 1 : 2

  const picked = s.items
    .filter((it) => (it.stage === 'refine' || it.stage === 'itemize') && it.question.trim())
    .sort((a, b) => {
      // refine 우선 (itemize는 legacy fallback)
      if (a.stage !== b.stage) return a.stage === 'refine' ? -1 : 1
      return levelOrder(a.level) - levelOrder(b.level)
    })

  const scoreFor = (lv: ProficiencyLevel) => (lv === 'high' ? 5 : lv === 'mid' ? 3 : 2)

  return picked.map((it, i) => ({
    index: i,
    question: it.question,
    score: scoreFor(it.level),
    tiers: buildTiersForCell(it, materialQuote),
  }))
}

/* ============================================================
 *  학생부 「교과학습발달상황」 기록 변환
 *  - 모델 책 ‘학생부 기록 방안’ (p.117~118) 핵심 산출물
 *  - 등급/점수 제거, 명사형/관형사형 종결, 인칭대명사 제거
 * ============================================================ */

export type RecordLength = 'short' | 'normal' | 'detail'
export type RecordTone = 'strength' | 'balanced'

export interface RecordOptions {
  length?: RecordLength       // 길이 (60자 / 150자 / 300자)
  tone?: RecordTone           // 어조 (강점 중심 / 균형)
  subject?: string            // 교과 (예: 사회)
  evaluationTitle?: string    // 평가 활동명
}

/** 학생부 양식 어휘 사전 — 등급별 시작·종결 어구 */
const STUDENT_RECORD_PHRASES = {
  '잘함': {
    open: [
      '평가 활동에서',
      '서·논술형 평가에서',
      '자료 기반 탐구 활동에서',
    ],
    midVerb: [
      '자료를 정확히 해석하여',
      '여러 자료를 통합·비교하여',
      '근거를 다각도로 들어',
    ],
    closeVerb: [
      '깊이 있게 서술함',
      '논리적으로 표현함',
      '구체적으로 설명함',
    ],
    strengthAdd: [
      '자료 활용 능력이 우수함',
      '사회 현상을 다각도로 파악하는 모습이 돋보임',
      '비판적·창의적 사고력이 잘 드러남',
    ],
    balancedAdd: [
      '근거 기반 서술 능력이 안정적임',
      '핵심 개념을 정확히 이해하고 적용함',
    ],
  },
  '보통': {
    open: [
      '평가 활동에서',
      '자료 기반 서·논술형 평가에서',
    ],
    midVerb: [
      '주요 자료를 해석하여',
      '제시된 근거를 활용하여',
    ],
    closeVerb: [
      '부분적으로 서술함',
      '핵심 내용을 제시함',
    ],
    strengthAdd: [
      '자료를 활용하려는 시도가 보이며 꾸준한 성장이 기대됨',
      '핵심 개념을 이해하고 표현하려는 노력이 관찰됨',
    ],
    balancedAdd: [
      '근거 제시 능력은 양호하나 다양한 자료 연결을 보완할 필요가 있음',
      '주요 개념 이해는 양호하며, 응용·통합 단계에 대한 추가 학습이 효과적임',
    ],
  },
  '노력 요함': {
    open: [
      '평가 활동에서',
      '서·논술형 평가에서',
    ],
    midVerb: [
      '자료에서 단편적 내용을',
      '주제와 관련된 일부 내용을',
    ],
    closeVerb: [
      '제시함',
      '서술함',
    ],
    strengthAdd: [
      '자기 생각을 표현하려는 시도가 있으며 단계적 지도를 통한 성장 가능성이 있음',
      '관심 영역에 대한 호기심이 드러나며 지속적 안내가 도움이 될 것으로 기대됨',
    ],
    balancedAdd: [
      '근거 연결과 자료 통합에 대한 단계적 지도가 필요함',
      '핵심 개념의 이해 정도를 점검하며 맞춤 학습이 도움이 될 것으로 기대됨',
    ],
  },
} as const

/** 채점 근거에서 학생이 한 행동/이해 키워드를 가볍게 추출 */
function extractActions(rationale: string): string {
  if (!rationale) return ''
  // 모든 등장 동사·명사 그대로 가져오기는 무리. 줄여서 가져옴.
  const clean = rationale
    .replace(/['"‘’“”]/g, '')
    .replace(/\([^)]*\)/g, '')
    .trim()
  if (clean.length <= 60) return clean
  return clean.slice(0, 60) + '…'
}

function pickIdx(arr: readonly string[], seed: number): string {
  return arr[seed % arr.length]
}

/* ============================================================
 *  씨앗 기반 학생부 초안 (Seed-Based Draft)
 *  - 결정성 위험(유사도·개성 소실·검수 생략)을 완전 제거
 *  - 학생별로 3-4개 키워드/구절 "씨앗"만 제공, 문장은 교사가 직접 씀
 *  - 각 학생의 실제 응답(rationale·feedback)에서 씨앗 추출 → 학생 개성 보존
 * ============================================================ */

export interface RecordSeed {
  gradeHint: string       // 등급 관점 힌트 (예: "자료 활용 우수")
  chips: string[]         // 이 학생의 응답에서 뽑은 키워드/구절 3~5개
  cautions: string[]      // 검수 시 주의사항
}

/** 채점기록 1건 → 씨앗 (문장 X, 조립 요소만) */
export function buildRecordSeed(r: GradingRecord): RecordSeed {
  const chips: string[] = []
  // 채점 근거에서 짧은 구절 추출 (콤마/중점/온점 기준 분리, 4~24자만)
  const source = [r.rationale, r.feedback].filter(Boolean).join(' · ')
  const parts = source
    .split(/[,·、\.。]/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 4 && s.length <= 24)
    .slice(0, 4)
  chips.push(...parts)
  // 등급 기본 관점
  const gradeHint =
    r.grade === '잘함'
      ? '자료 활용 우수 · 다각도 근거 · 인과·비교 흐름'
      : r.grade === '보통'
      ? '자료 부분 활용 · 근거 1~2개 · 연결·정당화 여지'
      : '자료 표면 인용 · 단편 응답 · 단계적 지도 필요'

  const cautions: string[] = [
    '학생 실명·인칭대명사 금지 (명사형 종결)',
    '등급·점수·랭킹 문구 금지',
    '문장 유사도 검사 대비 — 옆 학생과 동일 표현 금지',
  ]
  if (chips.length === 0) {
    cautions.unshift('채점 근거가 짧아 씨앗이 부족합니다. 학생 응답을 다시 살펴보세요.')
  }
  return { gradeHint, chips, cautions }
}

/**
 * 채점기록 1건 → 학생부 양식 문장 (템플릿 기반, AI 호출 없음).
 * @deprecated 결정성 위험으로 씨앗 방식(buildRecordSeed)으로 대체됨. 하위 호환 유지.
 */
export function gradingRecordToStudentRecord(
  r: GradingRecord,
  opts: RecordOptions = {},
): string {
  const phrases = STUDENT_RECORD_PHRASES[r.grade]
  if (!phrases) return ''
  const length = opts.length ?? 'normal'
  const tone = opts.tone ?? 'balanced'
  const seed = Array.from(r.id).reduce((s, c) => s + c.charCodeAt(0), 0)

  const open = pickIdx(phrases.open, seed)
  const mid = pickIdx(phrases.midVerb, seed + 1)
  const close = pickIdx(phrases.closeVerb, seed + 2)
  const add = pickIdx(
    tone === 'strength' ? phrases.strengthAdd : phrases.balancedAdd,
    seed + 3,
  )

  // 메인 문장
  const actions = extractActions(r.rationale)
  const main = actions
    ? `${open} ${actions}를 바탕으로 ${mid} ${close}.`
    : `${open} ${mid} ${close}.`

  if (length === 'short') {
    // 60자 내외 — main만
    return main
  }
  if (length === 'detail') {
    // 300자 — main + add + 평가/활동명 + 피드백 일부
    const subj = opts.subject ? `[${opts.subject}] ` : ''
    const ctx = opts.evaluationTitle
      ? `‘${opts.evaluationTitle}’ 주제의 `
      : ''
    const fb = r.feedback ? ` ${r.feedback.replace(/[~.]$/, '')}으로 발전 가능성이 큼.` : ''
    return `${subj}${ctx}${main} ${add}.${fb}`.trim()
  }
  // normal 150자
  return `${main} ${add}.`
}

/** 학급 씨앗 일괄 MD — 문장 완성 없이 각 학생 씨앗 + 빈 작성란만 */
export function classSeedsMd(
  evaluationTitle: string,
  records: GradingRecord[],
  manualByStudent: Record<string, { manual: string; done: boolean; note?: string }>,
): string {
  const lines: string[] = []
  lines.push(`# 학생부 「교과학습발달상황」 씨앗 + 교사 초안 — ${evaluationTitle}`)
  lines.push('')
  lines.push(
    `> 작성: ${new Date().toLocaleString('ko-KR')}　|　대상 ${records.length}명`,
  )
  lines.push('')
  lines.push(
    '> ⚠ **이 도구는 완성 문장을 만들지 않습니다.** 씨앗(키워드)만 제공하며, 학생부 문장은 교사가 직접 작성합니다.',
  )
  lines.push(
    '> 이유: 자동 문장 생성은 학급 학생 간 유사도가 높아 개성 손실·NEIS 유사도 검사 위험이 있습니다.',
  )
  lines.push('')
  const sorted = records
    .slice()
    .sort((a, b) => a.studentLabel.localeCompare(b.studentLabel, 'ko-KR'))
  const notDone = sorted.filter((r) => !manualByStudent[r.id]?.done)
  if (notDone.length > 0) {
    lines.push(`⚠ **미완료 ${notDone.length}명**: ${notDone.map((r) => r.studentLabel).join(', ')}`)
    lines.push('')
  }
  sorted.forEach((r) => {
    const seed = buildRecordSeed(r)
    const draft = manualByStudent[r.id]
    lines.push(`### ${r.studentLabel} ${draft?.done ? '✅' : '☐'}`)
    lines.push(`- 등급 관점 씨앗: ${seed.gradeHint}`)
    if (seed.chips.length) {
      lines.push(`- 응답 씨앗: ${seed.chips.map((c) => `\`${c}\``).join(' · ')}`)
    }
    lines.push('')
    lines.push(`**교사 초안**: ${draft?.manual || '_(미작성)_'}`)
    if (draft?.note) lines.push(`**이 학생의 특징**: ${draft.note}`)
    lines.push('')
  })
  return lines.join('\n')
}

/** @deprecated 씨앗 방식(classSeedsMd)으로 대체. 하위 호환 유지. */
export function classToStudentRecordsMd(
  evaluationTitle: string,
  records: GradingRecord[],
  opts: RecordOptions = {},
): string {
  const lines: string[] = []
  lines.push(`# 학생부 「교과학습발달상황」 기록 초안 — ${evaluationTitle}`)
  lines.push('')
  lines.push(
    `> 작성: ${new Date().toLocaleString('ko-KR')}　|　대상 ${records.length}명　|　길이: ${
      opts.length === 'short' ? '짧음' : opts.length === 'detail' ? '자세히' : '보통'
    }　|　어조: ${opts.tone === 'strength' ? '강점 중심' : '균형'}`,
  )
  lines.push('')
  lines.push(
    '> ⚠ 학생부 양식 자동 초안입니다. **최종 검수·수정 후 NEIS에 입력**하세요.',
  )
  lines.push('')
  records
    .slice()
    .sort((a, b) => a.studentLabel.localeCompare(b.studentLabel, 'ko-KR'))
    .forEach((r) => {
      lines.push(`### ${r.studentLabel}`)
      lines.push(gradingRecordToStudentRecord(r, { ...opts, evaluationTitle }))
      lines.push('')
    })
  return lines.join('\n')
}

export function gradingRecordToMarkdown(r: GradingRecord): string {
  const lines: string[] = []
  lines.push(`## 📝 채점 기록 — ${r.studentLabel}`)
  lines.push('')
  lines.push(`> **평가**: ${r.evaluationTitle}　|　**등급**: ${r.grade}`)
  if (r.attachmentName) lines.push(`> **첨부**: ${r.attachmentName}`)
  if (r.gradedAt)
    lines.push(`> **채점**: ${new Date(r.gradedAt).toLocaleString('ko-KR')}`)
  lines.push('')
  lines.push('### 학생 응답 (OCR)')
  lines.push('```')
  lines.push(r.ocrText || '(없음)')
  lines.push('```')
  lines.push('')
  lines.push('### 채점 근거')
  lines.push(r.rationale || '(없음)')
  lines.push('')
  lines.push('### 학생에게 전달할 피드백')
  lines.push(`> ${r.feedback || '(없음)'}`)
  return lines.join('\n')
}

export function download(filename: string, text: string, mime = 'text/plain') {
  const blob = new Blob([text], { type: mime + ';charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

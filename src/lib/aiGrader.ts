/* ============================================================
 *  AI 채점 토큰 가시화
 *  - Anthropic Messages API + OpenAI Chat Completions API
 *  - 브라우저에서 직접 호출 (교사 개인 사용 가정, 키는 로컬에만)
 *  - 토큰 단가는 모델별 등록 → KRW 환산 표시
 *  - OECD DEO 2026 "AI 과의존" 경고에 대응하는 메타인지 가시화
 * ============================================================ */

export type Provider = 'anthropic' | 'openai'

export interface ModelSpec {
  provider: Provider
  id: string
  label: string
  /** USD per 1M input tokens */
  inUsd: number
  /** USD per 1M output tokens */
  outUsd: number
  /** Short note shown in UI */
  note?: string
}

export const MODEL_REGISTRY: ModelSpec[] = [
  {
    provider: 'anthropic',
    id: 'claude-haiku-4-5-20251001',
    label: 'Claude Haiku 4.5',
    inUsd: 1.0,
    outUsd: 5.0,
    note: '가장 저렴 · 채점 기본 추천',
  },
  {
    provider: 'anthropic',
    id: 'claude-sonnet-4-6',
    label: 'Claude Sonnet 4.6',
    inUsd: 3.0,
    outUsd: 15.0,
    note: '균형형 · 논술형 채점 추천',
  },
  {
    provider: 'anthropic',
    id: 'claude-opus-4-8',
    label: 'Claude Opus 4.8',
    inUsd: 15.0,
    outUsd: 75.0,
    note: '최고 품질 · 비싸므로 신중히',
  },
  {
    provider: 'openai',
    id: 'gpt-4o-mini',
    label: 'GPT-4o mini',
    inUsd: 0.15,
    outUsd: 0.60,
    note: 'OpenAI 최저가',
  },
  {
    provider: 'openai',
    id: 'gpt-4o',
    label: 'GPT-4o',
    inUsd: 2.5,
    outUsd: 10.0,
    note: 'OpenAI 균형형',
  },
]

export interface AiSettings {
  provider: Provider
  modelId: string
  anthropicKey: string
  openaiKey: string
  /** 1 USD → KRW (수동 입력, 매일 환율 변동) */
  krwPerUsd: number
  /** 세션 누적 비용 (USD) — 페이지 새로고침 시 0으로 */
  sessionSpentUsd: number
  /** 통산 누적 비용 (USD) — localStorage 유지 */
  totalSpentUsd: number
  /** 키를 localStorage에 저장할지 (false면 sessionStorage) */
  persistKey: boolean
  /**
   * 성장 기록(구 토큰 경제) 사용 여부 — 기본 OFF.
   * Overjustification Effect(Lepper 1973) 리스크로 인해 교사가 명시적으로 켜야 함.
   */
  enableGrowthLog: boolean
}

const SETTINGS_KEY = 'kcbc:ai-settings'

const DEFAULTS: AiSettings = {
  provider: 'anthropic',
  modelId: 'claude-haiku-4-5-20251001',
  anthropicKey: '',
  openaiKey: '',
  krwPerUsd: 1400,
  sessionSpentUsd: 0,
  totalSpentUsd: 0,
  persistKey: false,
  enableGrowthLog: false,
}

export function loadSettings(): AiSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw) as Partial<AiSettings>
    // Keys may live in sessionStorage if persistKey=false
    const sessionAnth = sessionStorage.getItem('kcbc:ai-key-anthropic') || ''
    const sessionOai = sessionStorage.getItem('kcbc:ai-key-openai') || ''
    return {
      ...DEFAULTS,
      ...parsed,
      anthropicKey: parsed.anthropicKey || sessionAnth,
      openaiKey: parsed.openaiKey || sessionOai,
      sessionSpentUsd: 0, // always reset on page load
    }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveSettings(s: AiSettings): void {
  if (s.persistKey) {
    // Persist everything to localStorage
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
    sessionStorage.removeItem('kcbc:ai-key-anthropic')
    sessionStorage.removeItem('kcbc:ai-key-openai')
  } else {
    // Strip keys from localStorage, mirror to sessionStorage
    const { anthropicKey, openaiKey, ...rest } = s
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ ...rest, anthropicKey: '', openaiKey: '' }),
    )
    if (anthropicKey) sessionStorage.setItem('kcbc:ai-key-anthropic', anthropicKey)
    else sessionStorage.removeItem('kcbc:ai-key-anthropic')
    if (openaiKey) sessionStorage.setItem('kcbc:ai-key-openai', openaiKey)
    else sessionStorage.removeItem('kcbc:ai-key-openai')
  }
}

export function findModel(id: string): ModelSpec | undefined {
  return MODEL_REGISTRY.find((m) => m.id === id)
}

export function costUsd(model: ModelSpec, inTok: number, outTok: number): number {
  return (inTok / 1_000_000) * model.inUsd + (outTok / 1_000_000) * model.outUsd
}

export function formatUsd(usd: number): string {
  if (usd >= 1) return `$${usd.toFixed(3)}`
  if (usd >= 0.01) return `$${usd.toFixed(4)}`
  return `$${usd.toFixed(6)}`
}

export function formatKrw(krw: number): string {
  if (krw >= 100) return `₩${Math.round(krw).toLocaleString('ko-KR')}`
  if (krw >= 1) return `₩${krw.toFixed(1)}`
  return `₩${krw.toFixed(2)}`
}

/* ============================================================
 *  채점 요청
 * ============================================================ */

export interface GradeRequest {
  questionPrompt: string         // 문항 도입 지시문
  subQuestions: { text: string; score: number }[]
  rubric: { level: string; criteria: string; score: string }[]
  studentAnswer: string
  totalScore: number
  materialText?: string          // 자료 박스 본문 (있으면 포함)
}

export interface GradeResult {
  text: string                   // AI가 작성한 평가 텍스트
  inTokens: number
  outTokens: number
  usd: number
  krw: number
  model: ModelSpec
  elapsedMs: number
}

function buildSystem(): string {
  return [
    '당신은 초등학교 사회·국어 서·논술형 평가를 채점하는 베테랑 교사입니다.',
    '학생의 사고 과정과 자료 활용 근거를 우선하여 평가합니다.',
    '엄격하되 학생의 작은 시도도 인정하는 균형 잡힌 채점자입니다.',
    '답변은 반드시 한국어로 작성하며, 학생이 읽고 다시 도전할 수 있도록 따뜻하지만 구체적인 피드백을 줍니다.',
  ].join(' ')
}

function buildUserPrompt(r: GradeRequest): string {
  const parts: string[] = []
  parts.push('## 문항 도입 지시문')
  parts.push(r.questionPrompt || '(없음)')
  if (r.materialText) {
    parts.push('')
    parts.push('## 자료')
    parts.push('```')
    parts.push(r.materialText.trim())
    parts.push('```')
  }
  parts.push('')
  parts.push(`## 하위 문항 (총 ${r.totalScore}점)`)
  r.subQuestions.forEach((sq, i) =>
    parts.push(`(${i + 1}) ${sq.text} **(${sq.score}점)**`),
  )
  parts.push('')
  parts.push('## 채점 기준 (루브릭)')
  r.rubric.forEach((r) =>
    parts.push(`- **${r.level}**: ${r.criteria} (${r.score})`),
  )
  parts.push('')
  parts.push('## 학생 답안')
  parts.push(r.studentAnswer || '(빈 답안)')
  parts.push('')
  parts.push('---')
  parts.push('다음 순서로 채점 결과를 작성하시오.')
  parts.push('')
  parts.push('### 1. 루브릭 단계')
  parts.push('상 / 중 / 하 / 미응답 중 어디에 해당하는지 + 한 줄 근거')
  parts.push('')
  parts.push('### 2. 점수')
  parts.push(`총 ${r.totalScore}점 중 몇 점을 부여할지 (정수)`)
  parts.push('')
  parts.push('### 3. 잘된 점')
  parts.push('1-2개, 자료의 어느 부분을 잘 활용했는지 구체적으로')
  parts.push('')
  parts.push('### 4. 보완할 점')
  parts.push('1-2개, 학생이 다음에 시도할 수 있는 구체적 행동')
  parts.push('')
  parts.push('### 5. 모범 답안 힌트')
  parts.push('학생이 다시 쓴다면 어떤 한 문장을 추가/수정하면 좋을지')
  return parts.join('\n')
}

async function callAnthropic(
  model: ModelSpec,
  apiKey: string,
  system: string,
  user: string,
): Promise<{ text: string; inTok: number; outTok: number }> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: model.id,
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Anthropic ${res.status}: ${errText.slice(0, 200)}`)
  }
  const data = await res.json()
  const text = (data.content || [])
    .filter((b: { type: string }) => b.type === 'text')
    .map((b: { text: string }) => b.text)
    .join('\n')
  return {
    text,
    inTok: data.usage?.input_tokens ?? 0,
    outTok: data.usage?.output_tokens ?? 0,
  }
}

async function callOpenAI(
  model: ModelSpec,
  apiKey: string,
  system: string,
  user: string,
): Promise<{ text: string; inTok: number; outTok: number }> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model.id,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: 1024,
    }),
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`OpenAI ${res.status}: ${errText.slice(0, 200)}`)
  }
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content ?? ''
  return {
    text,
    inTok: data.usage?.prompt_tokens ?? 0,
    outTok: data.usage?.completion_tokens ?? 0,
  }
}

export async function grade(
  req: GradeRequest,
  settings: AiSettings,
): Promise<GradeResult> {
  const model = findModel(settings.modelId)
  if (!model) throw new Error('모델을 찾을 수 없습니다.')
  const key =
    model.provider === 'anthropic' ? settings.anthropicKey : settings.openaiKey
  if (!key) throw new Error(`${model.provider} API 키가 설정되지 않았습니다.`)

  const system = buildSystem()
  const user = buildUserPrompt(req)
  const t0 = Date.now()
  const result =
    model.provider === 'anthropic'
      ? await callAnthropic(model, key, system, user)
      : await callOpenAI(model, key, system, user)
  const elapsed = Date.now() - t0

  const usd = costUsd(model, result.inTok, result.outTok)
  const krw = usd * settings.krwPerUsd

  return {
    text: result.text,
    inTokens: result.inTok,
    outTokens: result.outTok,
    usd,
    krw,
    model,
    elapsedMs: elapsed,
  }
}

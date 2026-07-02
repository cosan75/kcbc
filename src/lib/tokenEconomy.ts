/* ============================================================
 *  학생 토큰 경제 (Token Economy)
 *  - 행동주의 강화(Ayllon & Azrin, 1968) + 현대 EdTech(ClassDojo·
 *    ClassPoint) 패턴을 KCBC AI 채점에 차용
 *  - 5원칙: 즉시 강화 · 명확한 규칙 · 누적 가시화 · 학생별 추적 ·
 *    목표 시각화
 * ============================================================ */
import type { KrGrade } from '../domain'

export interface TokenTier {
  grade: KrGrade
  tokens: number
  emoji: string
  label: string
  color: 'green' | 'amber' | 'rose'
}

/** 등급 → 토큰 환산 (기본값) */
export const TOKEN_TIERS: TokenTier[] = [
  { grade: '잘함',      tokens: 3, emoji: '🌟', label: '잘함',      color: 'green' },
  { grade: '보통',      tokens: 2, emoji: '⭐', label: '보통',      color: 'amber' },
  { grade: '노력 요함', tokens: 1, emoji: '✨', label: '노력 요함', color: 'rose'  },
]

export function tierFor(grade: KrGrade): TokenTier {
  return TOKEN_TIERS.find((t) => t.grade === grade) ?? TOKEN_TIERS[2]
}

/** AI 채점 응답 텍스트에서 등급 자동 파싱 */
export function parseGradeFromText(text: string): KrGrade | null {
  if (!text) return null
  // "1. 루브릭 단계" 직후의 텍스트에서 우선 탐색
  const firstBlock = text.split(/###\s*[1-9]\./)[1] || text
  // 가장 먼저 등장하는 키워드 우선
  const candidates: Array<[RegExp, KrGrade]> = [
    [/\b잘함\b/, '잘함'],
    [/\b보통\b/, '보통'],
    [/\b노력\s*요함\b/, '노력 요함'],
    [/\b상\b/, '잘함'],
    [/\b중\b/, '보통'],
    [/\b하\b/, '노력 요함'],
  ]
  let bestIdx = Infinity
  let bestGrade: KrGrade | null = null
  for (const [re, g] of candidates) {
    const m = firstBlock.search(re)
    if (m !== -1 && m < bestIdx) {
      bestIdx = m
      bestGrade = g
    }
  }
  return bestGrade
}

/* ── 학생별 누적 ledger (localStorage) ── */

export interface StudentTokenEntry {
  ts: number
  grade: KrGrade
  tokens: number
  /** 평가 제목·문항·노트 등 출처 (선택) */
  note?: string
}

export interface StudentTokenAccount {
  studentLabel: string
  total: number
  history: StudentTokenEntry[]
  updatedAt: number
}

const LEDGER_KEY = 'kcbc:student-token-ledger'

export function loadLedger(): Record<string, StudentTokenAccount> {
  try {
    const raw = localStorage.getItem(LEDGER_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveLedger(ledger: Record<string, StudentTokenAccount>): void {
  localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger))
}

export function awardTokens(
  studentLabel: string,
  grade: KrGrade,
  note?: string,
): StudentTokenAccount {
  const key = studentLabel.trim() || '익명'
  const tier = tierFor(grade)
  const ledger = loadLedger()
  const now = Date.now()
  const acc: StudentTokenAccount = ledger[key] ?? {
    studentLabel: key,
    total: 0,
    history: [],
    updatedAt: now,
  }
  acc.total += tier.tokens
  acc.history.unshift({ ts: now, grade, tokens: tier.tokens, note })
  acc.updatedAt = now
  ledger[key] = acc
  saveLedger(ledger)
  return acc
}

export function getAccount(studentLabel: string): StudentTokenAccount | null {
  const ledger = loadLedger()
  return ledger[studentLabel.trim() || '익명'] ?? null
}

export function listAccounts(): StudentTokenAccount[] {
  return Object.values(loadLedger()).sort((a, b) => b.total - a.total)
}

export function resetLedger(): void {
  localStorage.removeItem(LEDGER_KEY)
}

/* ── 보상 목표 (Reward Goals) — 현장 운영용 기본값, 교사 편집 가능 ── */

export interface RewardGoal {
  threshold: number
  emoji: string
  label: string
}

const GOALS_KEY = 'kcbc:token-goals'

/**
 * 기본 보상 목표는 비워둡니다.
 * 교사가 직접 정의하도록 유도 (부담을 늘려 "정말 필요한가?"를 판단하게 함).
 */
export const DEFAULT_REWARD_GOALS: RewardGoal[] = []

export function loadGoals(): RewardGoal[] {
  try {
    const raw = localStorage.getItem(GOALS_KEY)
    return raw ? JSON.parse(raw) : DEFAULT_REWARD_GOALS
  } catch {
    return DEFAULT_REWARD_GOALS
  }
}

export function saveGoals(goals: RewardGoal[]): void {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals))
}

/** 다음 도달 가능 보상 — 누적 토큰을 받아 다음 목표 + 남은 토큰 반환 */
export function nextRewardOf(total: number): {
  next: RewardGoal | null
  remaining: number
  achieved: RewardGoal[]
} {
  const goals = loadGoals().slice().sort((a, b) => a.threshold - b.threshold)
  const achieved = goals.filter((g) => total >= g.threshold)
  const next = goals.find((g) => total < g.threshold) ?? null
  const remaining = next ? next.threshold - total : 0
  return { next, remaining, achieved }
}

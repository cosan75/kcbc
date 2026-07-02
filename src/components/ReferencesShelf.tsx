/**
 * 📚 참고 자료 선반 (References Shelf)
 *
 * 두 모드 지원:
 *  - compact: 대시보드 상단 접이식 안에서 상위 3개만 노출 + "자료실 전체 보기 →"
 *  - full   : 자료실 탭 전체 페이지 — 카테고리 필터 + 검색
 *
 * 새 자료 추가: 아래 REFS 배열에 한 항목 추가하면 두 모드에 자동 반영.
 */
import { useMemo, useState } from 'react'
import type { View } from './Nav'
import { asset } from '../lib/asset'

type Category =
  | 'worksheet'    // 인쇄용 워크시트
  | 'dashboard'    // 종합 대시보드
  | 'cardnews'     // 카드뉴스/슬라이드
  | 'philosophy'   // 학교·정책 철학
  | 'framework'    // 프레임워크·도구
  | 'lessonplan'   // 예시 지도안

interface RefItem {
  id: string
  emoji: string
  title: string
  subtitle: string
  desc: string
  href: string
  tag: string
  color: 'blue' | 'teal' | 'amber' | 'violet' | 'rose'
  category: Category
  printable?: boolean
}

const CATEGORIES: { key: Category | 'all'; label: string; emoji: string }[] = [
  { key: 'all',        label: '전체',      emoji: '✦' },
  { key: 'worksheet',  label: '워크시트',   emoji: '📝' },
  { key: 'framework',  label: '프레임워크', emoji: '📋' },
  { key: 'dashboard',  label: '대시보드',   emoji: '📊' },
  { key: 'cardnews',   label: '카드뉴스',   emoji: '📰' },
  { key: 'philosophy', label: '철학',       emoji: '🧭' },
  { key: 'lessonplan', label: '지도안',     emoji: '🎓' },
]

const REFS: RefItem[] = [
  {
    id: 'question-focus',
    emoji: '📝',
    title: '질문 초점 실습 워크시트',
    subtitle: '6기준 자기점검 + 단계별 설계 + 성찰',
    desc:
      '토론·전이·계속·확장·개방·고차사고 6기준으로 질문 초점을 설계하고 자기 점검하는 A4 인쇄용 워크시트. 단계형 작성기의 "중요한 질문" 필드와 직접 연결됩니다.',
    href: '/question-focus-worksheet.html',
    tag: '2026 초등 선도교원 연수',
    color: 'blue',
    category: 'worksheet',
    printable: true,
  },
  {
    id: 'grasps',
    emoji: '📋',
    title: 'GRASPS 6요소 실제적 평가 설계',
    subtitle: 'McTighe & Wiggins · UbD 프레임워크',
    desc:
      'Goal·Role·Audience·Situation·Product·Standards 6요소로 수행 과제를 실제 맥락에 배치하는 워크시트. 수업안 빌더 평가 섹션에서 6필드로 직접 채울 수도 있습니다.',
    href: '/grasps-worksheet.html',
    tag: 'UbD · 개념 전이 측정',
    color: 'teal',
    category: 'framework',
    printable: true,
  },
  {
    id: 'concept-inquiry',
    emoji: '🔍',
    title: '개념기반 탐구수업',
    subtitle: 'KCBC 본질 · 사실 → 개념 → 전이 3단계',
    desc:
      '빅아이디어 중심 설계로 사실적 이해 → 개념적 이해 → 전이적 적용에 이르는 탐구수업의 전 과정. 수업안 빌더 · 단계형 매트릭스와 직접 대응됩니다.',
    href: '/references/concept-inquiry-index.html',
    tag: '개념기반 · KCBC 본질',
    color: 'teal',
    category: 'framework',
  },
  {
    id: 'essay-dash-v3',
    emoji: '📊',
    title: '서·논술형 평가 대시보드 v3',
    subtitle: '평가 전 과정 종합 참조',
    desc:
      '서·논술형 평가 문항 설계부터 채점·피드백·학생부 기록까지 한 화면에 정리된 종합 대시보드. KCBC의 매트릭스·AI 채점·학생부 생성기와 함께 참고 자료로 활용하세요.',
    href: '/essay-assessment-dashboard-v3.html',
    tag: '평가 사이클 종합',
    color: 'violet',
    category: 'dashboard',
  },
  {
    id: 'ai-tools-hub',
    emoji: '🧰',
    title: '과정중심 수행평가 AI 도구 모음 5종',
    subtitle: '루브릭 · 학습 경로 · 피드백 · 포트폴리오 · 패러다임',
    desc:
      '① 총괄·형성평가 루브릭 ② 수준별·이질 집단 학습 경로 ③ AI 피드백 엔진 ④ 이수 확인 & 포트폴리오 ⑤ 교육 패러다임 전환. 인덱스 페이지에서 5개 도구로 이동.',
    href: '/references/index.html',
    tag: '과정중심 수행평가',
    color: 'teal',
    category: 'dashboard',
  },
  {
    id: 'rubric-cardnews',
    emoji: '📰',
    title: '총괄·형성평가 루브릭 카드뉴스',
    subtitle: '루브릭 개념·설계·활용을 한눈에',
    desc:
      '루브릭이 무엇이고 왜 필요한지, 어떻게 설계하고 활용하는지를 슬라이드형 카드뉴스로 정리. 연수 자료·수업 소개용으로 즉시 사용 가능.',
    href: '/references/rubric_cardnews.html',
    tag: '루브릭 카드뉴스',
    color: 'amber',
    category: 'cardnews',
  },
  {
    id: 'philosophy-compass',
    emoji: '🧭',
    title: '교수학습 방향의 철학적 나침반',
    subtitle: 'STAR 광석교육 · 2022 개정 · 4대 방향(N/W/E/S)',
    desc:
      '역량·주도성을 중심에 두고 깊이 있는 학습(N) · 학생 참여형(W) · 학생 맞춤형(E) · 자기주도형(S) 4방향으로 수렴하는 교수학습 철학. 학교 단위 정체성 문서.',
    href: '/references/philosophy-compass.html',
    tag: '광석초 · 학교 철학',
    color: 'violet',
    category: 'philosophy',
  },
  {
    id: 'socraai-lesson-plan',
    emoji: '🎓',
    title: 'AI와 함께하는 비판적 미디어 탐구',
    subtitle: '실제 수업 지도안 예시',
    desc:
      '비판적 미디어 탐구를 AI 도구와 함께 진행하는 실제 수업 지도안. 수업안 빌더에서도 링크로 접근 가능합니다.',
    href: '/socraai-lesson-plan.html',
    tag: '수업 지도안 예시',
    color: 'blue',
    category: 'lessonplan',
  },
]

interface Props {
  /** compact: 대시보드용 (상위 3개 + 링크) / full: 자료실 탭 전용 (필터 + 검색) */
  mode?: 'compact' | 'full'
  onNavigate?: (v: View) => void
}

export default function ReferencesShelf({ mode = 'compact', onNavigate }: Props) {
  const [filter, setFilter] = useState<Category | 'all'>('all')
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    if (mode === 'compact') return REFS.slice(0, 3)
    let list = REFS
    if (filter !== 'all') list = list.filter((r) => r.category === filter)
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.subtitle.toLowerCase().includes(q) ||
          r.desc.toLowerCase().includes(q) ||
          r.tag.toLowerCase().includes(q),
      )
    }
    return list
  }, [mode, filter, query])

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: REFS.length }
    REFS.forEach((r) => { m[r.category] = (m[r.category] || 0) + 1 })
    return m
  }, [])

  return (
    <section className="refs">
      <header className="refs__head">
        <div>
          <h2 className="refs__title">
            📚 참고 자료
            <span className="refs__sub">
              {mode === 'compact'
                ? `상위 3종 · 전체 ${REFS.length}종은 자료실 탭에서`
                : `${visible.length}/${REFS.length}종 · 새 탭에서 열림`}
            </span>
          </h2>
          {mode === 'full' && (
            <p className="refs__hint">
              KCBC 도구와 함께 쓰는 <strong>워크시트 · 프레임워크 · 대시보드 · 카드뉴스 · 철학 · 지도안</strong>. 카테고리로 필터하거나 검색해 사용하세요.
            </p>
          )}
        </div>
        {mode === 'compact' && onNavigate && (
          <button
            className="btn btn--sm btn--primary"
            onClick={() => onNavigate('references')}
          >
            📚 자료실 전체 보기 →
          </button>
        )}
      </header>

      {mode === 'full' && (
        <>
          <div className="refs__toolbar">
            <input
              type="search"
              className="search"
              placeholder="제목·설명·태그로 검색…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="refs__filter">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  className={
                    filter === c.key ? 'refs__cat is-on' : 'refs__cat'
                  }
                  onClick={() => setFilter(c.key)}
                >
                  <span>{c.emoji}</span>
                  <span>{c.label}</span>
                  <span className="refs__catcount">{counts[c.key] ?? 0}</span>
                </button>
              ))}
            </div>
          </div>
          {visible.length === 0 && (
            <div className="empty-state">
              <div className="empty-state__icon">📭</div>
              <h3>검색 결과 없음</h3>
              <p>다른 카테고리나 키워드로 시도해 보세요.</p>
            </div>
          )}
        </>
      )}

      <div className="refs__grid">
        {visible.map((r) => (
          <a
            key={r.id}
            href={asset(r.href)}
            target="_blank"
            rel="noreferrer"
            className={`refs__card refs__card--${r.color}`}
          >
            <div className="refs__cardHead">
              <span className="refs__emoji">{r.emoji}</span>
              {r.printable && <span className="refs__badge">A4 인쇄용</span>}
            </div>
            <h3 className="refs__cardTitle">{r.title}</h3>
            <p className="refs__cardSub">{r.subtitle}</p>
            <p className="refs__cardDesc">{r.desc}</p>
            <div className="refs__cardFoot">
              <span className="refs__tag">{r.tag}</span>
              <span className="refs__go">열기 →</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}

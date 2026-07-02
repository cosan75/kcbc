export type View =
  | 'dashboard'
  | 'lesson'
  | 'generalize'
  | 'assess'
  | 'staged'
  | 'techniques'
  | 'references'
  | 'gallery'

interface Props {
  view: View
  onChange: (v: View) => void
}

const TABS: { key: View; label: string; icon: string; hint: string }[] = [
  { key: 'dashboard',  label: '대시보드',          icon: '📊', hint: 'KCBC 한눈에 보기' },
  { key: 'staged',     label: '단계형 작성기',     icon: '🧭', hint: '핵심 도구 — 질문 4국면 × PISA 숙련도 매트릭스' },
  { key: 'techniques', label: '기법 라이브러리',   icon: '💡', hint: '창의 사고·질문 기법 18개 — 클릭으로 셀에 시드' },
  { key: 'lesson',     label: '수업안',            icon: '📝', hint: '개념 기반 수업안 + 일반화 진술문 통합' },
  { key: 'references', label: '자료실',            icon: '📚', hint: '워크시트·프레임워크·대시보드·카드뉴스·철학 통합 자료실' },
  { key: 'gallery',    label: '갤러리',            icon: '🗂',  hint: '저장한 작업 · 채점 대시보드 · 학생부 · 평가문항 편집' },
]

export default function Nav({ view, onChange }: Props) {
  return (
    <nav className="nav">
      <div className="nav__brand">
        <span className="nav__logo">KCBC</span>
        <span className="nav__sub">Builder Studio</span>
        <span
          className="nav__topframe"
          title="이화여대 산학협력단 「질문하는 학교」 → 질문 배우기 영역의 도구"
        >
          🏛 질문하는 학교 · 질문 배우기
        </span>
      </div>
      <div className="nav__tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`nav__tab ${view === t.key ? 'is-active' : ''}`}
            onClick={() => onChange(t.key)}
            title={t.hint}
          >
            <span className="nav__icon">{t.icon}</span>
            <span className="nav__label">{t.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}

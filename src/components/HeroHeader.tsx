import type { ChecklistMode } from '../lib/checklistStore'

interface Props {
  storeMode: ChecklistMode
}

export default function HeroHeader({ storeMode }: Props) {
  const label =
    storeMode === 'sheets'
      ? 'Google Sheets 연동 활성'
      : storeMode === 'local-fallback'
      ? 'localStorage (Sheets 미연결 폴백)'
      : 'localStorage (오프라인)'
  return (
    <header className="hero">
      <div className="eyebrow">KCBC · Korean Concept-Based Curriculum</div>
      <h1>개념 기반 수업설계 대시보드</h1>
      <p>
        2022 개정 교육과정의 <strong>깊이 있는 학습</strong>을 실현하기 위한
        KCBC 수업설계 틀과 7단계 탐구 과정, 그리고 사회과 서·논술형 평가 문항을
        한 화면에서 점검합니다.
      </p>
      <div className="meta">
        <span>📁 kcbc/CLAUDE.md</span>
        <span>📝 kcbc/스킬.md</span>
        <span>⚛️ React + Vite</span>
      </div>
      <div className="mode">🔗 체크리스트 저장: {label}</div>
    </header>
  )
}

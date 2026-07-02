import { useMemo } from 'react'
import { loadKCBCData } from '../lib/data'
import { createChecklistStore } from '../lib/checklistStore'
import type { View } from './Nav'

import HeroHeader from './HeroHeader'
import QSchoolFrame from './QSchoolFrame'
import CardNews from './CardNews'
import AgentsRoles from './AgentsRoles'
import ReferencesShelf from './ReferencesShelf'
import KpiStrip from './KpiStrip'
import PillarGrid from './PillarGrid'
import FlowSteps from './FlowSteps'
import CompareCards from './CompareCards'
import QuestionGrid from './QuestionGrid'
import Checklist from './Checklist'

interface Props {
  onNavigate: (v: View) => void
}

export default function Dashboard({ onNavigate }: Props) {
  const data = useMemo(() => loadKCBCData(), [])
  const store = useMemo(() => createChecklistStore(), [])

  return (
    <>
      <HeroHeader storeMode={store.mode} />

      {/* ★ 첫 행동으로 들어가는 문 — 신규 사용자 CTA */}
      <section className="cta">
        <div className="cta__body">
          <div>
            <h2 className="cta__title">지금 시작할 수 있어요</h2>
            <p className="cta__desc">
              단원의 <strong>중요한 질문</strong> 한 줄로 시작해서 5국면 매트릭스로 서·논술형 평가문항까지, 약 3분.
            </p>
          </div>
          <div className="cta__actions">
            <button
              className="btn btn--primary cta__primary"
              onClick={() => onNavigate('staged')}
            >
              👉 첫 평가문항 만들기 (3분)
            </button>
            <button
              className="btn"
              onClick={() => onNavigate('techniques')}
            >
              💡 기법 라이브러리 둘러보기
            </button>
          </div>
        </div>
      </section>

      <QSchoolFrame />

      {/* KCBC를 더 알아보기 — 학습·자료는 접힘 상태로 */}
      <details className="learn-more">
        <summary>
          <span className="learn-more__label">▸ KCBC를 더 알아보기</span>
          <span className="learn-more__hint">
            카드뉴스 · 에이전트 사슬 · 참고 자료 · 기존 KCBC 프레임
          </span>
        </summary>
        <div className="learn-more__body">
          <CardNews />
          <AgentsRoles />
          <ReferencesShelf mode="compact" onNavigate={onNavigate} />
          <KpiStrip
            pillars={data.pillars.length || 5}
            steps={data.steps.length || 7}
            questions={data.questions.length || 5}
          />
          <PillarGrid pillars={data.pillars} />
          <FlowSteps steps={data.steps} />
          <CompareCards
            propositional={data.lessons.propositional}
            procedural={data.lessons.procedural}
          />
          <QuestionGrid items={data.questions} />
        </div>
      </details>

      {/* 설계 자체 점검 — 별도 진입점 */}
      <details className="learn-more">
        <summary>
          <span className="learn-more__label">▸ 설계 자체 점검하기</span>
          <span className="learn-more__hint">CLAUDE.md §7 체크리스트</span>
        </summary>
        <div className="learn-more__body">
          <Checklist items={data.checklist} store={store} />
        </div>
      </details>
    </>
  )
}

interface Props {
  pillars: number
  steps: number
  questions: number
}

export default function KpiStrip({ pillars, steps, questions }: Props) {
  return (
    <section className="kc">
      <div className="kpis">
        <div className="kpi brand">
          <div className="label">설계 구성 요소</div>
          <div className="value">
            {pillars}
            <span className="unit">요소</span>
          </div>
        </div>
        <div className="kpi amber">
          <div className="label">탐구학습 모형</div>
          <div className="value">
            {steps}
            <span className="unit">단계</span>
          </div>
        </div>
        <div className="kpi green">
          <div className="label">수업설계 예시</div>
          <div className="value">
            2<span className="unit">유형 (명제/절차)</span>
          </div>
        </div>
        <div className="kpi rose">
          <div className="label">서·논술형 문항</div>
          <div className="value">
            {questions}
            <span className="unit">문항</span>
          </div>
        </div>
      </div>
    </section>
  )
}

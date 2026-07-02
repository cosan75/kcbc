import type { FlowStep } from '../types'

export default function FlowSteps({ steps }: { steps: FlowStep[] }) {
  return (
    <section className="kc">
      <div className="section-head">
        <h2>② 수업설계 과정 — 개념기반 탐구 7단계</h2>
        <span className="hint">CLAUDE.md §3 · 순환·반복 가능</span>
      </div>
      <div className="flow">
        <ol>
          {steps.map((s) => (
            <li key={s.num} className={s.star ? 'star' : ''} title={s.desc}>
              <span className="num">{s.num}</span>
              <span className="name">{s.ko}</span>
              <span className="en">{s.en}{s.star ? ' · KCBC 핵심' : ''}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

import type { Pillar } from '../types'

export default function PillarGrid({ pillars }: { pillars: Pillar[] }) {
  return (
    <section className="kc">
      <div className="section-head">
        <h2>① 수업설계의 틀 — 5대 구성 요소</h2>
        <span className="hint">CLAUDE.md §2 · 자동 파싱</span>
      </div>
      <div className="grid5">
        {pillars.map((p) => (
          <div className="pillar" key={p.name}>
            <h3>{p.name}</h3>
            <p>{p.meaning}</p>
            {p.question && <div className="q">"{p.question}"</div>}
          </div>
        ))}
      </div>
    </section>
  )
}

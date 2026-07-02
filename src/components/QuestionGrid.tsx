import { useMemo, useState } from 'react'
import type { QuestionItem } from '../types'

const DOMAINS = ['전체', '지리', '역사', '경제', '정치', '지속가능 발전'] as const
type Domain = (typeof DOMAINS)[number]

export default function QuestionGrid({ items }: { items: QuestionItem[] }) {
  const [filter, setFilter] = useState<Domain>('전체')

  const filtered = useMemo(() => {
    if (filter === '전체') return items
    return items.filter((q) => q.domain.includes(filter))
  }, [items, filter])

  return (
    <section className="kc">
      <div className="section-head">
        <h2>④ 사회과 서·논술형 평가 문항</h2>
        <span className="hint">스킬.md · 자료 제시형 {items.length}문항 · 자동 파싱</span>
      </div>

      <div className="q-tools">
        {DOMAINS.map((d) => (
          <button
            key={d}
            className={filter === d ? 'active' : ''}
            onClick={() => setFilter(d)}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="q-grid">
        {filtered.map((q) => (
          <article className="qcard" key={q.no}>
            <div className="head">
              <span className="num">문항 {q.no}</span>
              <span className="type">{q.type}</span>
            </div>
            <h3>{q.title}</h3>
            <p className="topic">{q.domain}</p>
            <div className="material">
              자료: <strong>{q.materialLabel}</strong>
              {q.materialDesc && <> — {q.materialDesc}</>}
            </div>
            <div className="foot">
              <span className="score">총 {q.totalScore}점</span>
              <span>
                하위 문항 {q.subScores.length}개 ({q.subScores.join(' / ')})
              </span>
            </div>
          </article>
        ))}

        <article
          className="qcard"
          style={{ background: 'var(--brand-soft)', borderColor: '#dde3ff' }}
        >
          <div className="head">
            <span className="num" style={{ background: 'var(--ink)' }}>
              루브릭
            </span>
            <span className="type" style={{ background: '#fff' }}>
              공통 양식
            </span>
          </div>
          <h3>채점 단계 — 상 · 중 · 하 · 미응답</h3>
          <p className="topic">자료 해석 + 개수 충족 + 사회 개념 연결</p>
          <div className="material" style={{ background: '#fff' }}>
            <strong>상</strong> 만점 · <strong>중</strong> 부분점수 · <strong>하</strong> 최소점수 ·{' '}
            <strong>미응답</strong> 0점
          </div>
          <div className="foot">
            <span>전이 과제 + 개념 이해 측정</span>
          </div>
        </article>
      </div>
    </section>
  )
}

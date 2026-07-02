import type { LessonCase } from '../types'

function LessonCard({ data, side }: { data: LessonCase; side: 'left' | 'right' }) {
  return (
    <div className={`card ${side}`}>
      <h3>
        {data.subject} — {data.unit}
      </h3>
      <div className="sub">
        {data.knowledgeType} 지식 ·{' '}
        {data.knowledgeType === '명제적' ? '"무엇이 왜 그러한가"' : '"어떻게 하는가"'}
      </div>
      {data.studentImage && (
        <div className="row">
          <div className="k">학생상</div>
          <div>{data.studentImage}</div>
        </div>
      )}
      {data.values.length > 0 && (
        <div className="row">
          <div className="k">핵심가치</div>
          <div>{data.values.join(', ')}</div>
        </div>
      )}
      {data.macroLens && (
        <div className="row">
          <div className="k">렌즈 개념</div>
          <div>{data.macroLens}</div>
        </div>
      )}
      {data.microConcepts && (
        <div className="row">
          <div className="k">단원 개념</div>
          <div>{data.microConcepts}</div>
        </div>
      )}
      {data.skills.length > 0 && (
        <div className="row">
          <div className="k">핵심기능</div>
          <div>{data.skills.join(' / ')}</div>
        </div>
      )}
      {data.task && (
        <div className="row">
          <div className="k">수행 과제</div>
          <div>{data.task}</div>
        </div>
      )}
      {data.generalization && (
        <div className="gen">
          <span className="tag">GENERALIZATION</span>
          {data.generalization}
        </div>
      )}
    </div>
  )
}

interface Props {
  propositional: LessonCase
  procedural: LessonCase
}

export default function CompareCards({ propositional, procedural }: Props) {
  return (
    <section className="kc">
      <div className="section-head">
        <h2>③ 두 가지 수업설계 — 명제적 지식 vs 절차적 지식</h2>
        <span className="hint">CLAUDE.md §5–6 · 자동 파싱</span>
      </div>
      <div className="compare">
        <LessonCard data={propositional} side="left" />
        <LessonCard data={procedural} side="right" />
      </div>
    </section>
  )
}

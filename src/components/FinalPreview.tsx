/**
 * 단계형 작성기 최종 평가문항 미리보기.
 * - 매트릭스 셀 입력에 따라 실시간 갱신
 * - 5국면 흐름(생성→정교화→탐구→평가화→성찰) 좌측 시각화
 * - 우측: 서·논술형 평가문항 변환 결과 (헤더 + 자료 + 하위문항 + 루브릭)
 * - 하단: MD 미리보기 토글 + 진행도
 */
import { useMemo, useState } from 'react'
import type { StagedAssessment } from '../domain'
import {
  STAGED_STAGES,
  PROFICIENCY_LEVELS,
  QLEARNING_MODELS,
  LEARNER_DIVERSITIES,
} from '../domain'
import {
  stagedToAssessmentDraft,
  stagedToMarkdown,
  buildSampleAnswers,
} from '../lib/exportMd'

interface Props {
  draft: StagedAssessment
}

const VISIBLE_STAGES = STAGED_STAGES.filter(
  (s) => s.key !== 'classify' && s.key !== 'itemize',
)

export default function FinalPreview({ draft: d }: Props) {
  const [showMd, setShowMd] = useState(false)
  const [showAnswers, setShowAnswers] = useState(false)

  const filled = d.items.filter(
    (i) => i.question.trim() && i.stage !== 'classify' && i.stage !== 'itemize',
  )
  const total = VISIBLE_STAGES.length * PROFICIENCY_LEVELS.length
  const pct = Math.round((filled.length / total) * 100)

  // 서·논술형 변환 (정교화/평가화 셀 우선)
  const assessment = useMemo(() => stagedToAssessmentDraft(d, 1), [d])
  const md = useMemo(() => stagedToMarkdown(d), [d])
  const samples = useMemo(() => buildSampleAnswers(d), [d])

  const modelMeta = d.learningModel
    ? QLEARNING_MODELS.find((m) => m.key === d.learningModel)
    : null
  const divMeta = LEARNER_DIVERSITIES.find(
    (x) => x.key === (d.diversity ?? 'general'),
  )

  if (filled.length === 0) {
    return (
      <section className="finalp finalp--empty">
        <div className="finalp__head">
          <h3 className="finalp__title">
            🧪 최종 평가문항 미리보기
            <span className="finalp__sub">실시간 — 셀을 채우면 자동 갱신</span>
          </h3>
        </div>
        <p className="finalp__empty">
          매트릭스에서 셀을 작성하면 여기에 최종 평가문항 미리보기가 만들어집니다.
        </p>
      </section>
    )
  }

  return (
    <section className="finalp">
      <header className="finalp__head">
        <div>
          <h3 className="finalp__title">
            🧪 최종 평가문항 미리보기
            <span className="finalp__sub">
              실시간 · 채워진 셀 {filled.length}/{total} ({pct}%)
            </span>
          </h3>
          <div className="finalp__progress">
            <div className="finalp__progress-bar">
              <div
                className="finalp__progress-fill"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
        <button
          className="btn btn--sm btn--ghost"
          onClick={() => setShowMd((x) => !x)}
        >
          {showMd ? '문항 보기' : 'MD 보기'}
        </button>
      </header>

      {showMd ? (
        <pre className="finalp__md">{md}</pre>
      ) : (
        <div className="finalp__grid">
          {/* 좌: 5국면 흐름 */}
          <aside className="finalp__flow">
            <div className="finalp__flow-head">📋 5국면 학생 질문 흐름</div>
            <ol className="finalp__flow-list">
              {VISIBLE_STAGES.map((s) => {
                const cells = filled
                  .filter((it) => it.stage === s.key)
                  .sort((a, b) => {
                    const order = { low: 0, mid: 1, high: 2 } as const
                    return order[a.level] - order[b.level]
                  })
                return (
                  <li key={s.key} className="finalp__flow-stage">
                    <div className="finalp__flow-stageHead">
                      <span className="finalp__flow-num">{s.ko}</span>
                      <span className="finalp__flow-en">{s.en}</span>
                      <span className="finalp__flow-count">
                        {cells.length}/3
                      </span>
                    </div>
                    {cells.length === 0 ? (
                      <p className="finalp__flow-empty">아직 비어 있음</p>
                    ) : (
                      <ul className="finalp__flow-cells">
                        {cells.map((it, i) => {
                          const lv = PROFICIENCY_LEVELS.find(
                            (l) => l.key === it.level,
                          )!
                          return (
                            <li
                              key={i}
                              className={`finalp__flow-cell finalp__flow-cell--${it.level}`}
                            >
                              <span className="finalp__flow-lv">{lv.ko}</span>
                              <span className="finalp__flow-q">
                                {it.question}
                              </span>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ol>
          </aside>

          {/* 우: 변환된 평가문항 */}
          <article className="finalp__paper">
            <header className="finalp__paper-head">
              <div className="finalp__paper-meta">
                {modelMeta && (
                  <span className="finalp__paper-tag finalp__paper-tag--model">
                    🏷 {modelMeta.ko}
                  </span>
                )}
                <span className="finalp__paper-tag">
                  {divMeta?.emoji} {divMeta?.ko}
                </span>
                <span className="finalp__paper-tag">
                  {d.subject || '교과'} · {d.grade || '학년'}
                </span>
              </div>
              <h4 className="finalp__paper-title">
                {d.title || '(제목 없음)'}
              </h4>
              {d.importantQuestion && (
                <p className="finalp__paper-imp">
                  ⭐ <strong>중요한 질문:</strong> {d.importantQuestion}
                </p>
              )}
            </header>

            {d.contextMaterial && (
              <div className="finalp__paper-mat">
                <span className="finalp__paper-matLabel">📄 자료</span>
                <pre>{d.contextMaterial.trim()}</pre>
              </div>
            )}

            <div className="finalp__paper-body">
              <div className="finalp__paper-prompt">
                <strong>{assessment.prompt}</strong>
                <span className="finalp__paper-total">
                  [총 {assessment.totalScore}점]
                </span>
              </div>
              <ol className="finalp__paper-subs">
                {assessment.subQuestions.length === 0 ||
                !assessment.subQuestions[0].text ? (
                  <li className="finalp__paper-empty">
                    정교화·평가화 셀에 학생용 질문을 작성하면 서·논술형 하위문항이
                    여기에 자동 생성됩니다.
                  </li>
                ) : (
                  assessment.subQuestions.map((sq, i) => (
                    <li key={i}>
                      <span className="finalp__paper-no">({i + 1})</span>
                      <span className="finalp__paper-q">{sq.text}</span>
                      <span className="finalp__paper-pt">({sq.score}점)</span>
                    </li>
                  ))
                )}
              </ol>
            </div>

            <div className="finalp__paper-rubric">
              <div className="finalp__paper-rubricHead">📐 채점 기준</div>
              <table>
                <tbody>
                  {assessment.rubric.map((r, i) => (
                    <tr key={i}>
                      <td className={`finalp__paper-lv finalp__paper-lv--${r.level}`}>
                        {r.level}
                      </td>
                      <td>{r.criteria}</td>
                      <td className="finalp__paper-pt2">{r.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 교사용 모범답안 (상/중/하) */}
            <div className="finalp__answers">
              <button
                type="button"
                className="finalp__answers-toggle"
                onClick={() => setShowAnswers((x) => !x)}
              >
                <span>👨‍🏫 교사용 모범답안 (상·중·하)</span>
                <span className="finalp__answers-meta">
                  {samples.length > 0
                    ? `${samples.length}개 문항 × 3등급 = ${samples.length * 3}개 답안`
                    : '정교화/평가화 셀을 채우면 자동 생성'}
                </span>
                <span className="finalp__answers-chev">{showAnswers ? '▾' : '▸'}</span>
              </button>

              {showAnswers && (
                <div className="finalp__answers-body">
                  {samples.length === 0 ? (
                    <p className="finalp__answers-empty">
                      정교화 또는 평가화 단계의 셀에 학생용 질문과 응답 증거(evidence)를
                      입력하면, 자료·증거·채점 힌트를 합성한 모범답안이 자동으로 만들어집니다.
                    </p>
                  ) : (
                    samples.map((s) => (
                      <div key={s.index} className="finalp__answers-q">
                        <div className="finalp__answers-qHead">
                          <span className="finalp__answers-qNo">({s.index + 1})</span>
                          <span className="finalp__answers-qText">{s.question}</span>
                          <span className="finalp__answers-qPt">({s.score}점)</span>
                        </div>
                        <div className="finalp__answers-tiers">
                          {s.tiers.map((t) => (
                            <div
                              key={t.level}
                              className={`finalp__answers-tier finalp__answers-tier--${t.level}`}
                            >
                              <div className="finalp__answers-tierHead">
                                <span className={`finalp__answers-tierBadge finalp__answers-tierBadge--${t.level}`}>
                                  {t.level}
                                </span>
                                <span className="finalp__answers-tierKeys">
                                  ✔ {t.keyPoints.join(' · ')}
                                </span>
                              </div>
                              <p className="finalp__answers-tierText">{t.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                  <p className="finalp__answers-hint">
                    💡 자동 합성 초안입니다. 교사가 학생 실제 응답을 본 뒤 조정해 사용하세요.
                    학생에게 보여줄 화면에서는 이 영역을 접어 두세요.
                  </p>
                </div>
              )}
            </div>
          </article>
        </div>
      )}
    </section>
  )
}

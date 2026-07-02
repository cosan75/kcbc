import { useMemo, useState } from 'react'
import type { GradingRecord, KrGrade } from '../domain'
import { createRepo } from '../lib/storage'
import { classReportToMarkdown, download } from '../lib/exportMd'

const repo = createRepo<GradingRecord>('kcbc:grading-records')

const GRADES: KrGrade[] = ['잘함', '보통', '노력 요함']
const GRADE_NUM: Record<KrGrade, number> = {
  '잘함': 3,
  '보통': 2,
  '노력 요함': 1,
}

interface Group {
  key: string                    // evaluationTitle 또는 assessmentId
  title: string
  records: GradingRecord[]
  counts: Record<KrGrade, number>
  avg: number                    // 1.0~3.0
}

function groupRecords(all: GradingRecord[]): Group[] {
  const map = new Map<string, GradingRecord[]>()
  for (const r of all) {
    const k = r.assessmentId || r.evaluationTitle
    if (!map.has(k)) map.set(k, [])
    map.get(k)!.push(r)
  }
  const out: Group[] = []
  for (const [key, recs] of map.entries()) {
    const counts: Record<KrGrade, number> = {
      '잘함': 0, '보통': 0, '노력 요함': 0,
    }
    let sum = 0
    for (const r of recs) {
      counts[r.grade]++
      sum += GRADE_NUM[r.grade]
    }
    const avg = recs.length ? sum / recs.length : 0
    out.push({
      key,
      title: recs[0]?.evaluationTitle || '(제목 없음)',
      records: recs,
      counts,
      avg,
    })
  }
  // 최신 채점 시점 기준 정렬
  out.sort((a, b) => {
    const at = Math.max(...a.records.map((r) => r.gradedAt || r.createdAt))
    const bt = Math.max(...b.records.map((r) => r.gradedAt || r.createdAt))
    return bt - at
  })
  return out
}

export default function GradingDashboard() {
  const [tick, setTick] = useState(0)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const groups = useMemo(() => groupRecords(repo.list()), [tick])
  if (groups.length === 0) return null // 채점 기록 없으면 숨김

  const toggle = (key: string) =>
    setExpanded((x) => {
      const next = new Set(x)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const refresh = () => setTick((n) => n + 1)

  const exportClassReport = (g: Group) => {
    download(
      `class-report_${g.title || 'untitled'}.md`,
      classReportToMarkdown(g.title, g.records),
      'text/markdown',
    )
  }

  const removeRecord = (id: string) => {
    if (!confirm('이 채점 기록을 삭제할까요?')) return
    repo.remove(id)
    refresh()
  }

  const totalStudents = groups.reduce((a, g) => a + g.records.length, 0)

  // AI vs 교사 일치도 계산 (aiGrade가 있는 레코드만)
  const withAi = groups.flatMap((g) => g.records).filter((r) => r.aiGrade)
  const aiAgree = withAi.filter((r) => r.aiGrade === r.grade).length
  const aiRate = withAi.length > 0
    ? Math.round((aiAgree / withAi.length) * 100)
    : null
  const overallCounts = groups.reduce<Record<KrGrade, number>>(
    (acc, g) => {
      for (const k of GRADES) acc[k] += g.counts[k]
      return acc
    },
    { '잘함': 0, '보통': 0, '노력 요함': 0 },
  )

  return (
    <section className="gdash">
      <div className="gdash__head">
        <div>
          <h3 className="gdash__title">
            📊 학급 채점 분포
            <span className="gdash__sub">
              {groups.length}개 평가 · 누적 {totalStudents}명
            </span>
          </h3>
          <p className="gdash__hint">
            외부 OCR 채점 도구의 채점기록을 평가별로 모아 학급의 등급 분포·평균을 보여줍니다.
            평가별 카드를 펼치면 학생별 채점 근거·피드백을 확인할 수 있어요.
          </p>
        </div>
        <div className="gdash__overall">
          {GRADES.map((g) => (
            <span key={g} className={`gdash__opill gdash__opill--${gradeKey(g)}`}>
              {g} <strong>{overallCounts[g]}</strong>
            </span>
          ))}
          {aiRate !== null && (
            <span
              className={
                'gdash__opill gdash__aiRate ' +
                (aiRate >= 80
                  ? 'gdash__opill--high'
                  : aiRate >= 60
                  ? 'gdash__opill--mid'
                  : 'gdash__opill--low')
              }
              title={`AI 제안과 교사 확정이 일치한 비율 (${aiAgree}/${withAi.length}) — 60% 미만이면 이 주제 AI 신뢰도 낮음`}
            >
              🤖 AI 일치도 <strong>{aiRate}%</strong>
              {aiRate < 60 && ' ⚠'}
            </span>
          )}
        </div>
      </div>

      <div className="gdash__list">
        {groups.map((g) => {
          const total = g.records.length
          const pct = (n: number) =>
            total ? Math.round((n / total) * 100) : 0
          const isOpen = expanded.has(g.key)
          return (
            <article key={g.key} className="gdash__card">
              <header className="gdash__card-head" onClick={() => toggle(g.key)}>
                <div className="gdash__card-title">
                  <span className="gdash__chev">{isOpen ? '▾' : '▸'}</span>
                  <strong>{g.title}</strong>
                  <span className="gdash__count">{total}명</span>
                </div>
                <div className="gdash__card-actions" onClick={(e) => e.stopPropagation()}>
                  <span className="gdash__avg" title="잘함=3, 보통=2, 노력요함=1 기준 평균">
                    평균 <strong>{g.avg.toFixed(2)}</strong>/3
                  </span>
                  <button
                    className="btn btn--sm"
                    onClick={() => exportClassReport(g)}
                    title="학급 리포트를 MD로 내려받기"
                  >
                    📄 리포트
                  </button>
                </div>
              </header>

              {/* 스택드 비율 막대 */}
              <div className="gdash__bar" role="img" aria-label="등급 분포">
                {GRADES.map((k) => {
                  const w = pct(g.counts[k])
                  if (w === 0) return null
                  return (
                    <div
                      key={k}
                      className={`gdash__seg gdash__seg--${gradeKey(k)}`}
                      style={{ width: `${w}%` }}
                      title={`${k} ${g.counts[k]}명 (${w}%)`}
                    >
                      {w >= 8 && (
                        <span className="gdash__seg-label">
                          {k} {w}%
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="gdash__legend">
                {GRADES.map((k) => (
                  <span key={k} className={`gdash__lpill gdash__lpill--${gradeKey(k)}`}>
                    {k} {g.counts[k]}
                  </span>
                ))}
              </div>

              {/* 학생별 드릴다운 */}
              {isOpen && (
                <div className="gdash__students">
                  {g.records
                    .slice()
                    .sort((a, b) =>
                      a.studentLabel.localeCompare(b.studentLabel, 'ko-KR'),
                    )
                    .map((r) => (
                      <div key={r.id} className="gdash__row">
                        <span className={`gdash__rpill gdash__rpill--${gradeKey(r.grade)}`}>
                          {r.grade}
                        </span>
                        <div className="gdash__rmain">
                          <div className="gdash__rname">
                            <strong>{r.studentLabel}</strong>
                            {r.attachmentName && (
                              <span className="gdash__rfile">
                                📎 {r.attachmentName}
                              </span>
                            )}
                            <span className="gdash__rtime">
                              {r.gradedAt
                                ? new Date(r.gradedAt).toLocaleString('ko-KR')
                                : new Date(r.createdAt).toLocaleString('ko-KR')}
                            </span>
                          </div>
                          {r.rationale && (
                            <p className="gdash__rrat">
                              <em>근거:</em> {r.rationale}
                            </p>
                          )}
                          {r.feedback && (
                            <p className="gdash__rfb">
                              <em>피드백:</em> {r.feedback}
                            </p>
                          )}
                          {r.ocrText && (
                            <details className="gdash__rocr">
                              <summary>OCR 답안 보기</summary>
                              <pre>{r.ocrText}</pre>
                            </details>
                          )}
                        </div>
                        <button
                          className="btn btn--sm btn--danger"
                          onClick={() => removeRecord(r.id)}
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

function gradeKey(g: KrGrade): 'high' | 'mid' | 'low' {
  if (g === '잘함') return 'high'
  if (g === '보통') return 'mid'
  return 'low'
}

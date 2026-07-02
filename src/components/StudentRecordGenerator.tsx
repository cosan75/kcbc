/**
 * 학생부 「교과학습발달상황」 씨앗 + 교사 직접 작성 워크플로우.
 *
 * 이전 버전은 결정적 시드 조립으로 문장을 완성했지만, 다음 위험이 있었음:
 *   1) 학급 학생 간 문장 유사도 → NEIS 유사도 검사 위험
 *   2) 학생 개성 손실
 *   3) 교사 검수 생략 유도
 *
 * 이번 버전은:
 *   - 학생별 씨앗(키워드) 3-5개만 제공 (실제 응답에서 추출)
 *   - 교사가 직접 문장 입력 (필수)
 *   - "이 학생의 특징" 자유 텍스트 (선택)
 *   - "작성 완료" 체크박스 — 미체크는 MD 내보내기 시 경고
 */
import { useMemo, useState } from 'react'
import type { GradingRecord, KrGrade } from '../domain'
import { createRepo } from '../lib/storage'
import { buildRecordSeed, classSeedsMd, download } from '../lib/exportMd'

const repo = createRepo<GradingRecord>('kcbc:grading-records')

interface Draft {
  manual: string
  note: string
  done: boolean
}

interface DraftStore {
  [recordId: string]: Draft
}

const DRAFT_KEY = 'kcbc:student-record-drafts'

function loadDrafts(): DraftStore {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}
function saveDrafts(d: DraftStore) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(d))
}

interface Group {
  key: string
  title: string
  records: GradingRecord[]
}
function groupRecords(all: GradingRecord[]): Group[] {
  const map = new Map<string, GradingRecord[]>()
  for (const r of all) {
    const k = r.assessmentId || r.evaluationTitle
    if (!map.has(k)) map.set(k, [])
    map.get(k)!.push(r)
  }
  return Array.from(map.entries()).map(([key, records]) => ({
    key,
    title: records[0]?.evaluationTitle || '(제목 없음)',
    records,
  }))
}

export default function StudentRecordGenerator() {
  const [tick, setTick] = useState(0)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<DraftStore>(() => loadDrafts())
  const [msg, setMsg] = useState<string | null>(null)

  const groups = useMemo(() => groupRecords(repo.list()), [tick])
  if (groups.length === 0) return null

  const selected = groups.find((g) => g.key === selectedKey) || groups[0]

  const patchDraft = (id: string, patch: Partial<Draft>) => {
    setDrafts((prev) => {
      const cur = prev[id] || { manual: '', note: '', done: false }
      const next = { ...prev, [id]: { ...cur, ...patch } }
      saveDrafts(next)
      return next
    })
  }

  const doneCount = selected.records.filter((r) => drafts[r.id]?.done).length
  const notDoneCount = selected.records.length - doneCount

  const exportMd = () => {
    if (notDoneCount > 0) {
      const ok = confirm(
        `⚠ 미완료 ${notDoneCount}명이 있습니다.\n그대로 내보낼까요?`,
      )
      if (!ok) return
    }
    download(
      `student-records_${selected.title || 'untitled'}.md`,
      classSeedsMd(selected.title, selected.records, drafts),
      'text/markdown',
    )
    setMsg(`📄 내보냄 · 완료 ${doneCount} · 미완료 ${notDoneCount}`)
    setTimeout(() => setMsg(null), 3000)
  }

  const copyOne = async (r: GradingRecord) => {
    const draft = drafts[r.id]
    if (!draft?.manual.trim()) {
      alert('먼저 교사 초안을 작성하세요.')
      return
    }
    try {
      await navigator.clipboard.writeText(draft.manual)
      setMsg(`📋 ${r.studentLabel} 문장 복사됨`)
      setTimeout(() => setMsg(null), 2000)
    } catch {
      setMsg('복사 실패')
      setTimeout(() => setMsg(null), 2000)
    }
  }

  const sorted = selected.records
    .slice()
    .sort((a, b) => a.studentLabel.localeCompare(b.studentLabel, 'ko-KR'))

  return (
    <section className="srgen">
      <header className="srgen__head">
        <div>
          <h3 className="srgen__title">
            📜 학생부 기록 (씨앗 + 교사 초안)
            <span className="srgen__sub">
              문장 완성 없음 · 유사도 위험 제거 · 교사 필수 작성
            </span>
          </h3>
          <p className="srgen__hint">
            <strong>이 도구는 완성 문장을 만들지 않습니다.</strong> 각 학생 응답에서 뽑은 씨앗(키워드)을 참고해 교사가 직접 문장을 작성하세요. 자동 문장은 학급 내 유사도 위험 + 개성 손실 위험이 있습니다.
          </p>
        </div>
        <span className="srgen__credit">
          완료 <strong>{doneCount}</strong> / {selected.records.length}
        </span>
      </header>

      <div className="srgen__controls" style={{ gridTemplateColumns: '1fr auto' }}>
        <label>
          <span>평가 활동 선택</span>
          <select
            value={selected.key}
            onChange={(e) => setSelectedKey(e.target.value)}
          >
            {groups.map((g) => (
              <option key={g.key} value={g.key}>
                {g.title} ({g.records.length}명)
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn--primary" onClick={exportMd}>
          📄 MD 내보내기 ({doneCount}/{selected.records.length})
        </button>
      </div>

      {msg && <div className="toast">{msg}</div>}

      <div className="srgen__list">
        {sorted.map((r) => {
          const seed = buildRecordSeed(r)
          const draft = drafts[r.id] || { manual: '', note: '', done: false }
          return (
            <div key={r.id} className={`srseed ${draft.done ? 'is-done' : ''}`}>
              <div className="srseed__head">
                <span className={`srgen__pill srgen__pill--${gradeKey(r.grade)}`}>
                  {r.grade}
                </span>
                <strong>{r.studentLabel}</strong>
                <label className="srseed__doneToggle">
                  <input
                    type="checkbox"
                    checked={draft.done}
                    onChange={(e) =>
                      patchDraft(r.id, { done: e.target.checked })
                    }
                  />
                  <span>작성 완료</span>
                </label>
                <button
                  className="btn btn--sm"
                  onClick={() => copyOne(r)}
                  disabled={!draft.manual.trim()}
                >
                  📋 복사
                </button>
              </div>

              <div className="srseed__seeds">
                <div className="srseed__seedLabel">🌱 등급 관점 씨앗</div>
                <div className="srseed__gradeHint">{seed.gradeHint}</div>

                {seed.chips.length > 0 && (
                  <>
                    <div className="srseed__seedLabel">🧩 이 학생의 응답 씨앗</div>
                    <div className="srseed__chips">
                      {seed.chips.map((c, i) => (
                        <span key={i} className="srseed__chip">{c}</span>
                      ))}
                    </div>
                  </>
                )}

                <div className="srseed__seedLabel">⚠ 검수 시 주의</div>
                <ul className="srseed__cautions">
                  {seed.cautions.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>

              <label className="srseed__field">
                <span>✍️ 교사 초안 (직접 작성)</span>
                <textarea
                  rows={2}
                  value={draft.manual}
                  onChange={(e) => patchDraft(r.id, { manual: e.target.value })}
                  placeholder="씨앗을 참고해 이 학생만의 문장을 작성하세요. 명사형 종결·등급 미표시."
                />
              </label>

              <label className="srseed__field">
                <span>🎯 이 학생만의 특징 (선택)</span>
                <input
                  value={draft.note}
                  onChange={(e) => patchDraft(r.id, { note: e.target.value })}
                  placeholder="예: 지도 그림으로 개념 표현 · 비유법 사용 · 협업 참여"
                />
              </label>
            </div>
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

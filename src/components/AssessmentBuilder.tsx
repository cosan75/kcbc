import { useEffect, useMemo, useState } from 'react'
import type { AssessmentDraft, SubQuestion } from '../domain'
import { DEFAULT_RUBRIC } from '../domain'
import { createRepo, uid } from '../lib/storage'
import { assessmentToMarkdown, download } from '../lib/exportMd'
import AiGraderPanel from './AiGraderPanel'
import GradingRecordImport from './GradingRecordImport'

const repo = createRepo<AssessmentDraft>('kcbc:assessments')

function makeBox(label: string, body: string): string {
  // ASCII 자료 박스 자동 생성
  const lines = body.split('\n').filter((l) => l.length > 0)
  const W = 55
  const pad = (s: string) => {
    if (s.length >= W) return s.slice(0, W)
    return s + ' '.repeat(W - s.length)
  }
  const top = '┌' + '─'.repeat(W) + '┐'
  const bot = '└' + '─'.repeat(W) + '┘'
  const sep = '│' + '─'.repeat(W) + '│'
  const out: string[] = [top]
  if (label) out.push('│  📄 ' + pad(label).slice(0, W - 3) + '│', sep)
  for (const l of lines) out.push('│ ' + pad(l).slice(0, W - 1) + '│')
  out.push(bot)
  return out.join('\n')
}

function blank(): AssessmentDraft {
  const now = Date.now()
  return {
    id: uid('a_'),
    no: 1,
    type: '서술형',
    domain: '지리',
    title: '',
    prompt: '',
    totalScore: 8,
    material: '',
    materialLabel: '',
    source: 'OpenAI(2025). ChatGPT[거대 언어 모델]. http://chat.open.com/chat',
    subQuestions: [{ text: '', score: 6 }],
    rubric: DEFAULT_RUBRIC.map((r) => ({ ...r })),
    createdAt: now,
    updatedAt: now,
  }
}

const DOMAINS = ['지리', '역사', '경제', '정치', '지속가능 발전', '문화', '기타']

export default function AssessmentBuilder() {
  const [d, setD] = useState<AssessmentDraft>(blank())
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [autoBox, setAutoBox] = useState(true)
  const [rawMaterial, setRawMaterial] = useState('')

  // 자료 박스 자동 생성 모드
  useEffect(() => {
    if (autoBox && (rawMaterial || d.materialLabel)) {
      setD((x) => ({ ...x, material: makeBox(d.materialLabel, rawMaterial), updatedAt: Date.now() }))
    }
  }, [autoBox, rawMaterial, d.materialLabel])

  // 자동 저장
  useEffect(() => {
    if (!d.title) return
    const t = setTimeout(() => repo.save({ ...d, updatedAt: Date.now() }), 1000)
    return () => clearTimeout(t)
  }, [d])

  const update = <K extends keyof AssessmentDraft>(k: K, v: AssessmentDraft[K]) =>
    setD((x) => ({ ...x, [k]: v, updatedAt: Date.now() }))

  const updateSub = (i: number, patch: Partial<SubQuestion>) =>
    setD((x) => ({
      ...x,
      subQuestions: x.subQuestions.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
      updatedAt: Date.now(),
    }))

  const addSub = () =>
    setD((x) => ({
      ...x,
      subQuestions: [...x.subQuestions, { text: '', score: 2 }],
      updatedAt: Date.now(),
    }))

  const removeSub = (i: number) =>
    setD((x) => ({
      ...x,
      subQuestions: x.subQuestions.filter((_, idx) => idx !== i),
      updatedAt: Date.now(),
    }))

  const subSum = useMemo(
    () => d.subQuestions.reduce((s, q) => s + (Number(q.score) || 0), 0),
    [d.subQuestions],
  )
  const scoreMatch = subSum === d.totalScore

  const save = () => {
    repo.save({ ...d, updatedAt: Date.now() })
    setSavedMsg(`저장됨 · ${new Date().toLocaleTimeString('ko-KR')}`)
    setTimeout(() => setSavedMsg(null), 2000)
  }

  const exportMd = () => {
    download(`assessment_${d.no}_${d.title || 'untitled'}.md`, assessmentToMarkdown(d), 'text/markdown')
  }

  return (
    <section className="builder">
      <div className="builder__head">
        <div>
          <h2 className="builder__title">📋 평가 문항 빌더 — 자료 제시형</h2>
          <p className="builder__desc">
            ① 도입 지시문 + ② 자료 박스 + ③ 하위 문항 + ④ 루브릭. 스킬.md 양식 그대로 내보냅니다.
          </p>
        </div>
        <div className="builder__actions">
          <button className="btn btn--ghost" onClick={() => setD(blank())}>
            새 문항
          </button>
        </div>
      </div>

      {savedMsg && <div className="toast">{savedMsg}</div>}

      <div className="builder__grid">
        {/* 폼 */}
        <div className="form">
          <div className="form__row form__row--3">
            <label>
              <span>문항 번호</span>
              <input
                type="number"
                min={1}
                value={d.no}
                onChange={(e) => update('no', Number(e.target.value) || 1)}
              />
            </label>
            <label>
              <span>유형</span>
              <div className="seg">
                {(['서술형', '논술형'] as const).map((t) => (
                  <button
                    key={t}
                    className={d.type === t ? 'seg__btn is-on' : 'seg__btn'}
                    onClick={() => update('type', t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </label>
            <label>
              <span>영역</span>
              <select value={d.domain} onChange={(e) => update('domain', e.target.value)}>
                {DOMAINS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <fieldset className="form__group">
            <legend>① 도입 지시문</legend>
            <label>
              <span>주제</span>
              <input
                value={d.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="예: 우리 지역의 자연환경"
              />
            </label>
            <label>
              <span>지시문</span>
              <input
                value={d.prompt}
                onChange={(e) => update('prompt', e.target.value)}
                placeholder="예: 우리 마을 안내 책자의 내용을 읽고 물음에 답하세요."
              />
            </label>
            <label>
              <span>총배점</span>
              <input
                type="number"
                min={1}
                value={d.totalScore}
                onChange={(e) => update('totalScore', Number(e.target.value) || 0)}
              />
            </label>
          </fieldset>

          <fieldset className="form__group">
            <legend>② 자료 박스</legend>
            <label>
              <span>자료 제목 (특집/주제)</span>
              <input
                value={d.materialLabel}
                onChange={(e) => update('materialLabel', e.target.value)}
                placeholder="예: 우리 마을 안내 책자"
              />
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={autoBox}
                onChange={(e) => setAutoBox(e.target.checked)}
              />
              <span>ASCII 박스 자동 생성</span>
            </label>
            {autoBox ? (
              <label>
                <span>본문 (줄단위 입력)</span>
                <textarea
                  rows={4}
                  value={rawMaterial}
                  onChange={(e) => setRawMaterial(e.target.value)}
                  placeholder={'특집: 산과 강이 만든 우리 마을의 모습\n[사진 A — 산비탈의 다랭이 논]\n[사진 B — 강가의 평야, 비닐하우스]'}
                />
              </label>
            ) : (
              <label>
                <span>자료 박스 직접 입력 (코드 블록 내부)</span>
                <textarea
                  rows={8}
                  value={d.material}
                  onChange={(e) => update('material', e.target.value)}
                  className="mono"
                />
              </label>
            )}
            <label>
              <span>자료 출처</span>
              <input
                value={d.source}
                onChange={(e) => update('source', e.target.value)}
              />
            </label>
          </fieldset>

          <fieldset className="form__group">
            <legend>
              ③ 하위 문항 ({d.subQuestions.length}개,{' '}
              <span className={scoreMatch ? 'ok' : 'warn'}>
                합계 {subSum} / 총배점 {d.totalScore}
              </span>
              )
            </legend>
            {d.subQuestions.map((sq, i) => (
              <div key={i} className="subq">
                <span className="subq__no">({i + 1})</span>
                <input
                  className="subq__text"
                  value={sq.text}
                  onChange={(e) => updateSub(i, { text: e.target.value })}
                  placeholder="문항 내용"
                />
                <input
                  className="subq__score"
                  type="number"
                  min={1}
                  value={sq.score}
                  onChange={(e) => updateSub(i, { score: Number(e.target.value) || 0 })}
                />
                <span className="subq__unit">점</span>
                <button
                  className="subq__x"
                  onClick={() => removeSub(i)}
                  disabled={d.subQuestions.length <= 1}
                  aria-label="삭제"
                >
                  ×
                </button>
              </div>
            ))}
            <button className="btn btn--ghost btn--sm" onClick={addSub}>
              + 하위 문항 추가
            </button>
          </fieldset>

          <fieldset className="form__group">
            <legend>④ 채점 기준 (루브릭)</legend>
            {d.rubric.map((r, i) => (
              <div key={r.level} className="rubric-row">
                <span className={`rubric-row__tag rubric-row__tag--${r.level === '상' ? 'high' : r.level === '중' ? 'mid' : r.level === '하' ? 'low' : 'none'}`}>
                  {r.level}
                </span>
                <input
                  className="rubric-row__criteria"
                  value={r.criteria}
                  onChange={(e) =>
                    update(
                      'rubric',
                      d.rubric.map((rr, idx) => (idx === i ? { ...rr, criteria: e.target.value } : rr)),
                    )
                  }
                />
                <input
                  className="rubric-row__score"
                  value={r.score}
                  onChange={(e) =>
                    update(
                      'rubric',
                      d.rubric.map((rr, idx) => (idx === i ? { ...rr, score: e.target.value } : rr)),
                    )
                  }
                />
              </div>
            ))}
          </fieldset>

          <div className="form__actions">
            <button className="btn btn--primary" onClick={save} disabled={!d.title}>
              💾 저장
            </button>
            <button className="btn" onClick={exportMd}>📄 MD 내보내기</button>
          </div>

          {!scoreMatch && (
            <div className="validation validation--warn">
              ⚠ 하위 문항 배점 합계({subSum})와 총배점({d.totalScore})이 다릅니다.
            </div>
          )}
        </div>

        {/* 미리보기 */}
        <aside className="preview">
          <div className="preview__head">
            <strong>실시간 미리보기</strong>
            <span className="preview__hint">스킬.md 양식</span>
          </div>
          <pre className="preview__md">{assessmentToMarkdown(d)}</pre>
        </aside>
      </div>

      {/* AI 채점 토큰 가시화 패널 */}
      <AiGraderPanel
        question={{
          questionPrompt: `${d.prompt} (총 ${d.totalScore}점)`,
          subQuestions: d.subQuestions,
          rubric: d.rubric,
          totalScore: d.totalScore,
          materialText: d.material,
          studentAnswer: '',
        }}
      />

      {/* OCR 채점기록 가져오기 (역방향 다리) */}
      <GradingRecordImport
        assessmentId={d.id}
        evaluationTitle={d.title || '제목 없음'}
      />
    </section>
  )
}

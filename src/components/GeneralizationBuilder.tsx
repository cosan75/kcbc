import { useMemo, useState } from 'react'
import { GENERALIZATION_PATTERNS } from '../domain'
import type { GeneralizationPattern, KnowledgeType } from '../domain'
import { download } from '../lib/exportMd'

interface SavedGeneralization {
  id: string
  text: string
  pattern: string
  slots: string[]
  knowledgeType: KnowledgeType
  score: number
  createdAt: number
}

const STORE_KEY = 'kcbc:generalizations'

function loadAll(): SavedGeneralization[] {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '[]')
  } catch {
    return []
  }
}
function saveAll(arr: SavedGeneralization[]) {
  localStorage.setItem(STORE_KEY, JSON.stringify(arr))
}

/** 진술문 품질 점수: KCBC 원칙에 따라 0~100 */
function scoreGeneralization(text: string, slotCount: number): {
  score: number
  reasons: string[]
} {
  const reasons: string[] = []
  let score = 0

  const length = text.trim().length
  if (length === 0) return { score: 0, reasons: ['입력이 비어있습니다'] }

  // 1) 두 개 이상 개념 연결 (40점)
  if (slotCount >= 2) {
    score += 40
    reasons.push('✓ 두 개 이상의 개념이 연결됨')
  } else {
    reasons.push('✗ 적어도 두 개의 핵심개념을 연결하세요')
  }

  // 2) 한 문장 (20점) — 마침표 1회 이하 + 줄바꿈 없음
  const sentenceCount = (text.match(/[.!?。．]/g) || []).length
  if (sentenceCount <= 1 && !text.includes('\n')) {
    score += 20
    reasons.push('✓ 한 문장으로 명료함')
  } else {
    reasons.push('✗ 한 문장으로 다듬으세요 (마침표 1개 이하)')
  }

  // 3) 시제·인칭의 일반성 (15점) — "나는", "오늘" 등 구체어 회피
  const concrete = /(나는|우리는|오늘|어제|이번|지금|방금|이 학교|이 단원)/.test(text)
  if (!concrete) {
    score += 15
    reasons.push('✓ 시간/장소에 종속되지 않은 일반적 진술')
  } else {
    reasons.push('△ 시간·장소·인칭을 일반화하면 전이력이 높아집니다')
  }

  // 4) 동사가 분명 (15점)
  const hasVerb = /(이다|된다|형성한다|변한다|작동한다|영향(을|을 주|을 미|을 받)|결정한다|적용된다|의존한다)/.test(text)
  if (hasVerb) {
    score += 15
    reasons.push('✓ 개념 간 관계를 나타내는 동사가 명확')
  } else {
    reasons.push('△ 개념 간 관계를 드러낼 동사가 약합니다')
  }

  // 5) 의문/명령 없는 진술문 (10점)
  if (!/[?？]|\b(해라|하자|할까|하라|하세요)\b/.test(text)) {
    score += 10
    reasons.push('✓ 평서문 진술')
  } else {
    reasons.push('✗ 의문문/명령문이 아닌 진술문이어야 합니다')
  }

  return { score, reasons }
}

interface Props {
  onSaved?: () => void
}

export default function GeneralizationBuilder({ onSaved }: Props) {
  const [knowledgeType, setKnowledgeType] = useState<KnowledgeType>('명제적')
  const [selectedId, setSelectedId] = useState<string>(GENERALIZATION_PATTERNS[0].id)
  const [slots, setSlots] = useState<string[]>(['', '', ''])
  const [freeText, setFreeText] = useState('')
  const [useFree, setUseFree] = useState(false)
  const [savedList, setSavedList] = useState<SavedGeneralization[]>(() => loadAll())

  const available = GENERALIZATION_PATTERNS.filter(
    (p) => p.knowledgeType === 'both' || p.knowledgeType === knowledgeType,
  )
  const current: GeneralizationPattern =
    available.find((p) => p.id === selectedId) || available[0]

  /** 템플릿에서 {A}/{B}/{C} 슬롯을 슬롯 입력값으로 치환 */
  const composed = useMemo(() => {
    let s = current.template
    const slotNames = ['{A}', '{B}', '{C}']
    slotNames.forEach((name, i) => {
      const v = slots[i]?.trim() || ''
      s = s.split(name).join(v || name)
    })
    return s
  }, [current, slots])

  const finalText = useFree ? freeText : composed
  const filledSlots = slots.filter((s) => s.trim().length > 0).length
  const { score, reasons } = useMemo(
    () => scoreGeneralization(finalText, useFree ? Math.max(2, filledSlots) : filledSlots),
    [finalText, filledSlots, useFree],
  )

  const placeholders = (() => {
    const m = current.template.match(/\{[A-Z]\}/g) || []
    return m.length
  })()

  const save = () => {
    if (!finalText.trim()) return
    const item: SavedGeneralization = {
      id: 'gen_' + Date.now().toString(36),
      text: finalText.trim(),
      pattern: current.id,
      slots: slots.slice(0, placeholders),
      knowledgeType,
      score,
      createdAt: Date.now(),
    }
    const next = [item, ...savedList]
    setSavedList(next)
    saveAll(next)
    onSaved?.()
  }

  const removeOne = (id: string) => {
    const next = savedList.filter((s) => s.id !== id)
    setSavedList(next)
    saveAll(next)
  }

  const exportAll = () => {
    const md =
      '# 일반화 진술문 모음\n\n' +
      savedList
        .map(
          (s, i) =>
            `## ${i + 1}. (${s.knowledgeType}, ${s.score}/100)\n> ${s.text}\n\n_패턴: ${s.pattern} · ${new Date(s.createdAt).toLocaleString('ko-KR')}_`,
        )
        .join('\n\n')
    download('generalizations.md', md, 'text/markdown')
  }

  return (
    <section className="builder">
      <div className="builder__head">
        <div>
          <h2 className="builder__title">✨ 일반화 진술문 빌더</h2>
          <p className="builder__desc">
            핵심개념을 연결해 한 문장의 영속적 이해(Enduring Understanding)를 작성합니다.
            품질 점수는 KCBC 5대 원칙을 자동 검증합니다.
          </p>
        </div>
      </div>

      <div className="gen-grid">
        {/* 왼쪽: 패턴 + 슬롯 */}
        <div className="form">
          <fieldset className="form__group">
            <legend>지식 유형</legend>
            <div className="seg">
              {(['명제적', '절차적'] as KnowledgeType[]).map((k) => (
                <button
                  key={k}
                  className={knowledgeType === k ? 'seg__btn is-on' : 'seg__btn'}
                  onClick={() => setKnowledgeType(k)}
                >
                  {k} 지식
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="form__group">
            <legend>템플릿 패턴</legend>
            <div className="patterns">
              {available.map((p) => (
                <button
                  key={p.id}
                  className={`pattern ${selectedId === p.id ? 'is-on' : ''}`}
                  onClick={() => setSelectedId(p.id)}
                >
                  <code>{p.template}</code>
                  {p.examples[0] && <span className="pattern__ex">예: {p.examples[0]}</span>}
                </button>
              ))}
            </div>
          </fieldset>

          {!useFree && (
            <fieldset className="form__group">
              <legend>개념 슬롯</legend>
              {['A', 'B', 'C'].slice(0, placeholders).map((label, i) => (
                <label key={label}>
                  <span>{`{${label}}`}에 들어갈 개념</span>
                  <input
                    value={slots[i] || ''}
                    onChange={(e) => {
                      const next = [...slots]
                      next[i] = e.target.value
                      setSlots(next)
                    }}
                    placeholder={
                      i === 0 ? '예: 지리적 환경' : i === 1 ? '예: 인간의 생활 양식' : '예: 경제활동'
                    }
                  />
                </label>
              ))}
            </fieldset>
          )}

          <label className="check-row">
            <input
              type="checkbox"
              checked={useFree}
              onChange={(e) => {
                setUseFree(e.target.checked)
                if (e.target.checked && !freeText) setFreeText(composed)
              }}
            />
            <span>자유 입력 모드 (템플릿 무시)</span>
          </label>

          {useFree && (
            <fieldset className="form__group">
              <legend>직접 작성</legend>
              <textarea
                rows={3}
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="A는 B를 ____ 한다."
              />
            </fieldset>
          )}

          <div className="form__actions">
            <button className="btn btn--primary" onClick={save} disabled={!finalText.trim()}>
              💾 진술문 저장
            </button>
            <button
              className="btn"
              onClick={() => navigator.clipboard?.writeText(finalText)}
              disabled={!finalText}
            >
              📋 복사
            </button>
          </div>
        </div>

        {/* 오른쪽: 결과 + 점수 + 저장 목록 */}
        <aside className="gen-result">
          <div className="gen-card">
            <div className="gen-card__tag">GENERALIZATION</div>
            <div className="gen-card__text">
              {finalText || <span className="gen-card__hint">슬롯을 채우면 여기에 나타납니다</span>}
            </div>
            <div className={`gen-card__score score--${score >= 80 ? 'high' : score >= 50 ? 'mid' : 'low'}`}>
              <div className="gen-card__score-num">{score}</div>
              <div className="gen-card__score-bar">
                <div style={{ width: `${score}%` }} />
              </div>
            </div>
            <ul className="gen-card__reasons">
              {reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>

          <div className="gen-saved">
            <div className="gen-saved__head">
              <strong>📚 저장된 진술문 ({savedList.length})</strong>
              {savedList.length > 0 && (
                <button className="btn btn--ghost btn--sm" onClick={exportAll}>
                  📄 MD 일괄
                </button>
              )}
            </div>
            {savedList.length === 0 ? (
              <p className="empty">아직 저장한 진술문이 없습니다.</p>
            ) : (
              <ul className="gen-saved__list">
                {savedList.map((s) => (
                  <li key={s.id}>
                    <span className={`badge badge--${s.knowledgeType === '명제적' ? 'violet' : 'teal'}`}>
                      {s.knowledgeType}
                    </span>
                    <span className="score-pill" data-tier={s.score >= 80 ? 'high' : s.score >= 50 ? 'mid' : 'low'}>
                      {s.score}
                    </span>
                    <span className="gen-saved__text">{s.text}</span>
                    <button
                      className="gen-saved__x"
                      onClick={() => removeOne(s.id)}
                      aria-label="삭제"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </section>
  )
}

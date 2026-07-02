/**
 * 창의적 사고·질문 기법 라이브러리 카드 (Dashboard).
 * - 「학생 질문 능력 계발 모델」 4유형의 놀이/활동 + 일반 창의 사고법 15개
 * - 채팅 입력 없이 클릭으로 복사 / 자세히 / 매트릭스 셀에 시드 적용
 * - 초등 학생의 개념전이를 유도하는 transferPrompt 내장
 */
import { useMemo, useState } from 'react'
import {
  TECHNIQUES,
  setPendingSeed,
} from '../lib/techniques'
import type { Technique, TechniqueCategory } from '../lib/techniques'
import {
  QLEARNING_MODELS,
  STAGED_STAGES,
  PROFICIENCY_LEVELS,
} from '../domain'
import type { QuestionStage, ProficiencyLevel } from '../domain'

const CATEGORIES: { key: TechniqueCategory; label: string; emoji: string }[] = [
  { key: 'all',        label: '전체',            emoji: '✦' },
  { key: 'play',       label: '질문 놀이형',     emoji: '🎮' },
  { key: 'experiment', label: '실험·실습 연계형', emoji: '🧪' },
  { key: 'discuss',    label: '질문 토의형',     emoji: '🗣' },
  { key: 'reflect',    label: '질문 성찰형',     emoji: '🪞' },
  { key: 'general',    label: '일반 창의 사고법', emoji: '✨' },
]

export default function TechniqueLibrary() {
  const [filter, setFilter] = useState<TechniqueCategory>('all')
  const [active, setActive] = useState<Technique | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const visible = useMemo(
    () =>
      filter === 'all'
        ? TECHNIQUES
        : TECHNIQUES.filter((t) => t.category === filter),
    [filter],
  )

  const counts = useMemo(() => {
    const m: Record<TechniqueCategory, number> = {
      all: TECHNIQUES.length,
      play: 0, experiment: 0, discuss: 0, reflect: 0, general: 0,
    }
    TECHNIQUES.forEach((t) => { m[t.category]++ })
    return m
  }, [])

  const copyPrompt = async (t: Technique) => {
    try {
      await navigator.clipboard.writeText(t.transferPrompt)
      flash(`📋 「${t.ko}」 개념전이 프롬프트 복사됨`)
    } catch {
      flash('복사 실패 — 자세히 보기에서 선택 복사')
    }
  }

  const flash = (text: string) => {
    setMsg(text)
    setTimeout(() => setMsg(null), 2500)
  }

  return (
    <section className="techlib">
      <header className="techlib__head">
        <div>
          <h2 className="techlib__title">
            💡 창의 사고·질문 기법 라이브러리
            <span className="techlib__sub">{TECHNIQUES.length}개 · 클릭 → 즉시 적용</span>
          </h2>
          <p className="techlib__hint">
            「학생 질문 능력 계발 모델」 4유형의 놀이/활동 + 일반 창의 사고법(마인드맵·소크라테스·수평적 읽기·QFT 등).
            <br />
            각 기법은 <strong>초등 개념전이</strong>를 유도하는 프롬프트가 내장되어 있어요.
            <strong>채팅창 없이 클릭만으로</strong> 복사·매트릭스 셀 시드 적용 가능합니다.
          </p>
        </div>
      </header>

      {/* 카테고리 필터 */}
      <div className="techlib__filter">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={
              filter === c.key
                ? 'techlib__cat is-on'
                : 'techlib__cat'
            }
            onClick={() => setFilter(c.key)}
          >
            <span>{c.emoji}</span>
            <span>{c.label}</span>
            <span className="techlib__catcount">{counts[c.key]}</span>
          </button>
        ))}
      </div>

      {msg && <div className="toast">{msg}</div>}

      {/* 그리드 */}
      <div className="techlib__grid">
        {visible.map((t) => (
          <article key={t.id} className={`techlib__card techlib__card--${t.category}`}>
            <header className="techlib__cardhead">
              <span className="techlib__emoji">{t.emoji}</span>
              <div className="techlib__namebox">
                <strong>{t.ko}</strong>
                {t.en && <small>{t.en}</small>}
              </div>
            </header>
            <p className="techlib__oneliner">{t.oneLiner}</p>

            <div className="techlib__tags">
              {t.models.map((m) => {
                const meta = QLEARNING_MODELS.find((x) => x.key === m)!
                return (
                  <span key={m} className="techlib__tag techlib__tag--model">
                    {meta.short}
                  </span>
                )
              })}
              {t.stages.map((s) => {
                const meta = STAGED_STAGES.find((x) => x.key === s)!
                return (
                  <span key={s} className="techlib__tag techlib__tag--stage">
                    {meta.ko}
                  </span>
                )
              })}
            </div>

            <div className="techlib__actions">
              <button
                className="btn btn--sm btn--primary"
                onClick={() => setActive(t)}
                title="자세히 보기 + 매트릭스 셀에 시드 적용"
              >
                📖 자세히 / 적용
              </button>
              <button
                className="btn btn--sm"
                onClick={() => copyPrompt(t)}
                title="개념전이 프롬프트를 클립보드에 복사"
              >
                📋 복사
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* 자세히 모달 */}
      {active && (
        <TechniqueModal
          technique={active}
          onClose={() => setActive(null)}
          onApplied={(text) => {
            setActive(null)
            flash(`🎯 「${active.ko}」 단계형 작성기에 시드 보류 — 작성기 탭에서 적용 확인`)
          }}
        />
      )}
    </section>
  )
}

/* ============================================================
 *  자세히 모달 — 단계/수준 선택 후 매트릭스 셀에 시드 보류 저장
 * ============================================================ */

interface ModalProps {
  technique: Technique
  onClose: () => void
  onApplied: (text: string) => void
}

function TechniqueModal({ technique: t, onClose, onApplied }: ModalProps) {
  const defaultStage = t.stages[0] || 'generate'
  const [stage, setStage] = useState<QuestionStage>(defaultStage)
  const [level, setLevel] = useState<ProficiencyLevel>('mid')

  const apply = () => {
    setPendingSeed({
      techniqueId: t.id,
      techniqueKo: t.ko,
      text: t.transferPrompt,
      stage,
      level,
      createdAt: Date.now(),
    })
    onApplied(t.transferPrompt)
  }

  const visibleStages = STAGED_STAGES.filter((s) => s.key !== 'classify')

  return (
    <div className="techlib__overlay" onClick={onClose}>
      <div
        className="techlib__modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <header className="techlib__modal-head">
          <div>
            <h3 className="techlib__modal-title">
              {t.emoji} {t.ko}
              {t.en && <small>{t.en}</small>}
            </h3>
            <p className="techlib__modal-one">{t.oneLiner}</p>
          </div>
          <button className="btn btn--sm btn--ghost" onClick={onClose}>
            닫기
          </button>
        </header>

        <section className="techlib__modal-body">
          <p className="techlib__modal-desc">{t.desc}</p>

          <h4>📋 실행 절차</h4>
          <ol className="techlib__steps">
            {t.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>

          <h4>🌱 초등 적용 예시</h4>
          <p className="techlib__example">{t.example}</p>

          <h4>🎯 개념전이 프롬프트 (셀 시드용)</h4>
          <p className="techlib__transfer">{t.transferPrompt}</p>

          {t.source && (
            <p className="techlib__source">출처: {t.source}</p>
          )}
        </section>

        <footer className="techlib__modal-foot">
          <div className="techlib__apply">
            <label>
              <span>국면</span>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as QuestionStage)}
              >
                {visibleStages.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.ko} ({s.en})
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>수준</span>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as ProficiencyLevel)}
              >
                {PROFICIENCY_LEVELS.map((l) => (
                  <option key={l.key} value={l.key}>
                    {l.ko}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn btn--primary" onClick={apply}>
              🎯 단계형 작성기 셀에 시드 보류
            </button>
          </div>
          <p className="techlib__apply-hint">
            "보류" 후 <strong>단계형 작성기 탭</strong>으로 이동하면 적용 확인이 뜹니다.
          </p>
        </footer>
      </div>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import {
  STAGED_STAGES,
  PROFICIENCY_LEVELS,
  MAIL_COMPETENCIES,
  KR_QUESTION_ELEMENTS,
  QLEARNING_MODELS,
  LEARNER_DIVERSITIES,
  STAGED_SEED,
  STAGED_SEED_BY_DIVERSITY,
  migrateStagedAssessment,
} from '../domain'
import type {
  StagedAssessment,
  StagedItem,
  QuestionStage,
  ProficiencyLevel,
  MailCompetency,
  KrQuestionElement,
  QLearningModel,
  LearnerDiversity,
  AssessmentDraft,
} from '../domain'
import { createRepo, uid } from '../lib/storage'
import { consumePendingSeed, recommendForCell } from '../lib/techniques'
import { asset } from '../lib/asset'
import type { Technique } from '../lib/techniques'
import { DEFAULT_RUBRIC } from '../domain'
import {
  stagedToMarkdown,
  stagedToAssessmentDraft,
  download,
} from '../lib/exportMd'
import AiGraderPanel from './AiGraderPanel'
import GradingRecordImport from './GradingRecordImport'
import FinalPreview from './FinalPreview'

const stagedRepo = createRepo<StagedAssessment>('kcbc:staged-assessments')
const assessRepo = createRepo<AssessmentDraft>('kcbc:assessments')

function emptyItem(stage: QuestionStage, level: ProficiencyLevel): StagedItem {
  return {
    stage,
    level,
    competency: 'analyze',
    question: '',
    evidence: '',
    scoreHint: '',
  }
}

function blank(): StagedAssessment {
  const now = Date.now()
  return {
    id: uid('sa_'),
    title: '',
    subject: '사회',
    grade: '4학년',
    contextMaterial: '',
    importantQuestion: '',
    learningModel: 'reflect',
    diversity: 'general',
    items: [],
    createdAt: now,
    updatedAt: now,
  }
}

/** UI에 표시할 국면만 (legacy classify / itemize 제외 — 4국면) */
const VISIBLE_STAGES = STAGED_STAGES.filter(
  (s) => s.key !== 'classify' && s.key !== 'itemize',
)

type CellKey = `${QuestionStage}:${ProficiencyLevel}`

/** 개방형 신호 키워드 — 11-12차시 PPT의 "폐쇄형/개방형" 주제 자동 감지 */
const OPEN_RE = /(왜|어떻게|어떤|어디|만약|어떨까|생각|판단|비교|평가|대안|이유|영향|연결|관점)/

function detectOpen(text: string): boolean {
  return OPEN_RE.test(text)
}

export default function StagedAssessmentBuilder() {
  const [d, setD] = useState<StagedAssessment>(() => migrateStagedAssessment(blank()))
  const [activeCell, setActiveCell] = useState<CellKey | null>(null)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [filterMail, setFilterMail] = useState<MailCompetency | 'all'>('all')

  // 자동 저장
  useEffect(() => {
    if (!d.title) return
    const t = setTimeout(
      () => stagedRepo.save({ ...d, updatedAt: Date.now() }),
      1000,
    )
    return () => clearTimeout(t)
  }, [d])

  // 기법 라이브러리에서 보류된 시드 — 마운트 시 한 번 확인
  useEffect(() => {
    const seed = consumePendingSeed()
    if (!seed) return
    const ok = confirm(
      `「${seed.techniqueKo}」 기법의 개념전이 프롬프트를\n` +
      `${seed.stage} × ${seed.level} 셀에 시드로 적용할까요?\n\n` +
      `"${seed.text.slice(0, 80)}${seed.text.length > 80 ? '…' : ''}"`,
    )
    if (ok) {
      setD((x) => {
        const others = x.items.filter(
          (i) => !(i.stage === seed.stage && i.level === seed.level),
        )
        const existing = x.items.find(
          (i) => i.stage === seed.stage && i.level === seed.level,
        )
        const next = existing
          ? { ...existing, question: seed.text }
          : { ...emptyItem(seed.stage, seed.level), question: seed.text }
        return {
          ...x,
          items: [...others, next],
          updatedAt: Date.now(),
        }
      })
      setSavedMsg(`✓ 「${seed.techniqueKo}」 시드 적용됨 → ${seed.stage}×${seed.level} 셀`)
      setTimeout(() => setSavedMsg(null), 4000)
    }
  }, [])

  const itemMap = useMemo(() => {
    const m = new Map<CellKey, StagedItem>()
    d.items.forEach((it) => m.set(`${it.stage}:${it.level}`, it))
    return m
  }, [d.items])

  const getItem = (stage: QuestionStage, level: ProficiencyLevel) =>
    itemMap.get(`${stage}:${level}`) || emptyItem(stage, level)

  const upsertItem = (
    stage: QuestionStage,
    level: ProficiencyLevel,
    patch: Partial<StagedItem>,
  ) =>
    setD((x) => {
      const key = `${stage}:${level}` as CellKey
      const existing = x.items.find(
        (i) => i.stage === stage && i.level === level,
      )
      const next: StagedItem = existing
        ? { ...existing, ...patch }
        : { ...emptyItem(stage, level), ...patch }
      const others = x.items.filter(
        (i) => `${i.stage}:${i.level}` !== key,
      )
      return { ...x, items: [...others, next], updatedAt: Date.now() }
    })

  const seedCell = (stage: QuestionStage, level: ProficiencyLevel) => {
    // 학습자 다양성에 따른 시드 오버라이드 (없으면 기본 시드)
    const div = d.diversity ?? 'general'
    const override = STAGED_SEED_BY_DIVERSITY[div]?.[stage]?.[level]
    const seed = override ?? STAGED_SEED[stage][level]
    upsertItem(stage, level, { question: seed })
  }

  const clearCell = (stage: QuestionStage, level: ProficiencyLevel) => {
    setD((x) => ({
      ...x,
      items: x.items.filter(
        (i) => !(i.stage === stage && i.level === level),
      ),
      updatedAt: Date.now(),
    }))
  }

  const update = <K extends keyof StagedAssessment>(
    k: K,
    v: StagedAssessment[K],
  ) => setD((x) => ({ ...x, [k]: v, updatedAt: Date.now() }))

  const filledCount = d.items.filter((i) => i.question.trim() && i.stage !== 'classify').length
  const totalCells = VISIBLE_STAGES.length * PROFICIENCY_LEVELS.length
  const completion = Math.round((filledCount / totalCells) * 100)

  /** MAIL 5역량별 사용 카운트 — 균형 진단 */
  const mailUsage = useMemo(() => {
    const map: Record<MailCompetency, number> = {
      ethics: 0, access: 0, analyze: 0, participate: 0, create: 0,
    }
    d.items.forEach((it) => {
      if (it.question.trim()) map[it.competency]++
    })
    return map
  }, [d.items])

  /** 균형 점수 0-100: (사용된 역량 수 / 5) × 60 + (가장 큰-가장 작은 격차의 역수) × 40 */
  const balanceScore = useMemo(() => {
    const used = Object.values(mailUsage).filter((c) => c > 0).length
    const coverage = (used / 5) * 60
    const counts = Object.values(mailUsage)
    const max = Math.max(...counts)
    const min = Math.min(...counts.filter((c) => c > 0).concat(max))
    const eveness = max === 0 ? 0 : (1 - (max - min) / Math.max(max, 1)) * 40
    return Math.round(coverage + eveness)
  }, [mailUsage])

  /** 개방형 비율 — 채워진 셀 중 개방형 신호 키워드를 포함한 비율 */
  const openRatio = useMemo(() => {
    const filled = d.items.filter((i) => i.question.trim())
    if (!filled.length) return 0
    const open = filled.filter((i) => detectOpen(i.question)).length
    return Math.round((open / filled.length) * 100)
  }, [d.items])

  const save = () => {
    stagedRepo.save({ ...d, updatedAt: Date.now() })
    setSavedMsg(`저장됨 · ${new Date().toLocaleTimeString('ko-KR')}`)
    setTimeout(() => setSavedMsg(null), 2000)
  }

  const exportMd = () => {
    download(
      `staged_${d.title || 'untitled'}.md`,
      stagedToMarkdown(d),
      'text/markdown',
    )
  }

  const convertToAssessment = () => {
    const itemized = d.items.filter(
      (i) => (i.stage === 'itemize' || i.stage === 'refine') && i.question,
    )
    if (!itemized.length) {
      alert('변환할 항목이 없습니다. ‘정교화’ 또는 ‘평가화’ 단계에 최소 1개 셀을 작성하세요.')
      return
    }
    const existing = assessRepo.list()
    const baseNo = existing.length + 1
    const draft = stagedToAssessmentDraft(d, baseNo)
    const full: AssessmentDraft = { ...draft, id: uid('a_') }
    assessRepo.save(full)
    setSavedMsg(
      `‘평가 문항 빌더’에 #${baseNo}로 저장됨 — 탭을 전환해 확인하세요.`,
    )
    setTimeout(() => setSavedMsg(null), 4000)
  }

  const active = activeCell
    ? (() => {
        const [stage, level] = activeCell.split(':') as [
          QuestionStage,
          ProficiencyLevel,
        ]
        return { stage, level, item: getItem(stage, level) }
      })()
    : null

  const matchFilter = (it: StagedItem) =>
    filterMail === 'all' || it.competency === filterMail

  return (
    <section className="builder">
      <div className="builder__head">
        <div>
          <h2 className="builder__title">🧭 단계형 평가문항 작성기</h2>
          <p className="builder__desc">
            <span className="qschool-crumb">「질문하는 학교」 → 질문 배우기 → 학생 질문 능력 계발 모델</span>
            <br />
            <strong>질문 5국면</strong>(생성 → 정교화 → 탐구 → 평가화 → 성찰) ×{' '}
            <strong>PISA 3 숙련도</strong>(낮·중·높) 매트릭스. OECD MAIL 5역량 +
            한국 5요소(정혜승) 태그로 평가 균형을 점검합니다.
          </p>
        </div>
        <div className="builder__actions">
          <button className="btn btn--ghost" onClick={() => setD(blank())}>
            새 작성지
          </button>
        </div>
      </div>

      {savedMsg && <div className="toast">{savedMsg}</div>}

      {/* 컨텍스트 폼 */}
      <div className="form" style={{ marginBottom: 18 }}>
        <div className="form__row form__row--3">
          <label>
            <span>주제 / 제목</span>
            <input
              value={d.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="예: 행복동의 빈집 문제"
            />
          </label>
          <label>
            <span>교과</span>
            <input
              value={d.subject}
              onChange={(e) => update('subject', e.target.value)}
              placeholder="예: 사회"
            />
          </label>
          <label>
            <span>학년</span>
            <input
              value={d.grade}
              onChange={(e) => update('grade', e.target.value)}
              placeholder="예: 4학년"
            />
          </label>
        </div>
        <label>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span>⭐ 단원을 관통하는 ‘중요한 질문’ (= 질문 초점)</span>
            <a
              href={asset('/question-focus-worksheet.html')}
              target="_blank"
              rel="noreferrer"
              className="qfocus-link"
              title="질문 초점 6기준 자기점검 워크시트 (A4 인쇄용) — 토론·전이·계속·확장·개방·고차사고"
            >
              📝 질문 초점
            </a>
            <a
              href={asset('/grasps-worksheet.html')}
              target="_blank"
              rel="noreferrer"
              className="qfocus-link"
              title="GRASPS 6요소 실제적 평가 설계 워크시트 (McTighe & Wiggins UbD)"
              style={{ background: '#F0FDFA', color: 'var(--teal)', borderColor: '#99f6e4' }}
            >
              📋 GRASPS
            </a>
          </span>
          <input
            value={d.importantQuestion}
            onChange={(e) => update('importantQuestion', e.target.value)}
            placeholder="단원 전체를 관통하고, 정답이 하나가 아니며, 학생 삶과 연결되는 질문"
          />
        </label>

        {/* 「학생 질문 능력 계발 모델」 4유형 선택 */}
        <label>
          <span>
            🏷 적용 모델 (이화여대 산학협력단 「학생 질문 능력 계발 모델」)
          </span>
          <div className="model-pick">
            {QLEARNING_MODELS.map((m) => (
              <button
                key={m.key}
                type="button"
                className={
                  d.learningModel === m.key
                    ? 'model-pick__btn is-on'
                    : 'model-pick__btn'
                }
                onClick={() => update('learningModel', m.key)}
                title={`${m.ko} — ${m.desc}`}
              >
                <strong>{m.ko}</strong>
                <small>{m.focus}</small>
              </button>
            ))}
          </div>
        </label>

        {/* 학습자 다양성 토글 — 시드 문구 변형 */}
        <label>
          <span>
            👥 학습자 다양성 (모델 책 「학생 다양성 기반 질문 중심 수업 모델」)
            <small style={{ color: 'var(--muted)', marginLeft: 6 }}>
              시드 문구가 학습자 맥락에 맞게 바뀝니다
            </small>
          </span>
          <div className="seg">
            {LEARNER_DIVERSITIES.map((dv) => (
              <button
                key={dv.key}
                type="button"
                className={
                  (d.diversity ?? 'general') === dv.key
                    ? 'seg__btn is-on'
                    : 'seg__btn'
                }
                onClick={() => update('diversity', dv.key)}
                title={dv.desc}
              >
                {dv.emoji} {dv.ko}
              </button>
            ))}
          </div>
        </label>
        <label>
          <span>자료 / 맥락 (정량·정성·실제 사례 등)</span>
          <textarea
            rows={3}
            value={d.contextMaterial}
            onChange={(e) => update('contextMaterial', e.target.value)}
            placeholder={
              '예) 행복동 빈집 비율 32% / 독거노인 비율 41%\n' +
              '"동네가 너무 빨리 변하지 않았으면 좋겠다" — 행복동 거주 70세 주민 인터뷰'
            }
          />
        </label>
      </div>

      {/* 진단 게이지 — 완성도 + 균형 점수 + 개방형 비율 */}
      <div className="staged__diagnostics">
        <div className="diag-card">
          <div className="diag-card__label">완성도</div>
          <div className="diag-card__value">
            {filledCount}<small>/{totalCells}</small>
          </div>
          <div className="diag-card__bar">
            <div className="diag-card__fill diag-card__fill--brand" style={{ width: `${completion}%` }} />
          </div>
        </div>
        <div className="diag-card">
          <div className="diag-card__label">
            MAIL 균형 점수
            <span className="diag-card__hint" title="5역량 모두 사용 + 고른 분포일수록 100점">ⓘ</span>
          </div>
          <div className="diag-card__value" style={{ color: balanceScore >= 70 ? 'var(--green)' : balanceScore >= 40 ? 'var(--amber)' : 'var(--rose)' }}>
            {balanceScore}<small>/100</small>
          </div>
          <div className="diag-card__bar">
            <div className={`diag-card__fill ${balanceScore >= 70 ? 'diag-card__fill--green' : balanceScore >= 40 ? 'diag-card__fill--amber' : 'diag-card__fill--rose'}`} style={{ width: `${balanceScore}%` }} />
          </div>
        </div>
        <div className="diag-card">
          <div className="diag-card__label">
            개방형 신호
            <span className="diag-card__hint" title="‘왜·어떻게·생각·비교·판단’ 등 사고를 여는 키워드 포함 비율">ⓘ</span>
          </div>
          <div className="diag-card__value" style={{ color: openRatio >= 70 ? 'var(--green)' : openRatio >= 40 ? 'var(--amber)' : 'var(--rose)' }}>
            {openRatio}<small>%</small>
          </div>
          <div className="diag-card__bar">
            <div className={`diag-card__fill ${openRatio >= 70 ? 'diag-card__fill--green' : openRatio >= 40 ? 'diag-card__fill--amber' : 'diag-card__fill--rose'}`} style={{ width: `${openRatio}%` }} />
          </div>
        </div>
      </div>

      {/* MAIL 5역량 균형 막대 + 필터 (클릭시 해당 역량만 강조) */}
      <div className="mail-bar">
        <button
          className={filterMail === 'all' ? 'mail-bar__all is-on' : 'mail-bar__all'}
          onClick={() => setFilterMail('all')}
          title="필터 해제"
        >
          전체
        </button>
        {MAIL_COMPETENCIES.map((m) => {
          const n = mailUsage[m.key]
          const missing = n === 0
          return (
            <button
              key={m.key}
              className={
                `mail-bar__chip mail-bar__chip--${m.cssTag}` +
                (filterMail === m.key ? ' is-on' : '') +
                (missing ? ' is-missing' : '')
              }
              onClick={() => setFilterMail(filterMail === m.key ? 'all' : m.key)}
              title={`${m.ko} — ${n}개 사용${missing ? ' (이 역량을 평가하는 질문이 없습니다)' : ''}`}
            >
              <span className="mail-bar__name">{m.short}</span>
              <span className="mail-bar__count">{n}</span>
            </button>
          )
        })}
        {balanceScore === 100 && (
          <span className="mail-bar__bonus">🏆 균형 완성</span>
        )}
      </div>

      {/* 매트릭스 */}
      <div className="staged__wrap">
        <div className="staged__grid">
          {/* 헤더 행 */}
          <div className="staged__corner">수준 \ 단계</div>
          {VISIBLE_STAGES.map((s) => (
            <div key={s.key} className="staged__colhead" title={s.hint}>
              <span className="staged__colko">{s.ko}</span>
              <span className="staged__colen">{s.en}</span>
            </div>
          ))}

          {/* 본문 행 */}
          {PROFICIENCY_LEVELS.map((lv) => (
            <RowFragment
              key={lv.key}
              level={lv.key}
              levelKo={lv.ko}
              levelDesc={lv.desc}
              getItem={getItem}
              activeCell={activeCell}
              setActiveCell={setActiveCell}
              seedCell={seedCell}
              clearCell={clearCell}
              matchFilter={matchFilter}
            />
          ))}
        </div>

        {/* 셀 에디터 */}
        {active && (
          <CellEditor
            stage={active.stage}
            level={active.level}
            item={active.item}
            model={d.learningModel}
            onPatch={(p) => upsertItem(active.stage, active.level, p)}
            onClose={() => setActiveCell(null)}
            onClear={() => {
              clearCell(active.stage, active.level)
              setActiveCell(null)
            }}
          />
        )}
      </div>

      <div className="form__actions" style={{ marginTop: 18 }}>
        <button
          className="btn btn--primary"
          onClick={save}
          disabled={!d.title}
        >
          💾 저장
        </button>
        <button className="btn" onClick={exportMd}>
          📄 MD 내보내기
        </button>
        <button
          className="btn btn--primary"
          onClick={convertToAssessment}
          title="4국면 매트릭스의 ‘정교화’ 셀을 서·논술형 문항 + 루브릭으로 자동 조립. 평가화는 국면이 아닌 다리(bridge)."
        >
          🔧 평가문항으로 변환 (다리)
        </button>
      </div>

      {/* 최종 평가문항 실시간 미리보기 */}
      <FinalPreview draft={d} />

      {/* AI 채점 토큰 가시화 패널 — itemize/refine 셀들을 즉석에서 채점 */}
      <AiGraderPanel
        question={{
          questionPrompt: d.importantQuestion || '단원의 중요한 질문',
          subQuestions: d.items
            .filter((it) => it.stage === 'itemize' || it.stage === 'refine')
            .filter((it) => it.question.trim())
            .map((it) => ({
              text: it.question,
              score: it.level === 'high' ? 5 : it.level === 'mid' ? 3 : 2,
            })),
          rubric: DEFAULT_RUBRIC,
          totalScore: d.items
            .filter((it) => it.stage === 'itemize' || it.stage === 'refine')
            .filter((it) => it.question.trim())
            .reduce(
              (a, it) =>
                a + (it.level === 'high' ? 5 : it.level === 'mid' ? 3 : 2),
              0,
            ) || 8,
          materialText: d.contextMaterial,
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

/* ============================================================
 *  행 컴포넌트 — 한 숙련도 행의 4개 셀
 * ============================================================ */

interface RowProps {
  level: ProficiencyLevel
  levelKo: string
  levelDesc: string
  getItem: (s: QuestionStage, l: ProficiencyLevel) => StagedItem
  activeCell: CellKey | null
  setActiveCell: (k: CellKey | null) => void
  seedCell: (s: QuestionStage, l: ProficiencyLevel) => void
  clearCell: (s: QuestionStage, l: ProficiencyLevel) => void
  matchFilter: (it: StagedItem) => boolean
}

function RowFragment(p: RowProps) {
  return (
    <>
      <div className={`staged__rowhead staged__rowhead--${p.level}`}>
        <span className="staged__lvko">{p.levelKo}</span>
        <span className="staged__lvdesc">{p.levelDesc}</span>
      </div>
      {VISIBLE_STAGES.map((s) => {
        const item = p.getItem(s.key, p.level)
        const isActive = p.activeCell === `${s.key}:${p.level}`
        const filled = !!item.question.trim()
        const dim = filled && !p.matchFilter(item)
        const mail = MAIL_COMPETENCIES.find((m) => m.key === item.competency)!
        return (
          <button
            key={s.key}
            className={
              'staged__cell' +
              (filled ? ' is-filled' : '') +
              (isActive ? ' is-active' : '') +
              (dim ? ' is-dim' : '')
            }
            onClick={() => p.setActiveCell(`${s.key}:${p.level}`)}
          >
            {filled ? (
              <>
                <div className="staged__cell-tags">
                  <span className={`badge badge--${mail.cssTag}`}>{mail.short}</span>
                  {item.krElement && (
                    <span
                      className="staged__kr-chip"
                      title={`한국 5요소: ${KR_QUESTION_ELEMENTS.find((k) => k.key === item.krElement)?.ko}`}
                    >
                      {KR_QUESTION_ELEMENTS.find((k) => k.key === item.krElement)?.short}
                    </span>
                  )}
                  {detectOpen(item.question) && (
                    <span
                      className="staged__open-dot"
                      title="개방형 신호 키워드 포함 (왜·어떻게·생각 등)"
                    >
                      ◉ 개방
                    </span>
                  )}
                </div>
                <p className="staged__qtext">{item.question}</p>
              </>
            ) : (
              <span className="staged__empty">
                <span className="staged__plus">＋</span>
                <span>셀 작성</span>
                <span
                  className="staged__seedbtn"
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    p.seedCell(s.key, p.level)
                  }}
                >
                  시드
                </span>
              </span>
            )}
          </button>
        )
      })}
    </>
  )
}

/* ============================================================
 *  셀 에디터
 * ============================================================ */

interface EditorProps {
  stage: QuestionStage
  level: ProficiencyLevel
  item: StagedItem
  model?: QLearningModel
  onPatch: (p: Partial<StagedItem>) => void
  onClose: () => void
  onClear: () => void
}

function CellEditor(p: EditorProps) {
  const stage = STAGED_STAGES.find((s) => s.key === p.stage)!
  const level = PROFICIENCY_LEVELS.find((l) => l.key === p.level)!
  const recs: Technique[] = useMemo(
    () => recommendForCell(p.stage, p.model, 4),
    [p.stage, p.model],
  )
  const applyTechnique = (t: Technique) => {
    p.onPatch({ question: t.transferPrompt })
  }
  return (
    <div className="staged__editor">
      <div className="staged__editor-head">
        <div>
          <strong>
            {stage.ko} × {level.ko}
          </strong>
          <span className="staged__editor-hint">{stage.hint}</span>
        </div>
        <div className="staged__editor-actions">
          <button className="btn btn--ghost btn--sm" onClick={p.onClear}>
            셀 비우기
          </button>
          <button className="btn btn--sm" onClick={p.onClose}>
            닫기
          </button>
        </div>
      </div>
      <div className="staged__editor-body">
        <label>
          <span>학생용 질문</span>
          <textarea
            rows={2}
            value={p.item.question}
            onChange={(e) => p.onPatch({ question: e.target.value })}
            placeholder={stage.prompt}
          />
        </label>
        <label>
          <span>응답에 보여야 할 증거 (학생이 무엇으로 답할까)</span>
          <textarea
            rows={2}
            value={p.item.evidence}
            onChange={(e) => p.onPatch({ evidence: e.target.value })}
            placeholder="예) 자료 A의 통계 수치 + 자료 B의 인터뷰 1개를 인용"
          />
        </label>
        <label>
          <span>채점 힌트 (서·논술형 변환 시 루브릭에 반영)</span>
          <input
            value={p.item.scoreHint}
            onChange={(e) => p.onPatch({ scoreHint: e.target.value })}
            placeholder="예) 두 자료를 ‘연결’해 인과관계로 서술"
          />
        </label>
        <label>
          <span>MAIL 역량 태그 (OECD PISA 2029)</span>
          <div className="seg">
            {MAIL_COMPETENCIES.map((m) => (
              <button
                key={m.key}
                className={
                  p.item.competency === m.key ? 'seg__btn is-on' : 'seg__btn'
                }
                onClick={() => p.onPatch({ competency: m.key })}
                title={m.ko}
              >
                {m.short}
              </button>
            ))}
          </div>
        </label>

        <details className="adv-tag">
          <summary>
            <span className="adv-tag__label">
              ▸ 고급 태그 · 한국 5요소 (정혜승 2022·2024)
            </span>
            {p.item.krElement && (
              <span className="adv-tag__on">
                {KR_QUESTION_ELEMENTS.find((k) => k.key === p.item.krElement)?.short} 사용 중
              </span>
            )}
          </summary>
          <div className="seg" style={{ marginTop: 8 }}>
            <button
              type="button"
              className={!p.item.krElement ? 'seg__btn is-on' : 'seg__btn'}
              onClick={() => p.onPatch({ krElement: undefined })}
            >
              —
            </button>
            {KR_QUESTION_ELEMENTS.map((k) => (
              <button
                key={k.key}
                type="button"
                className={
                  p.item.krElement === k.key ? 'seg__btn is-on' : 'seg__btn'
                }
                onClick={() => p.onPatch({ krElement: k.key })}
                title={`${k.ko} — ${k.desc}`}
              >
                {k.short}
              </button>
            ))}
          </div>
        </details>

        {/* 추천 기법 (모델 × 국면) */}
        <div className="reco">
          <div className="reco__head">
            <span className="reco__title">
              💡 이 셀에 어울리는 기법
              <small>
                {p.model
                  ? ` · ${QLEARNING_MODELS.find((m) => m.key === p.model)?.ko} × ${stage.ko}`
                  : ' · 모델 미선택 → 일반 fallback'}
              </small>
            </span>
            <span className="reco__count">{recs.length}개</span>
          </div>
          {recs.length === 0 ? (
            <p className="reco__empty">
              적용 모델을 골라 보세요 — 그 모델에 어울리는 기법이 여기 추천됩니다.
            </p>
          ) : (
            <div className="reco__list">
              {recs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="reco__chip"
                  onClick={() => applyTechnique(t)}
                  title={`${t.oneLiner}\n\n클릭 → 이 셀의 질문에 시드 적용`}
                >
                  <span className="reco__chipEmoji">{t.emoji}</span>
                  <span className="reco__chipName">{t.ko}</span>
                  {t.source?.includes('「학생 질문 능력 계발 모델」') && (
                    <span className="reco__chipMark" title="모델 책 직접 출처">
                      ★
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          <p className="reco__hint">
            기법을 누르면 그 기법의 개념전이 프롬프트가 ‘학생용 질문’에 자동 입력됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}

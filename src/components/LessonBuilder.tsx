import { useEffect, useMemo, useState } from 'react'
import type { LessonDraft, StageDraft, KnowledgeType } from '../domain'
import { STAGE_NAMES, STAGE_EN } from '../domain'
import { createRepo, uid } from '../lib/storage'
import { lessonToMarkdown, download } from '../lib/exportMd'
import TagInput from './TagInput'

const repo = createRepo<LessonDraft>('kcbc:lessons')

function blankStages(): StageDraft[] {
  return STAGE_NAMES.map((ko, i) => ({
    num: (i + 1) as StageDraft['num'],
    ko,
    activity: '',
    question: '',
  }))
}

function blank(): LessonDraft {
  const now = Date.now()
  return {
    id: uid('lesson_'),
    title: '',
    subject: '',
    grade: '',
    knowledgeType: '명제적',
    studentImage: '',
    values: [],
    macroLens: '',
    microConcepts: [],
    skills: [],
    generalization: '',
    stages: blankStages(),
    evaluation: { task: '', rubric: [], formative: '' },
    createdAt: now,
    updatedAt: now,
  }
}

/** 사회/지리 명제적 예시 채우기 */
function preset사회(): LessonDraft {
  const d = blank()
  d.title = '우리나라의 지리 환경'
  d.subject = '사회'
  d.grade = '초등 5학년'
  d.knowledgeType = '명제적'
  d.studentImage =
    '지리 환경과 인간 생활의 관계를 개념적으로 설명하고, 자신이 사는 지역의 특성을 비판적으로 해석할 수 있는 시민적 사고자'
  d.values = ['상호의존성', '지역 다양성 존중', '지속가능성에 대한 책임감']
  d.macroLens = '상호작용 (Interaction)'
  d.microConcepts = ['지형', '기후', '자원', '인간생활', '지역성']
  d.skills = [
    '지도·통계 자료 읽기·해석하기',
    '사례 간 비교·분류',
    '개념 간 관계를 일반화 문장으로 진술하기',
    '다른 지역에 전이 적용하기',
  ]
  d.generalization = '지리적 환경은 인간의 생활 양식과 경제활동을 형성한다.'
  d.stages = [
    { num: 1, ko: '관계 맺기', activity: '우리 동네 사진 보며 지형·기후 떠올리기', question: '내가 사는 곳은 왜 이런 모습일까?' },
    { num: 2, ko: '집중하기', activity: '"상호작용" 개념 카드 도입', question: '지리 환경과 사람은 어떻게 영향을 주고받을까?' },
    { num: 3, ko: '조사하기', activity: '강원도/제주도/수도권 자료 비교', question: '각 지역의 환경과 생활은 어떻게 다른가?' },
    { num: 4, ko: '조직·정리', activity: '환경 ↔ 생활 매트릭스 작성', question: '어떤 패턴이 보이는가?' },
    { num: 5, ko: '일반화', activity: '일반화 진술문 도출', question: '지리적 환경은 인간의 생활에 어떻게 작용하는가?' },
    { num: 6, ko: '전이', activity: '울릉도 사례에 적용', question: '이 지역의 생활은 환경으로 어떻게 설명되는가?' },
    { num: 7, ko: '성찰', activity: '학습 일지·개념 이해 점검', question: '내가 이전과 다르게 보게 된 것은 무엇인가?' },
  ]
  d.evaluation = {
    task: '"우리 지역 환경이 만든 생활 모습" 1쪽 논평 쓰기',
    rubric: ['개념적 일반화의 명료성', '자료 근거의 적절성', '전이의 깊이'],
    formative: '매 차시 안내질문에 대한 짧은 응답·일반화 진술문 수정',
  }
  return d
}

/** 수학/분수 절차적 예시 채우기 */
function preset수학(): LessonDraft {
  const d = blank()
  d.title = '분수의 덧셈과 뺄셈'
  d.subject = '수학'
  d.grade = '초등 5학년'
  d.knowledgeType = '절차적'
  d.studentImage =
    '분수의 계산 절차를 이해하며 수행하고, 절차의 의미를 다른 문제 상황에 전이할 수 있는 수학적 사고자'
  d.values = ['원리의 이해', '자기조절적 수행', '오류를 통한 학습의 가치']
  d.macroLens = '동치 (Equivalence) · 단위 (Unit)'
  d.microConcepts = ['통분', '약분', '분모·분자', '연산의 일관성']
  d.skills = [
    '단위 만들기 (공통분모 찾기)',
    '연산 절차 수행',
    '어림으로 결과 타당성 검토',
    '그림·식·말로 다중 표상',
  ]
  d.generalization =
    '분수의 덧셈과 뺄셈은 단위(분모)를 같게 만든 후 단위의 개수(분자)를 더하거나 빼는 절차이다.'
  d.stages = [
    { num: 1, ko: '관계 맺기', activity: '피자 1/2 + 1/3 상황 토론', question: '왜 분자만 그냥 더하면 안 될까?' },
    { num: 2, ko: '집중하기', activity: '"단위가 같아야 더할 수 있다" 개념 도입', question: '더할 수 있는 조건은 무엇인가?' },
    { num: 3, ko: '조사하기', activity: '띠 모형·수직선으로 다양한 분수 더하기 시도', question: '단위가 다르면 어떻게 맞출 수 있을까?' },
    { num: 4, ko: '조직·정리', activity: '통분 절차 단계화 (공통분모 → 분자 연산 → 약분)', question: '이 순서는 왜 필요한가?' },
    { num: 5, ko: '일반화', activity: '일반화 진술문 도출', question: '이 절차는 어떤 원리로 작동하는가?' },
    { num: 6, ko: '전이', activity: '대분수·세 분수 덧셈, 분수 방정식에 적용', question: '이 절차는 어디까지 통할까?' },
    { num: 7, ko: '성찰', activity: '오류 분석 일지, 절차 흐름도 작성', question: '내가 자주 놓치는 단계는 무엇인가?' },
  ]
  d.evaluation = {
    task: '모형·식·말 세 가지 표상으로 1/2 + 2/3 을 설명',
    rubric: ['절차의 정확성', '절차의 개념적 정당화 (왜 통분하는가)', '자기점검·오류 수정 능력'],
    formative: '단계별 화이트보드 풀이 관찰, 절차 흐름도 산출물',
  }
  return d
}

export default function LessonBuilder({ onSaved }: { onSaved?: () => void }) {
  const [draft, setDraft] = useState<LessonDraft>(blank())
  const [savedMsg, setSavedMsg] = useState<string | null>(null)

  const update = <K extends keyof LessonDraft>(k: K, v: LessonDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v, updatedAt: Date.now() }))

  const updateStage = (i: number, patch: Partial<StageDraft>) =>
    setDraft((d) => ({
      ...d,
      stages: d.stages.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
      updatedAt: Date.now(),
    }))

  const updateEval = <K extends keyof LessonDraft['evaluation']>(
    k: K,
    v: LessonDraft['evaluation'][K],
  ) =>
    setDraft((d) => ({
      ...d,
      evaluation: { ...d.evaluation, [k]: v },
      updatedAt: Date.now(),
    }))

  const validation = useMemo(() => {
    const missing: string[] = []
    if (!draft.title) missing.push('단원명')
    if (!draft.studentImage) missing.push('학생상')
    if (!draft.macroLens) missing.push('렌즈 개념')
    if (draft.microConcepts.length < 2) missing.push('단원 개념(2개 이상)')
    if (!draft.generalization) missing.push('일반화 진술문')
    const filledStages = draft.stages.filter((s) => s.activity || s.question).length
    if (filledStages < 5) missing.push(`7단계 중 최소 5단계 작성 (현재 ${filledStages})`)
    return missing
  }, [draft])

  const save = () => {
    repo.save({ ...draft, updatedAt: Date.now() })
    setSavedMsg(`저장됨 · ${new Date().toLocaleTimeString('ko-KR')}`)
    setTimeout(() => setSavedMsg(null), 2000)
    onSaved?.()
  }

  const exportMd = () => {
    const md = lessonToMarkdown(draft)
    download(`${draft.title || 'lesson'}.md`, md, 'text/markdown')
  }

  const exportJson = () => {
    download(`${draft.title || 'lesson'}.json`, JSON.stringify(draft, null, 2), 'application/json')
  }

  // 자동 저장 (1초 디바운스, 단원명이 있을 때만)
  useEffect(() => {
    if (!draft.title) return
    const t = setTimeout(() => repo.save({ ...draft, updatedAt: Date.now() }), 1000)
    return () => clearTimeout(t)
  }, [draft])

  return (
    <section className="builder">
      <div className="builder__head">
        <div>
          <h2 className="builder__title">
            📝 수업안 빌더
            <a
              href={`${import.meta.env.BASE_URL}socraai-lesson-plan.html`}
              target="_blank"
              rel="noreferrer"
              className="qfocus-link"
              style={{ marginLeft: 8 }}
              title="AI와 함께하는 비판적 미디어 탐구 — 실제 수업 지도안 예시"
            >
              🎓 예시 지도안
            </a>
            <a
              href={`${import.meta.env.BASE_URL}references/concept-inquiry-index.html`}
              target="_blank"
              rel="noreferrer"
              className="qfocus-link"
              style={{ marginLeft: 6, background: '#F0FDFA', color: 'var(--teal)', borderColor: '#99f6e4' }}
              title="개념기반 탐구수업 — 사실 → 개념 → 전이 3단계"
            >
              🔍 개념기반 탐구
            </a>
          </h2>
          <p className="builder__desc">
            KCBC 5대 요소 + 7단계를 그대로 채우면, 일반화 진술문이 잘 드러난 단원안이 됩니다.
          </p>
        </div>
        <div className="builder__actions">
          <button className="btn btn--ghost" onClick={() => setDraft(preset사회())}>
            예시: 사회 (명제적)
          </button>
          <button className="btn btn--ghost" onClick={() => setDraft(preset수학())}>
            예시: 수학 (절차적)
          </button>
          <button className="btn btn--ghost" onClick={() => setDraft(blank())}>
            새로 시작
          </button>
        </div>
      </div>

      {savedMsg && <div className="toast">{savedMsg}</div>}

      <div className="builder__grid">
        {/* 좌측: 폼 */}
        <div className="form">
          <div className="form__row form__row--3">
            <label>
              <span>단원명 *</span>
              <input
                value={draft.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="예: 우리나라의 지리 환경"
              />
            </label>
            <label>
              <span>교과</span>
              <input
                value={draft.subject}
                onChange={(e) => update('subject', e.target.value)}
                placeholder="사회, 수학, ..."
              />
            </label>
            <label>
              <span>학년</span>
              <input
                value={draft.grade}
                onChange={(e) => update('grade', e.target.value)}
                placeholder="초등 5학년"
              />
            </label>
          </div>

          <div className="form__row">
            <label>
              <span>지식 유형</span>
              <div className="seg">
                {(['명제적', '절차적'] as KnowledgeType[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={draft.knowledgeType === k ? 'seg__btn is-on' : 'seg__btn'}
                    onClick={() => update('knowledgeType', k)}
                  >
                    {k} 지식
                  </button>
                ))}
              </div>
            </label>
          </div>

          <fieldset className="form__group">
            <legend>① 학생상 · 핵심가치</legend>
            <label>
              <span>학생상</span>
              <textarea
                rows={2}
                value={draft.studentImage}
                onChange={(e) => update('studentImage', e.target.value)}
                placeholder="이 수업이 끝났을 때 학생은 어떤 모습으로 성장하는가?"
              />
            </label>
            <label>
              <span>핵심가치 (엔터로 추가)</span>
              <TagInput
                values={draft.values}
                onChange={(v) => update('values', v)}
                placeholder="예: 상호의존성"
              />
            </label>
          </fieldset>

          <fieldset className="form__group">
            <legend>② 핵심개념 · 핵심기능</legend>
            <label>
              <span>렌즈 개념 (Macro)</span>
              <input
                value={draft.macroLens}
                onChange={(e) => update('macroLens', e.target.value)}
                placeholder="상호작용 / 동치 / 변화 ..."
              />
            </label>
            <label>
              <span>단원 개념 (Micro, 2개 이상)</span>
              <TagInput
                values={draft.microConcepts}
                onChange={(v) => update('microConcepts', v)}
                placeholder="지형, 기후, 자원 ..."
              />
            </label>
            <label>
              <span>핵심기능</span>
              <TagInput
                values={draft.skills}
                onChange={(v) => update('skills', v)}
                placeholder="자료 해석 / 비교·분류 ..."
              />
            </label>
          </fieldset>

          <fieldset className="form__group">
            <legend>③ 7단계 교수 설계</legend>
            {draft.stages.map((s, i) => (
              <div key={s.num} className={`stage ${s.num === 5 ? 'stage--star' : ''}`}>
                <div className="stage__head">
                  <span className="stage__num">{s.num}</span>
                  <span className="stage__name">{s.ko}</span>
                  <span className="stage__en">{STAGE_EN[i]}</span>
                  {s.num === 5 && <span className="stage__star">★ 일반화</span>}
                </div>
                <div className="stage__body">
                  <label>
                    <span>학습 활동</span>
                    <input
                      value={s.activity}
                      onChange={(e) => updateStage(i, { activity: e.target.value })}
                      placeholder="이 단계에서 할 활동"
                    />
                  </label>
                  <label>
                    <span>안내 질문</span>
                    <input
                      value={s.question}
                      onChange={(e) => updateStage(i, { question: e.target.value })}
                      placeholder='"...?"'
                    />
                  </label>
                </div>
              </div>
            ))}
          </fieldset>

          <fieldset className="form__group">
            <legend>④ 일반화 진술문 (★ KCBC 핵심)</legend>
            <textarea
              rows={2}
              value={draft.generalization}
              onChange={(e) => update('generalization', e.target.value)}
              placeholder='"A는 B를 ___ 한다." 두 개 이상의 개념을 연결한 한 문장으로'
            />
          </fieldset>

          <fieldset className="form__group">
            <legend>⑤ 평가</legend>
            <label>
              <span>수행 과제</span>
              <textarea
                rows={2}
                value={draft.evaluation.task}
                onChange={(e) => updateEval('task', e.target.value)}
              />
            </label>
            <label>
              <span>루브릭 기준</span>
              <TagInput
                values={draft.evaluation.rubric}
                onChange={(v) => updateEval('rubric', v)}
                placeholder="예: 개념적 일반화의 명료성"
              />
            </label>
            <label>
              <span>형성평가</span>
              <input
                value={draft.evaluation.formative}
                onChange={(e) => updateEval('formative', e.target.value)}
              />
            </label>

            {/* GRASPS 6요소 (선택) — 실제적 평가 설계 */}
            <details className="grasps-fold">
              <summary>
                <span className="grasps-fold__label">
                  ▸ GRASPS 6요소 — 실제적 평가 설계 (McTighe & Wiggins UbD)
                </span>
                <a
                  href="/grasps-worksheet.html"
                  target="_blank"
                  rel="noreferrer"
                  className="qfocus-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  📋 워크시트
                </a>
              </summary>
              <div className="grasps-fields">
                {(
                  [
                    ['goal',      'G · 목표 (Goal)',       '학생이 해결해야 할 도전 과제 · 무엇을 성취해야 하는가?'],
                    ['role',      'R · 역할 (Role)',       '학생이 맡을 실제 역할 · 기자·시장·설계자·시민 등'],
                    ['audience',  'A · 청중 (Audience)',   '결과물을 받아볼 대상 · 급우가 아닌 실제 대상일수록 강력'],
                    ['situation', 'S · 상황 (Situation)',  '과제가 벌어지는 배경 · 제약(시간·자원·정책)'],
                    ['product',   'P · 산출물 (Product)',  '학생이 만들 구체적 결과물 · 보고서·안내지·설계도 등'],
                    ['standards', 'S · 기준 (Standards)',  '평가 준거 · 루브릭 + 성공 지표'],
                  ] as const
                ).map(([key, label, hint]) => (
                  <label key={key}>
                    <span>{label}</span>
                    <input
                      value={draft.evaluation.grasps?.[key] || ''}
                      onChange={(e) => {
                        const cur = draft.evaluation.grasps || {
                          goal: '', role: '', audience: '',
                          situation: '', product: '', standards: '',
                        }
                        updateEval('grasps', { ...cur, [key]: e.target.value })
                      }}
                      placeholder={hint}
                    />
                  </label>
                ))}
              </div>
            </details>
          </fieldset>

          <div className="form__actions">
            <button className="btn btn--primary" onClick={save} disabled={!draft.title}>
              💾 저장
            </button>
            <button className="btn" onClick={exportMd}>📄 MD 내보내기</button>
            <button className="btn" onClick={exportJson}>{`{ }`} JSON 내보내기</button>
          </div>

          {validation.length > 0 && (
            <div className="validation">
              <strong>완성도 점검</strong>
              <ul>
                {validation.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 우측: 실시간 MD 미리보기 */}
        <aside className="preview">
          <div className="preview__head">
            <strong>실시간 마크다운</strong>
            <span className="preview__hint">자동 저장 활성</span>
          </div>
          <pre className="preview__md">{lessonToMarkdown(draft)}</pre>
        </aside>
      </div>
    </section>
  )
}

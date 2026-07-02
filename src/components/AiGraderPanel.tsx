import { useEffect, useMemo, useState } from 'react'
import {
  MODEL_REGISTRY,
  loadSettings,
  saveSettings,
  grade,
  findModel,
  formatUsd,
  formatKrw,
  costUsd,
} from '../lib/aiGrader'
import type {
  AiSettings,
  GradeRequest,
  GradeResult,
  Provider,
} from '../lib/aiGrader'
import {
  TOKEN_TIERS,
  parseGradeFromText,
  tierFor,
  awardTokens,
  getAccount,
  nextRewardOf,
  loadGoals,
} from '../lib/tokenEconomy'
import type { StudentTokenAccount } from '../lib/tokenEconomy'
import type { KrGrade, GradingRecord } from '../domain'
import { createRepo, uid } from '../lib/storage'

const gradeRepo = createRepo<GradingRecord>('kcbc:grading-records')

interface Props {
  /** 문항 데이터 (AssessmentBuilder / StagedAssessmentBuilder 양쪽에서 호출) */
  question: GradeRequest
  /** 컴팩트 모드 (설명/경고 줄임) */
  compact?: boolean
}

/**
 * AI 채점 토큰 가시화 패널.
 * OECD DEO 2026 "AI 과의존" 우려에 직접 대응 — 사용 토큰·비용을 항상 노출.
 */
export default function AiGraderPanel({ question, compact = false }: Props) {
  const [settings, setSettings] = useState<AiSettings>(() => loadSettings())
  const [showSettings, setShowSettings] = useState(false)
  const [studentAnswer, setStudentAnswer] = useState('')
  const [studentLabel, setStudentLabel] = useState('')
  const [result, setResult] = useState<GradeResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [tokenMsg, setTokenMsg] = useState<string | null>(null)
  const [account, setAccount] = useState<StudentTokenAccount | null>(null)

  // 설정 변경시 자동 저장 (키는 persistKey 설정에 따라 storage 결정)
  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  const model = findModel(settings.modelId) || MODEL_REGISTRY[0]
  const needsAnthropicKey = model.provider === 'anthropic' && !settings.anthropicKey
  const needsOpenaiKey = model.provider === 'openai' && !settings.openaiKey
  const canGrade = !needsAnthropicKey && !needsOpenaiKey && studentAnswer.trim().length > 0

  // 예상 비용 (대략 추정: 학생 답안 × 1.3 + 문항 길이 + 출력 가정 400 토큰)
  const estimate = useMemo(() => {
    const inputText =
      question.questionPrompt +
      (question.materialText || '') +
      question.subQuestions.map((q) => q.text).join(' ') +
      question.rubric.map((r) => r.criteria).join(' ') +
      studentAnswer
    // 한국어는 평균적으로 1자 ≈ 0.5~1 토큰. 보수적으로 0.8 사용
    const inTok = Math.ceil(inputText.length * 0.8)
    const outTok = 400
    const usd = costUsd(model, inTok, outTok)
    return { inTok, outTok, usd, krw: usd * settings.krwPerUsd }
  }, [question, studentAnswer, model, settings.krwPerUsd])

  const handleGrade = async () => {
    setError(null)
    setLoading(true)
    setResult(null)
    try {
      const res = await grade(
        { ...question, studentAnswer },
        settings,
      )
      setResult(res)
      // 누적 비용 갱신
      setSettings((x) => ({
        ...x,
        sessionSpentUsd: x.sessionSpentUsd + res.usd,
        totalSpentUsd: x.totalSpentUsd + res.usd,
      }))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  const updateProvider = (provider: Provider) => {
    const m = MODEL_REGISTRY.find((x) => x.provider === provider)!
    setSettings((x) => ({ ...x, provider, modelId: m.id }))
  }

  const clearKey = (which: 'anthropic' | 'openai') => {
    setSettings((x) => ({
      ...x,
      ...(which === 'anthropic' ? { anthropicKey: '' } : { openaiKey: '' }),
    }))
  }

  const resetTotals = () => {
    setSettings((x) => ({ ...x, sessionSpentUsd: 0, totalSpentUsd: 0 }))
  }

  return (
    <section className="ai-grader">
      <div className="ai-grader__head">
        <div>
          <h3 className="ai-grader__title">
            🪙 AI 채점 토큰 가시화
            <span className="badge badge--gray ai-grader__provider">
              {model.label}
            </span>
          </h3>
          {!compact && (
            <p className="ai-grader__desc">
              AI에게 채점을 맡길 때 <strong>사용 토큰 수</strong>와{' '}
              <strong>예상 비용</strong>을 항상 노출합니다.
              <span className="ai-grader__quote">
                "AI에 의존할수록 학생의 학습 효과는 떨어진다" — OECD DEO 2026
              </span>
            </p>
          )}
        </div>
        <button
          className="btn btn--ghost btn--sm"
          onClick={() => setShowSettings((x) => !x)}
        >
          ⚙️ 설정
        </button>
      </div>

      {/* 세션 누적 비용 + 통산 비용 */}
      <div className="ai-grader__totals">
        <span>
          이번 세션 <strong>{formatUsd(settings.sessionSpentUsd)}</strong>{' '}
          <em>{formatKrw(settings.sessionSpentUsd * settings.krwPerUsd)}</em>
        </span>
        <span>
          통산 <strong>{formatUsd(settings.totalSpentUsd)}</strong>{' '}
          <em>{formatKrw(settings.totalSpentUsd * settings.krwPerUsd)}</em>
        </span>
        <button className="btn btn--sm btn--ghost" onClick={resetTotals}>
          누적 초기화
        </button>
      </div>

      {/* 설정 패널 */}
      {showSettings && (
        <div className="ai-grader__settings">
          <div className="form__row">
            <label>
              <span>제공자</span>
              <div className="seg">
                {(['anthropic', 'openai'] as const).map((p) => (
                  <button
                    key={p}
                    className={
                      model.provider === p ? 'seg__btn is-on' : 'seg__btn'
                    }
                    onClick={() => updateProvider(p)}
                  >
                    {p === 'anthropic' ? 'Anthropic' : 'OpenAI'}
                  </button>
                ))}
              </div>
            </label>
            <label>
              <span>모델</span>
              <select
                value={settings.modelId}
                onChange={(e) =>
                  setSettings((x) => ({ ...x, modelId: e.target.value }))
                }
              >
                {MODEL_REGISTRY.filter((m) => m.provider === model.provider).map(
                  (m) => (
                    <option key={m.id} value={m.id}>
                      {m.label} (${m.inUsd}/${m.outUsd}M)
                    </option>
                  ),
                )}
              </select>
            </label>
            <label>
              <span>₩/USD</span>
              <input
                type="number"
                min={0}
                value={settings.krwPerUsd}
                onChange={(e) =>
                  setSettings((x) => ({
                    ...x,
                    krwPerUsd: Number(e.target.value) || 0,
                  }))
                }
              />
            </label>
          </div>

          <label>
            <span>
              {model.provider === 'anthropic'
                ? 'Anthropic API Key'
                : 'OpenAI API Key'}{' '}
              <small style={{ color: 'var(--muted)' }}>
                (브라우저에만 저장 · 외부 전송 없음)
              </small>
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="password"
                placeholder={
                  model.provider === 'anthropic' ? 'sk-ant-...' : 'sk-...'
                }
                value={
                  model.provider === 'anthropic'
                    ? settings.anthropicKey
                    : settings.openaiKey
                }
                onChange={(e) =>
                  setSettings((x) => ({
                    ...x,
                    ...(model.provider === 'anthropic'
                      ? { anthropicKey: e.target.value }
                      : { openaiKey: e.target.value }),
                  }))
                }
              />
              <button
                className="btn btn--sm btn--ghost"
                onClick={() => clearKey(model.provider)}
                disabled={
                  !(model.provider === 'anthropic'
                    ? settings.anthropicKey
                    : settings.openaiKey)
                }
              >
                지우기
              </button>
            </div>
          </label>

          <label className="check-row">
            <input
              type="checkbox"
              checked={settings.persistKey}
              onChange={(e) =>
                setSettings((x) => ({ ...x, persistKey: e.target.checked }))
              }
            />
            <span>
              키를 영구 저장(localStorage) ·{' '}
              <strong style={{ color: 'var(--rose)' }}>
                {settings.persistKey
                  ? '⚠ 컴퓨터를 공유한다면 끄세요'
                  : '✓ 탭을 닫으면 키가 사라집니다'}
              </strong>
            </span>
          </label>

          <label className="check-row">
            <input
              type="checkbox"
              checked={settings.enableGrowthLog}
              onChange={(e) =>
                setSettings((x) => ({ ...x, enableGrowthLog: e.target.checked }))
              }
            />
            <span>
              🌱 <strong>성장 기록 사용</strong> (등급별 스탬프·누적) ·{' '}
              <small style={{ color: 'var(--muted)' }}>
                기본 OFF — Overjustification Effect(Lepper 1973) 리스크. 켤 때는
                랭킹·비교 없이 개인 성장만 기록됩니다.
              </small>
            </span>
          </label>

          <div className="ai-grader__warn">
            ⚠ API 키는 <strong>이 브라우저</strong>에만 저장되며 KCBC 어디로도
            전송되지 않습니다. 다만 직접 호출 모드는 키가 브라우저 메모리에
            노출되므로 <strong>공용/공유 컴퓨터에서는 사용하지 마세요</strong>.
            <br />
            Anthropic 키 발급:{' '}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noreferrer"
            >
              console.anthropic.com
            </a>{' '}
            · OpenAI:{' '}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noreferrer"
            >
              platform.openai.com
            </a>
          </div>
        </div>
      )}

      {/* 학생 식별자 + 답안 입력 */}
      <label className="ai-grader__answer">
        <span>학생 식별자 (이름·번호 — 토큰 누적 ledger 키)</span>
        <input
          type="text"
          value={studentLabel}
          onChange={(e) => {
            setStudentLabel(e.target.value)
            setAccount(getAccount(e.target.value))
          }}
          placeholder="예: 김민준 / 3학년 5번"
        />
      </label>
      <label className="ai-grader__answer">
        <span>학생 답안 (붙여넣기 / 직접 입력)</span>
        <textarea
          rows={5}
          value={studentAnswer}
          onChange={(e) => setStudentAnswer(e.target.value)}
          placeholder="여기에 학생의 서·논술형 답안을 붙여넣으세요."
        />
      </label>

      {/* 예상 비용 + 채점 버튼 */}
      <div className="ai-grader__estimate">
        <span>
          예상 입력 <strong>{estimate.inTok.toLocaleString()}</strong>토큰 + 출력{' '}
          <strong>~{estimate.outTok}</strong>토큰 ≈{' '}
          <strong>{formatUsd(estimate.usd)}</strong>{' '}
          <em>{formatKrw(estimate.krw)}</em>
        </span>
        <button
          className="btn btn--primary"
          onClick={handleGrade}
          disabled={!canGrade || loading}
        >
          {loading ? '⏳ 채점 중...' : '🪙 AI 채점 실행'}
        </button>
      </div>

      {(needsAnthropicKey || needsOpenaiKey) && (
        <div className="validation validation--warn">
          ⚠ {model.provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} API 키가
          필요합니다. <strong>⚙️ 설정</strong> 버튼을 눌러 입력하세요.
        </div>
      )}

      {error && (
        <div className="validation validation--warn">
          <strong>오류:</strong> {error}
        </div>
      )}

      {result && (
        <div className="ai-grader__result">
          <div className="ai-grader__result-meta">
            <span>
              입력 <strong>{result.inTokens.toLocaleString()}</strong>토큰
            </span>
            <span>
              출력 <strong>{result.outTokens.toLocaleString()}</strong>토큰
            </span>
            <span>
              총 비용{' '}
              <strong style={{ color: 'var(--brand)' }}>
                {formatUsd(result.usd)} {formatKrw(result.krw)}
              </strong>
            </span>
            <span>{(result.elapsedMs / 1000).toFixed(1)}초</span>
            <span className="badge badge--blue">{result.model.label}</span>
          </div>
          <pre className="ai-grader__result-text">{result.text}</pre>

          {/* 👨‍🏫 교사 확정 — AI 결과는 제안, 교사가 최종 등급을 정함 */}
          <TeacherConfirm
            aiText={result.text}
            aiModelLabel={result.model.label}
            studentLabel={studentLabel}
            studentAnswer={studentAnswer}
            question={question}
            enableGrowthLog={settings.enableGrowthLog}
            account={account}
            onSaved={(msg, newAcc) => {
              if (newAcc) setAccount(newAcc)
              setTokenMsg(msg)
              setTimeout(() => setTokenMsg(null), 4000)
            }}
          />
          {tokenMsg && <div className="toast">{tokenMsg}</div>}
        </div>
      )}

      {/* 성장 기록 미리보기 — 옵트인 + 라벨 + 누적 있을 때만 */}
      {settings.enableGrowthLog &&
        studentLabel.trim() &&
        account &&
        account.total > 0 && <LedgerPreview account={account} />}
    </section>
  )
}

/* ============================================================
 *  👨‍🏫 TeacherConfirm — AI 제안 vs 교사 확정 이중 판단
 *  - AI 등급을 자동 인식만 하고, 교사가 최종 등급을 확정
 *  - "확정 저장" 시 GradingRecord에 aiGrade + grade 함께 기록 (편차 추적)
 *  - 성장 스탬프는 오직 교사 확정 등급에서만 발생
 * ============================================================ */

interface ConfirmProps {
  aiText: string
  aiModelLabel: string
  studentLabel: string
  studentAnswer: string
  question: GradeRequest
  enableGrowthLog: boolean
  account: StudentTokenAccount | null
  onSaved: (msg: string, newAcc?: StudentTokenAccount) => void
}

function TeacherConfirm({
  aiText,
  aiModelLabel,
  studentLabel,
  studentAnswer,
  question,
  enableGrowthLog,
  account,
  onSaved,
}: ConfirmProps) {
  const aiGrade = parseGradeFromText(aiText)
  const [teacherGrade, setTeacherGrade] = useState<KrGrade | null>(aiGrade)

  const save = () => {
    if (!studentLabel.trim()) {
      alert('먼저 학생 식별자(이름·번호)를 입력하세요.')
      return
    }
    if (!teacherGrade) {
      alert('교사 확정 등급을 선택하세요.')
      return
    }
    // 편차 여부 감지 (표시용 · 저장은 항상)
    const differs = aiGrade && aiGrade !== teacherGrade
    const now = Date.now()
    const record: GradingRecord = {
      id: uid('gr_'),
      studentLabel: studentLabel.trim(),
      evaluationTitle: question.questionPrompt.slice(0, 60) || 'AI 채점',
      ocrText: studentAnswer,
      grade: teacherGrade,
      aiGrade: aiGrade || undefined,
      aiModelLabel,
      rationale: aiText.slice(0, 300),
      feedback: '',
      gradedAt: now,
      createdAt: now,
      updatedAt: now,
    }
    gradeRepo.save(record)

    let newAcc: StudentTokenAccount | undefined
    if (enableGrowthLog) {
      newAcc = awardTokens(studentLabel, teacherGrade, 'AI 제안 + 교사 확정')
    }
    const suffix = differs ? ` (AI: ${aiGrade} → 교사: ${teacherGrade} 편차)` : ''
    const growth = enableGrowthLog && newAcc
      ? ` · 🌱 스탬프 +${tierFor(teacherGrade).tokens}개 (누적 ${newAcc.total})`
      : ''
    onSaved(`✅ 기록 저장${suffix}${growth}`, newAcc)
  }

  const differs = aiGrade && teacherGrade && aiGrade !== teacherGrade

  return (
    <div className="tconf">
      <div className="tconf__head">
        <span className="tconf__title">
          👨‍🏫 교사 확정 (AI 제안은 참고용)
        </span>
        <span className="tconf__aiHint">
          AI 제안:{' '}
          {aiGrade ? (
            <strong className={`tconf__aiGrade tconf__aiGrade--${gradeKey(aiGrade)}`}>
              {aiGrade}
            </strong>
          ) : (
            <em>인식 실패</em>
          )}
        </span>
      </div>

      <div className="tconf__tiers">
        {TOKEN_TIERS.map((t) => (
          <button
            key={t.grade}
            type="button"
            className={
              `tconf__tier tconf__tier--${t.color}` +
              (teacherGrade === t.grade ? ' is-on' : '')
            }
            onClick={() => setTeacherGrade(t.grade)}
            title={`교사 확정: ${t.label}`}
          >
            <span className="tconf__emoji">{t.emoji}</span>
            <span className="tconf__label">{t.label}</span>
          </button>
        ))}
      </div>

      {differs && (
        <div className="tconf__warn">
          ⚠ AI 판단(<strong>{aiGrade}</strong>)과 교사 확정(<strong>{teacherGrade}</strong>)이 다릅니다. 편차가 갤러리 대시보드의 <strong>AI 일치도 통계</strong>에 반영됩니다.
        </div>
      )}

      <div className="tconf__actions">
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={save}
          disabled={!teacherGrade || !studentLabel.trim()}
        >
          ✅ 확정 저장
          {enableGrowthLog && teacherGrade && ` + 🌱 +${tierFor(teacherGrade).tokens}`}
        </button>
        {account && (
          <span className="tconf__total">
            누적 성장 스탬프: <strong>{account.total}</strong>개
          </span>
        )}
      </div>

      <p className="tconf__caveat">
        ⓘ AI는 <strong>제안</strong>만 합니다. 등급의 최종 책임은 교사에게 있으며, 편차는 통계로 추적됩니다.
      </p>
    </div>
  )
}

function gradeKey(g: KrGrade): 'green' | 'amber' | 'rose' {
  if (g === '잘함') return 'green'
  if (g === '보통') return 'amber'
  return 'rose'
}


/* ============================================================
 *  📒 LedgerPreview — 학생별 누적 + 최근 + 다음 보상
 * ============================================================ */

function LedgerPreview({ account }: { account: StudentTokenAccount }) {
  const goal = nextRewardOf(account.total)
  const goals = loadGoals()
  const maxThresh = goals[goals.length - 1]?.threshold || account.total + 1
  const pct = Math.min(100, Math.round((account.total / maxThresh) * 100))
  const recent = account.history.slice(0, 5)

  return (
    <section className="ledger">
      <header className="ledger__head">
        <span className="ledger__title">
          📒 {account.studentLabel} · 누적 <strong>{account.total}</strong>토큰
        </span>
        {goal.next ? (
          <span className="ledger__next">
            다음 보상 <strong>{goal.next.emoji} {goal.next.label}</strong>까지{' '}
            <strong>{goal.remaining}토큰</strong> 남음
          </span>
        ) : (
          <span className="ledger__next">🏆 모든 보상 달성!</span>
        )}
      </header>
      <div className="ledger__bar">
        <div className="ledger__fill" style={{ width: `${pct}%` }} />
        {goals.map((g) => (
          <span
            key={g.threshold}
            className="ledger__mark"
            style={{ left: `${Math.min(100, (g.threshold / maxThresh) * 100)}%` }}
            title={`${g.threshold} · ${g.label}`}
          >
            {g.emoji}
          </span>
        ))}
      </div>
      <div className="ledger__history">
        {recent.map((h, i) => {
          const tier = tierFor(h.grade)
          return (
            <span
              key={i}
              className={`ledger__chip ledger__chip--${tier.color}`}
              title={new Date(h.ts).toLocaleString('ko-KR')}
            >
              {tier.emoji} +{h.tokens} · {h.grade}
            </span>
          )
        })}
      </div>
    </section>
  )
}

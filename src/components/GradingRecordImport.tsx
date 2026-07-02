import { useMemo, useState } from 'react'
import type { GradingRecord, KrGrade } from '../domain'
import { createRepo, uid } from '../lib/storage'
import { parseOcrRecord } from '../lib/exportMd'

const repo = createRepo<GradingRecord>('kcbc:grading-records')

interface Props {
  /** 어떤 평가문항(또는 단계형 작성지)의 결과인지 ID로 묶어줌 */
  assessmentId?: string
  /** OCR 채점 도구에서 부여한 평가 제목 (예: "1학기 기말 사회 3학년 단원평가") */
  evaluationTitle: string
}

/**
 * 외부 OCR 채점 도구의 채점 기록(블록)을 통째로 붙여넣으면
 * 첨부파일/OCR/등급/근거/피드백을 자동 파싱하여 KCBC 갤러리에 저장.
 */
export default function GradingRecordImport({
  assessmentId,
  evaluationTitle,
}: Props) {
  const [open, setOpen] = useState(false)
  const [raw, setRaw] = useState('')
  const [studentLabel, setStudentLabel] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [savedCount, setSavedCount] = useState(0)

  const parsed = useMemo(() => parseOcrRecord(raw), [raw])
  const canSave = !!(
    studentLabel.trim() &&
    parsed.grade &&
    (parsed.rationale || parsed.feedback || parsed.ocrText)
  )

  const save = () => {
    const now = Date.now()
    const rec: GradingRecord = {
      id: uid('gr_'),
      assessmentId,
      studentLabel: studentLabel.trim(),
      evaluationTitle,
      attachmentName: parsed.attachmentName,
      ocrText: parsed.ocrText || '',
      grade: (parsed.grade as KrGrade) || '보통',
      rationale: parsed.rationale || '',
      feedback: parsed.feedback || '',
      gradedAt: parsed.gradedAt,
      createdAt: now,
      updatedAt: now,
    }
    repo.save(rec)
    setSavedCount((c) => c + 1)
    setMsg(`✓ 저장됨 (#${savedCount + 1}) — ${studentLabel}`)
    setRaw('')
    setStudentLabel('')
    setTimeout(() => setMsg(null), 3000)
  }

  const allRecords = useMemo(() => {
    if (!assessmentId) return repo.list()
    return repo.list().filter((r) => r.assessmentId === assessmentId)
  }, [savedCount, assessmentId])

  // 등급 분포 미리보기
  const dist = useMemo(() => {
    const out = { '잘함': 0, '보통': 0, '노력 요함': 0 }
    allRecords.forEach((r) => out[r.grade]++)
    return out
  }, [allRecords])

  return (
    <section className="grade-import">
      <button
        className="grade-import__toggle"
        onClick={() => setOpen((x) => !x)}
      >
        <span>📥 OCR 채점기록 가져오기</span>
        {allRecords.length > 0 && (
          <span className="grade-import__stat">
            {allRecords.length}건 누적 · 잘함 {dist['잘함']} · 보통{' '}
            {dist['보통']} · 노력 {dist['노력 요함']}
          </span>
        )}
        <span className="grade-import__chev">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="grade-import__body">
          <p className="grade-import__hint">
            외부 OCR 채점 도구의 "채점 기록" 한 건을 통째로 복사해 붙여넣으세요. 첨부파일·
            OCR·점수/등급·채점 근거·학생 피드백이 자동으로 파싱됩니다.
          </p>

          <div className="form__row">
            <label style={{ flex: '0 0 200px' }}>
              <span>학생 식별자 (이름/번호)</span>
              <input
                value={studentLabel}
                onChange={(e) => setStudentLabel(e.target.value)}
                placeholder="예: 김민준 / 3학년 5번"
              />
            </label>
            <label style={{ flex: 1 }}>
              <span>평가 제목</span>
              <input value={evaluationTitle} readOnly />
            </label>
          </div>

          <label>
            <span>채점 기록 원문 붙여넣기</span>
            <textarea
              rows={7}
              className="mono"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder={
                '2026. 6. 27. 오후 2:43:44 완료\n' +
                '첨부 파일  0_a2944c12.pdf\n' +
                '학생 응답 (OCR 결과)\n' +
                '1. 모름  2. 학교가 좋아요  3. 온마루가 있어요.\n' +
                '점수/등급\n보통\n' +
                '채점 근거\n답안에는 ...로 우리 고장의 자랑이 2가지 제시되어 있음.\n' +
                '학생에게 전달할 피드백\n우리 고장의 자랑을 3가지 이상 쓰도록 보완하면 좋겠습니다.'
              }
            />
          </label>

          {/* 파싱 결과 미리보기 */}
          {raw.trim() && (
            <div className="grade-import__preview">
              <span className="grade-import__pchip">
                등급:{' '}
                <strong
                  data-grade={parsed.grade || 'none'}
                  className="grade-import__grade"
                >
                  {parsed.grade || '—'}
                </strong>
              </span>
              <span className="grade-import__pchip">
                첨부:{' '}
                <strong>{parsed.attachmentName || '—'}</strong>
              </span>
              <span className="grade-import__pchip">
                OCR: {parsed.ocrText ? `${parsed.ocrText.length}자` : '—'}
              </span>
              <span className="grade-import__pchip">
                근거: {parsed.rationale ? '✓' : '—'}
              </span>
              <span className="grade-import__pchip">
                피드백: {parsed.feedback ? '✓' : '—'}
              </span>
              {parsed.gradedAt && (
                <span className="grade-import__pchip">
                  {new Date(parsed.gradedAt).toLocaleString('ko-KR')}
                </span>
              )}
            </div>
          )}

          <div className="form__actions">
            <button
              className="btn btn--primary"
              onClick={save}
              disabled={!canSave}
            >
              💾 갤러리에 저장
            </button>
            <button
              className="btn btn--ghost"
              onClick={() => {
                setRaw('')
                setStudentLabel('')
              }}
            >
              지우기
            </button>
          </div>

          {msg && <div className="toast">{msg}</div>}

          {allRecords.length > 0 && (
            <details className="grade-import__list">
              <summary>이번 평가 누적 기록 보기 ({allRecords.length}건)</summary>
              <ul>
                {allRecords.map((r) => (
                  <li key={r.id}>
                    <span
                      className="grade-import__grade-pill"
                      data-grade={r.grade}
                    >
                      {r.grade}
                    </span>
                    <strong>{r.studentLabel}</strong>
                    <span>
                      {r.gradedAt
                        ? new Date(r.gradedAt).toLocaleString('ko-KR')
                        : new Date(r.createdAt).toLocaleString('ko-KR')}
                    </span>
                    <button
                      className="btn btn--sm btn--danger"
                      onClick={() => {
                        repo.remove(r.id)
                        setSavedCount((c) => c + 1)
                      }}
                    >
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </section>
  )
}

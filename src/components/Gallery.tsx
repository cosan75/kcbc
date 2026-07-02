import { useMemo, useState } from 'react'
import type { LessonDraft, AssessmentDraft, GradingRecord } from '../domain'
import { createRepo } from '../lib/storage'
import { lessonToMarkdown, assessmentToMarkdown, download } from '../lib/exportMd'
import {
  STANDARD_QUESTIONS,
  STANDARD_QUESTIONS_DRIVE_FOLDER,
  STANDARD_QUESTIONS_DRIVE_FILES,
} from '../data/standardQuestions'
import GradingDashboard from './GradingDashboard'
import StudentRecordGenerator from './StudentRecordGenerator'
import type { View } from './Nav'

interface GalleryProps {
  onNavigate?: (v: View) => void
}

/**
 * Nav 5탭 압축 이후, 갤러리는 편집 진입점 역할도 담당.
 * 카드 클릭 시 focus id를 localStorage에 저장하고 해당 view로 전환.
 */
function focusAssessmentInEditor(id: string, onNavigate?: (v: View) => void) {
  localStorage.setItem('kcbc:focus-assessment', id)
  onNavigate?.('assess')
}
function focusLessonInEditor(id: string, onNavigate?: (v: View) => void) {
  localStorage.setItem('kcbc:focus-lesson', id)
  onNavigate?.('lesson')
}

const gradeRepo = createRepo<GradingRecord>('kcbc:grading-records')

const lessonRepo = createRepo<LessonDraft>('kcbc:lessons')
const assessRepo = createRepo<AssessmentDraft>('kcbc:assessments')

type Kind = 'all' | 'lesson' | 'assessment'

export default function Gallery({ onNavigate }: GalleryProps = {}) {
  const [tick, setTick] = useState(0) // 리스트 강제 새로고침용
  const [kind, setKind] = useState<Kind>('all')
  const [query, setQuery] = useState('')
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const [showDriveSheet, setShowDriveSheet] = useState(false)

  const refresh = () => setTick((n) => n + 1)

  /** Drive 산출물_아이디어에서 표준 평가문항 5개 가져오기 */
  const importStandardQuestions = () => {
    const existing = assessRepo.list()
    const existingIds = new Set(existing.map((a) => a.id))
    let added = 0
    let skipped = 0
    for (const q of STANDARD_QUESTIONS) {
      if (existingIds.has(q.id)) {
        skipped++
        continue
      }
      assessRepo.save({ ...q, updatedAt: Date.now() })
      added++
    }
    refresh()
    setImportMsg(
      added === 0
        ? `이미 ${skipped}개가 모두 갤러리에 있습니다.`
        : `📥 ${added}개 추가됨 (중복 건너뜀: ${skipped})`,
    )
    setTimeout(() => setImportMsg(null), 4000)
  }

  const lessons = useMemo(() => lessonRepo.list(), [tick])
  const assessments = useMemo(() => assessRepo.list(), [tick])

  const visibleLessons = useMemo(() => {
    if (kind === 'assessment') return []
    const q = query.trim().toLowerCase()
    if (!q) return lessons
    return lessons.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.subject.toLowerCase().includes(q) ||
        l.generalization.toLowerCase().includes(q),
    )
  }, [lessons, query, kind])

  const visibleAssess = useMemo(() => {
    if (kind === 'lesson') return []
    const q = query.trim().toLowerCase()
    if (!q) return assessments
    return assessments.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.domain.toLowerCase().includes(q) ||
        a.prompt.toLowerCase().includes(q),
    )
  }, [assessments, query, kind])

  const totalCount = visibleLessons.length + visibleAssess.length

  const removeLesson = (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    lessonRepo.remove(id)
    refresh()
  }
  const removeAssess = (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    assessRepo.remove(id)
    refresh()
  }

  const exportBackup = () => {
    const dump = {
      version: 2,
      exportedAt: new Date().toISOString(),
      lessons: lessons,
      assessments: assessments,
      gradingRecords: gradeRepo.list(),
    }
    download('kcbc-backup.json', JSON.stringify(dump, null, 2), 'application/json')
  }

  const importBackup = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result))
        if (!data.lessons || !data.assessments) throw new Error('형식 오류')
        const grCount = Array.isArray(data.gradingRecords)
          ? data.gradingRecords.length
          : 0
        if (
          !confirm(
            `수업안 ${data.lessons.length}건 + 평가 ${data.assessments.length}건 + 채점기록 ${grCount}건을 가져옵니다. 중복은 덮어씁니다. 진행할까요?`,
          )
        )
          return
        ;(data.lessons as LessonDraft[]).forEach((l) => lessonRepo.save(l))
        ;(data.assessments as AssessmentDraft[]).forEach((a) => assessRepo.save(a))
        if (grCount) {
          ;(data.gradingRecords as GradingRecord[]).forEach((g) => gradeRepo.save(g))
        }
        refresh()
        alert('가져오기 완료')
      } catch (e) {
        alert('가져오기 실패: ' + String(e))
      }
    }
    reader.readAsText(file)
  }

  const exportAllMd = () => {
    const lessonMd = lessons.map((l) => lessonToMarkdown(l)).join('\n\n---\n\n')
    const assessMd = assessments.map((a) => assessmentToMarkdown(a)).join('\n\n---\n\n')
    const md = `# KCBC 산출물 모음\n\n생성: ${new Date().toLocaleString('ko-KR')}\n\n` +
      `## 📝 수업안 (${lessons.length}건)\n\n${lessonMd || '_없음_'}\n\n` +
      `## 📋 평가 문항 (${assessments.length}건)\n\n${assessMd || '_없음_'}`
    download('kcbc-all.md', md, 'text/markdown')
  }

  return (
    <section className="builder">
      <div className="builder__head">
        <div>
          <h2 className="builder__title">🗂 갤러리</h2>
          <p className="builder__desc">
            저장한 수업안과 평가 문항을 한 곳에서 관리합니다. 백업·복원·일괄 내보내기 지원.
          </p>
        </div>
        <div className="builder__actions">
          <button
            className="btn btn--primary"
            onClick={importStandardQuestions}
            title="평가시대/산출물_아이디어 폴더에 백업된 표준 5문항을 갤러리에 추가"
          >
            ☁ Drive에서 표준 문항 가져오기
          </button>
          <button className="btn btn--ghost" onClick={() => setShowDriveSheet((s) => !s)}>
            🔗 Drive 파일 보기
          </button>
          <label className="btn btn--ghost">
            📥 JSON 가져오기
            <input
              type="file"
              accept="application/json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) importBackup(f)
                e.target.value = ''
              }}
            />
          </label>
          <button className="btn btn--ghost" onClick={exportBackup}>
            📤 JSON 백업
          </button>
          <button className="btn btn--ghost" onClick={exportAllMd}>
            📄 MD 일괄
          </button>
        </div>
      </div>

      {importMsg && <div className="toast">{importMsg}</div>}

      {/* OCR 채점 분포 대시보드 (채점기록 있을 때만) */}
      <GradingDashboard />

      {/* 학생부 기록 생성기 (채점기록 있을 때만) */}
      <StudentRecordGenerator />

      {showDriveSheet && (
        <div className="drive-sheet">
          <div className="drive-sheet__head">
            <strong>📁 평가시대 / 산출물_아이디어 (Drive)</strong>
            <a
              href={STANDARD_QUESTIONS_DRIVE_FOLDER}
              target="_blank"
              rel="noreferrer"
              className="drive-sheet__folder"
            >
              폴더 열기 ↗
            </a>
          </div>
          <p className="drive-sheet__desc">
            5개 표준 평가 문항은 구조화된 JSON으로 Drive 폴더에 백업되어 있습니다.
            <br />
            팀과 공유하거나 다른 도구로 가져갈 때 사용하세요.
          </p>
          <ul className="drive-sheet__list">
            {STANDARD_QUESTIONS_DRIVE_FILES.map((f) => {
              const q = STANDARD_QUESTIONS.find((x) => x.id === f.id)
              return (
                <li key={f.id}>
                  <a href={f.url} target="_blank" rel="noreferrer">
                    {f.filename}
                  </a>
                  {q && (
                    <span className="drive-sheet__meta">
                      {q.domain} · {q.type} · 총 {q.totalScore}점
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="gallery-tools">
        <div className="seg">
          {(['all', 'lesson', 'assessment'] as Kind[]).map((k) => (
            <button
              key={k}
              className={kind === k ? 'seg__btn is-on' : 'seg__btn'}
              onClick={() => setKind(k)}
            >
              {k === 'all' ? `전체 (${lessons.length + assessments.length})` : k === 'lesson' ? `수업안 (${lessons.length})` : `평가 (${assessments.length})`}
            </button>
          ))}
        </div>
        <input
          className="search"
          type="search"
          placeholder="제목·내용으로 검색…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {totalCount === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">📂</div>
          <h3>저장된 항목이 없습니다</h3>
          <p>수업안 빌더 또는 평가 문항 빌더에서 작업을 저장해보세요.</p>
        </div>
      ) : (
        <div className="gallery-grid">
          {visibleLessons.map((l) => (
            <article key={l.id} className="gallery-card gallery-card--lesson">
              <div className="gallery-card__head">
                <span className="badge badge--violet">수업안</span>
                <span className={`badge ${l.knowledgeType === '명제적' ? 'badge--blue' : 'badge--teal'}`}>
                  {l.knowledgeType}
                </span>
              </div>
              <h3 className="gallery-card__title">{l.title || '(제목 없음)'}</h3>
              <p className="gallery-card__sub">
                {l.subject} {l.grade && `· ${l.grade}`}
              </p>
              {l.generalization && (
                <blockquote className="gallery-card__quote">{l.generalization}</blockquote>
              )}
              <div className="gallery-card__meta">
                <span>5요소 {[l.studentImage, l.values.length, l.macroLens, l.microConcepts.length, l.skills.length].filter(Boolean).length}/5</span>
                <span>7단계 {l.stages.filter((s) => s.activity || s.question).length}/7</span>
                <span className="gallery-card__time">{new Date(l.updatedAt).toLocaleDateString('ko-KR')}</span>
              </div>
              <div className="gallery-card__actions">
                <button
                  className="btn btn--sm btn--primary"
                  onClick={() => focusLessonInEditor(l.id, onNavigate)}
                  disabled={!onNavigate}
                  title="수업안 빌더에서 이 항목 편집"
                >
                  ✏️ 편집
                </button>
                <button className="btn btn--sm" onClick={() => download(`${l.title || 'lesson'}.md`, lessonToMarkdown(l), 'text/markdown')}>
                  MD
                </button>
                <button className="btn btn--sm" onClick={() => download(`${l.title || 'lesson'}.json`, JSON.stringify(l, null, 2), 'application/json')}>
                  JSON
                </button>
                <button className="btn btn--sm btn--danger" onClick={() => removeLesson(l.id)}>
                  삭제
                </button>
              </div>
            </article>
          ))}
          {visibleAssess.map((a) => (
            <article key={a.id} className="gallery-card gallery-card--assess">
              <div className="gallery-card__head">
                <span className="badge badge--rose">평가</span>
                <span className="badge badge--blue">{a.type}</span>
                <span className="badge badge--gray">{a.domain}</span>
              </div>
              <h3 className="gallery-card__title">
                문항 {a.no}. {a.title || '(제목 없음)'}
              </h3>
              <p className="gallery-card__sub">{a.prompt}</p>
              <div className="gallery-card__meta">
                <span className="score-pill" data-tier="high">총 {a.totalScore}점</span>
                <span>하위 {a.subQuestions.length}개</span>
                <span className="gallery-card__time">{new Date(a.updatedAt).toLocaleDateString('ko-KR')}</span>
              </div>
              <div className="gallery-card__actions">
                <button
                  className="btn btn--sm btn--primary"
                  onClick={() => focusAssessmentInEditor(a.id, onNavigate)}
                  disabled={!onNavigate}
                  title="평가 문항 빌더에서 이 항목 편집"
                >
                  ✏️ 편집
                </button>
                <button className="btn btn--sm" onClick={() => download(`q${a.no}.md`, assessmentToMarkdown(a), 'text/markdown')}>
                  MD
                </button>
                <button className="btn btn--sm" onClick={() => download(`q${a.no}.json`, JSON.stringify(a, null, 2), 'application/json')}>
                  JSON
                </button>
                <button className="btn btn--sm btn--danger" onClick={() => removeAssess(a.id)}>
                  삭제
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

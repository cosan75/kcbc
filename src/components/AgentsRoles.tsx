/**
 * KCBC 도구별 에이전트 역할 분담 카드.
 * - 각 KCBC 컴포넌트가 평가 사이클에서 맡는 "에이전트" 역할을 시각화
 * - 입력 → 처리 → 출력 흐름과 다음/이전 에이전트 연결 표시
 */

interface AgentSpec {
  id: string
  emoji: string
  name: string                       // 에이전트 명
  role: string                       // 한 줄 역할
  responsibility: string             // 책임
  input: string                      // 입력
  output: string                     // 출력
  tool: string                       // 어디서 동작
  prev?: string                      // 이전 에이전트 (id)
  next?: string                      // 다음 에이전트 (id)
  color: 'violet' | 'brand' | 'teal' | 'amber' | 'rose' | 'green' | 'gray'
}

const AGENTS: AgentSpec[] = [
  {
    id: 'planner',
    emoji: '🧭',
    name: '설계 에이전트',
    role: '단계형 작성기',
    responsibility:
      '단원의 중요한 질문 → 5국면 × 3수준 매트릭스로 평가 시나리오 입체화',
    input: '교과 / 단원 / 자료 / 중요한 질문',
    output: '15셀 질문 매트릭스 + MAIL/한국5요소 태그',
    tool: '🧭 단계형 작성기 탭',
    next: 'itemizer',
    color: 'violet',
  },
  {
    id: 'itemizer',
    emoji: '📋',
    name: '문항화 에이전트',
    role: '평가 빌더 변환',
    responsibility:
      '평가화·정교화 셀을 모아 서·논술형 평가문항 + 4단계 루브릭으로 변환',
    input: '단계형 매트릭스 셀',
    output: 'AssessmentDraft (문항·자료·하위문항·루브릭)',
    tool: '📋 평가 문항 빌더 탭',
    prev: 'planner',
    next: 'grader',
    color: 'brand',
  },
  {
    id: 'grader',
    emoji: '🪙',
    name: '채점 에이전트 (AI)',
    role: 'Anthropic / OpenAI 토큰 가시화',
    responsibility:
      '학생 답안과 루브릭을 비교해 등급·근거·피드백 생성, 사용 토큰·비용 노출',
    input: '학생 답안 텍스트 + 루브릭',
    output: '잘함/보통/노력 + 근거 + 피드백 + 토큰·₩',
    tool: '평가 문항 빌더 하단 AI 패널',
    prev: 'itemizer',
    next: 'ocr',
    color: 'amber',
  },
  {
    id: 'ocr',
    emoji: '📥',
    name: 'OCR 채점 에이전트 (외부)',
    role: '외부 OCR 채점 도구',
    responsibility:
      '종이 답안지(PDF/사진)를 OCR로 텍스트화 후 AI 채점, 채점 기록 누적',
    input: '학생 답안지 이미지/PDF',
    output: '점수·등급 + 채점 근거 + 학생 피드백',
    tool: '외부 OCR 채점 서비스',
    prev: 'grader',
    next: 'importer',
    color: 'gray',
  },
  {
    id: 'importer',
    emoji: '📋',
    name: '기록 수집 에이전트',
    role: 'OCR 채점기록 가져오기',
    responsibility:
      '외부 채점 결과를 붙여넣으면 5필드(첨부·OCR·등급·근거·피드백) 자동 파싱',
    input: 'OCR 채점기록 텍스트',
    output: 'GradingRecord 객체 → 갤러리 누적',
    tool: '평가 빌더 하단 가져오기 패널',
    prev: 'ocr',
    next: 'analyst',
    color: 'rose',
  },
  {
    id: 'analyst',
    emoji: '📊',
    name: '분석 에이전트',
    role: '학급 채점 분포 대시보드',
    responsibility:
      '평가별 그룹핑 → 등급 분포·학급 평균·학생별 드릴다운 시각화',
    input: 'GradingRecord[]',
    output: '스택드 비율 막대 + 학급 리포트 MD',
    tool: '🗂 갤러리 탭 상단',
    prev: 'importer',
    next: 'recorder',
    color: 'teal',
  },
  {
    id: 'recorder',
    emoji: '📜',
    name: '학생부 기록 에이전트',
    role: '교과학습발달상황 초안',
    responsibility:
      '채점기록을 학생부 양식(명사형 종결·등급 미표시·자료 키워드 추출)으로 변환',
    input: 'GradingRecord + 길이·어조 옵션',
    output: '학생부 초안 (60자/150자/300자)',
    tool: '🗂 갤러리 탭 하단',
    prev: 'analyst',
    color: 'green',
  },
]

export default function AgentsRoles() {
  return (
    <section className="agents">
      <header className="agents__head">
        <div>
          <h2 className="agents__title">🤖 KCBC 에이전트 역할 분담</h2>
          <p className="agents__hint">
            평가 설계부터 학생부 기록까지 — 각 도구가 맡는 역할과 데이터 핸드오프 흐름.
            <strong>왼쪽에서 오른쪽으로 한 호흡</strong>으로 진행됩니다.
          </p>
        </div>
        <span className="agents__count">{AGENTS.length}개 에이전트</span>
      </header>

      <ol className="agents__chain">
        {AGENTS.map((a, i) => (
          <li key={a.id} className={`agents__card agents__card--${a.color}`}>
            <div className="agents__cardhead">
              <span className="agents__num">{String(i + 1).padStart(2, '0')}</span>
              <span className="agents__emoji">{a.emoji}</span>
              <div className="agents__name">
                <strong>{a.name}</strong>
                <small>{a.role}</small>
              </div>
            </div>
            <p className="agents__resp">{a.responsibility}</p>
            <div className="agents__io">
              <div>
                <span className="agents__iolabel">IN</span>
                <span>{a.input}</span>
              </div>
              <div>
                <span className="agents__iolabel">OUT</span>
                <span>{a.output}</span>
              </div>
            </div>
            <div className="agents__tool">📍 {a.tool}</div>
            {a.next && (
              <div className="agents__arrow" aria-hidden="true">▼</div>
            )}
          </li>
        ))}
      </ol>

      <div className="agents__foot">
        💡 <strong>외부 도구</strong>: 외부 OCR 채점 서비스, Anthropic/OpenAI(채점) 두 곳만 외부.
        나머지 5개 에이전트는 모두 <strong>이 브라우저 안</strong>에서 동작 — 데이터가 외부로 나가지 않습니다.
      </div>
    </section>
  )
}

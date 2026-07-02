// 빌더 도구가 다루는 도메인 모델

export type KnowledgeType = '명제적' | '절차적'

/** 사용자가 만드는 수업안 */
export interface LessonDraft {
  id: string
  title: string                 // 단원명
  subject: string               // 교과
  grade: string                 // 학년
  knowledgeType: KnowledgeType
  studentImage: string          // 학생상
  values: string[]              // 핵심가치
  macroLens: string             // 렌즈 개념
  microConcepts: string[]       // 단원 개념
  skills: string[]              // 핵심기능
  generalization: string        // 일반화 진술문
  stages: StageDraft[]          // 7단계
  evaluation: {
    task: string                // 수행 과제 (한 줄 요약)
    rubric: string[]            // 루브릭 기준
    formative: string           // 형성평가
    /** GRASPS 실제적 평가 6요소 (선택 · McTighe & Wiggins UbD) */
    grasps?: {
      goal: string              // 목표
      role: string              // 역할
      audience: string          // 청중
      situation: string         // 상황
      product: string           // 산출물
      standards: string         // 기준
    }
  }
  createdAt: number
  updatedAt: number
}

export interface StageDraft {
  num: 1 | 2 | 3 | 4 | 5 | 6 | 7
  ko: string                    // 단계명 (관계 맺기 등)
  activity: string              // 학습 활동
  question: string              // 안내 질문
}

/** 사용자가 만드는 평가 문항 */
export interface AssessmentDraft {
  id: string
  no: number
  type: '서술형' | '논술형'
  domain: string                // 지리/역사/경제/정치/지속가능 발전 등
  title: string                 // 문항 주제
  prompt: string                // 도입 지시문
  totalScore: number
  material: string              // 자료 박스 본문 (ASCII)
  materialLabel: string         // 자료 제목 (예: 우리 마을 안내 책자)
  source: string                // 삽화/자료 출처
  subQuestions: SubQuestion[]
  rubric: RubricLevel[]
  createdAt: number
  updatedAt: number
}

export interface SubQuestion {
  text: string
  score: number
}

export interface RubricLevel {
  level: '상' | '중' | '하' | '미응답'
  criteria: string
  score: string
}

export const STAGE_NAMES: StageDraft['ko'][] = [
  '관계 맺기',
  '집중하기',
  '조사하기',
  '조직·정리',
  '일반화',
  '전이',
  '성찰',
]

export const STAGE_EN = [
  'Engage',
  'Focus',
  'Investigate',
  'Organize',
  'Generalize',
  'Transfer',
  'Reflect',
]

export const DEFAULT_RUBRIC: RubricLevel[] = [
  { level: '상', criteria: '자료를 정확히 해석하고, 요구한 개수만큼 사회 개념과 연결지어 구체적으로 서술함', score: '만점' },
  { level: '중', criteria: '자료 해석은 적절하나, 개수가 부족하거나 사회 개념과의 연결이 일부 미흡함', score: '부분 점수' },
  { level: '하', criteria: '자료와 직접 관련 없거나, 사회 개념과 연결이 거의 드러나지 않음', score: '최소 점수' },
  { level: '미응답', criteria: '답을 쓰지 않거나 문제와 무관한 답을 함', score: '0점' },
]

/** 일반화 진술문 템플릿 패턴 (개념 2개 이상 연결) */
export interface GeneralizationPattern {
  id: string
  template: string             // {A}는 {B}를 형성한다.
  examples: string[]
  knowledgeType: KnowledgeType | 'both'
}

export const GENERALIZATION_PATTERNS: GeneralizationPattern[] = [
  {
    id: 'shape',
    template: '{A}은(는) {B}을(를) 형성한다.',
    examples: ['지리적 환경은 인간의 생활 양식과 경제활동을 형성한다.'],
    knowledgeType: '명제적',
  },
  {
    id: 'influence',
    template: '{A}이(가) 변하면 {B}도 함께 변한다.',
    examples: ['기후가 변하면 생물의 분포도 함께 변한다.'],
    knowledgeType: '명제적',
  },
  {
    id: 'depend',
    template: '{A}와(과) {B}은(는) 서로 영향을 주고받으며 변화한다.',
    examples: ['생산자와 소비자는 서로 영향을 주고받으며 변화한다.'],
    knowledgeType: '명제적',
  },
  {
    id: 'procedure',
    template: '{A}은(는) {B}을(를) 같게 만든 후 {C}을(를) 수행하는 절차이다.',
    examples: ['분수의 덧셈과 뺄셈은 단위(분모)를 같게 만든 후 단위의 개수(분자)를 더하거나 빼는 절차이다.'],
    knowledgeType: '절차적',
  },
  {
    id: 'transfer',
    template: '{A}의 원리는 {B} 상황에도 동일하게 적용된다.',
    examples: ['동치의 원리는 비례식·연립방정식 상황에도 동일하게 적용된다.'],
    knowledgeType: '절차적',
  },
  {
    id: 'systemic',
    template: '{A}은(는) {B}의 한 부분으로서 전체 {C}에 기여한다.',
    examples: ['지역 경제는 국가 경제의 한 부분으로서 전체 시장에 기여한다.'],
    knowledgeType: 'both',
  },
]

/* ============================================================
 *  「질문하는 학교」 최상위 프레임
 *  - 이화여자대학교 산학협력단 · 교육부
 *  - 4영역 + 학생 질문 능력 계발 모델 4유형
 * ============================================================ */

export type QSchoolDomain =
  | 'learn'        // 질문 배우기
  | 'by'           // 질문으로 배우기
  | 'live'         // 질문하며 살기
  | 'culture'      // 질문하는 학교문화 조성

export interface QSchoolDomainMeta {
  key: QSchoolDomain
  ko: string
  desc: string
}

export const QSCHOOL_DOMAINS: QSchoolDomainMeta[] = [
  { key: 'learn',   ko: '질문 배우기',           desc: '질문하는 방법 자체를 배우는 영역' },
  { key: 'by',      ko: '질문으로 배우기',       desc: '교과 학습에 학생 질문을 활용' },
  { key: 'live',    ko: '질문하며 살기',         desc: '질문 중심 프로젝트로 일상에 적용' },
  { key: 'culture', ko: '질문하는 학교문화 조성', desc: '교실·학교 차원의 질문 친화 문화' },
]

/** 학생 질문 능력 계발 모델 4유형 */
export type QLearningModel = 'play' | 'experiment' | 'discuss' | 'reflect'

export interface QLearningModelMeta {
  key: QLearningModel
  ko: string
  short: string
  desc: string
  focus: string         // 중점
}

export const QLEARNING_MODELS: QLearningModelMeta[] = [
  {
    key: 'play',
    ko: '질문 놀이형',
    short: '놀이',
    desc: '놀이를 활용해 질문에 대한 부담을 줄이고 적극적으로 질문하는 태도 함양',
    focus: '질문의 즐거움 · 자유로운 시도',
  },
  {
    key: 'experiment',
    ko: '실험·실습 연계형',
    short: '실험',
    desc: '실험·실습 과정에서 질문하고 답하는 연속적 활동 — 구체적 탐구 방법 학습',
    focus: '질문→답→새 질문 순환 · 복합 개념 깊이',
  },
  {
    key: 'discuss',
    ko: '질문 토의형',
    short: '토의',
    desc: '학생이 생성한 질문의 답을 함께 토의하며 정교화 · 평가 · 심화',
    focus: '비판적 사고 · 민주적 소통',
  },
  {
    key: 'reflect',
    ko: '질문 성찰형',
    short: '성찰',
    desc: '질문-탐구-해결의 순환을 경험하며 메타 사고와 성찰 태도 함양',
    focus: '메타 인지 · 사고 확장',
  },
]

/** 한국 공식 학생 질문 교육 내용 5요소 (정혜승, 2022·2024) */
export type KrQuestionElement = 'type' | 'method' | 'content' | 'use' | 'meta'

export interface KrQuestionElementMeta {
  key: KrQuestionElement
  ko: string
  short: string
  desc: string
}

export const KR_QUESTION_ELEMENTS: KrQuestionElementMeta[] = [
  { key: 'type',    ko: '질문의 유형(수준)', short: '유형', desc: '사실·예측·추론·판단·대안적 관점·가치/편견 등' },
  { key: 'method',  ko: '질문 방법',         short: '방법', desc: '인물·자료·소통 화제에 대한 질문 만들기' },
  { key: 'content', ko: '질문 내용',         short: '내용', desc: '자신/텍스트(자료)/소통 맥락 3축의 내용' },
  { key: 'use',     ko: '질문 활용',         short: '활용', desc: '학습·일상 문제 해결에 질문을 활용' },
  { key: 'meta',    ko: '메타 질문',         short: '메타', desc: '자신의 질문을 점검·확장·심화하는 질문' },
]

/* ============================================================
 *  단계형 평가문항 작성기 (Staged Assessment Builder)
 *
 *  X축: 질문 5국면 (생성 → 정교화 → 탐구 → 평가화 → 성찰)
 *    └ 「학생 질문 능력 계발 모델」 국면 구조 + KCBC 평가화 확장
 *  Y축: 3 숙련도 (낮음 / 중간 / 높음)
 *    └ PISA 2029 MAIL 학생 기대 진행 상황 (표 4.1~4.5)
 *  태그(OECD): MAIL 5 역량 (윤리·접근·분석·참여·창조)
 *  태그(한국): 정혜승 5요소 (유형·방법·내용·활용·메타)
 * ============================================================ */

/**
 * 질문 국면 (Phase) — 「학생 질문 능력 계발 모델」 4국면과 완전 정합
 * - generate (생성)   ← 모델 책 "자유롭게 질문 만들기"
 * - refine   (정교화) ← 모델 책 "더 나은 질문 만들기"
 * - inquire  (답 찾기) ← 모델 책 "질문에 답 찾기"
 * - reflect  (성찰)   ← 모델 책 "성찰과 다음 배움"
 *
 * ‘평가화’는 국면이 아닌 ‘교사 다리(bridge)’로 분리 — 별도 변환 버튼.
 * itemize / classify 는 legacy 마이그레이션 전용 값.
 */
export type QuestionStage =
  | 'generate'
  | 'refine'
  | 'inquire'
  | 'reflect'
  // legacy — 구버전 데이터 마이그레이션 전용 (UI에는 표시 안 함)
  | 'itemize'
  | 'classify'
export type ProficiencyLevel = 'low' | 'mid' | 'high'
export type MailCompetency =
  | 'ethics'
  | 'access'
  | 'analyze'
  | 'participate'
  | 'create'

export interface StageMeta {
  key: QuestionStage
  ko: string
  en: string
  hint: string
  prompt: string
}

export interface LevelMeta {
  key: ProficiencyLevel
  ko: string
  band: string
  desc: string
}

export interface MailMeta {
  key: MailCompetency
  ko: string
  short: string
  cssTag: 'gray' | 'blue' | 'violet' | 'teal' | 'rose'
}

export const STAGED_STAGES: StageMeta[] = [
  {
    key: 'generate',
    ko: '자유롭게 질문 만들기',
    en: 'Generate',
    hint: '자기 검열 없이 다양한 질문을 폭넓게 떠올리는 국면 (모델 국면 ①)',
    prompt: '자료(또는 중요한 질문)를 보고 떠오르는 질문을 가능한 많이 적어 봅시다.',
  },
  {
    key: 'refine',
    ko: '더 나은 질문 만들기',
    en: 'Refine',
    hint: '폐쇄/개방·4유형 분류 + 자료·관점·렌즈로 다듬기 (모델 국면 ②)',
    prompt: '내 질문을 분류하고, 복합 자료와 개념 렌즈를 더해 ‘탐구 가능한 질문’으로 다듬어 봅시다.',
  },
  {
    key: 'inquire',
    ko: '질문에 답 찾기',
    en: 'Inquire',
    hint: '자료 조사·실험·관찰·토론으로 질문에 답 찾기 (모델 국면 ③)',
    prompt: '이 질문에 답하려면 어떤 자료·실험·관찰·근거가 필요할까요? 탐구 계획을 적어 봅시다.',
  },
  {
    key: 'reflect',
    ko: '성찰과 다음 배움',
    en: 'Reflect',
    hint: '질문/탐구 과정 되돌아보기 + 다음 배움을 위한 새 질문 (모델 국면 ④)',
    prompt: '이 질문 탐구 과정에서 무엇을 배웠나요? 더 알고 싶은 새로운 질문은 무엇인가요?',
  },
  // legacy — 마이그레이션 fallback (UI 노출 X)
  {
    key: 'itemize',
    ko: '(구) 평가화',
    en: 'Itemize (legacy)',
    hint: '이제는 국면이 아닌 교사 다리 — 매트릭스 하단 [평가문항 변환] 버튼 사용',
    prompt: '(구 버전 — refine으로 통합)',
  },
]

export const PROFICIENCY_LEVELS: LevelMeta[] = [
  {
    key: 'low',
    ko: '낮음',
    band: 'Below proficient',
    desc: '단편 정보나 표면 사실을 묻는 질문 / 자료 1개에 의존',
  },
  {
    key: 'mid',
    ko: '중간',
    band: 'Proficient',
    desc: '부분적 연결과 해석을 요구 / 자료 2개를 묶어 설명',
  },
  {
    key: 'high',
    ko: '높음',
    band: 'Highly proficient',
    desc: '복합 자료를 통합하고 다른 맥락으로 전이·평가하는 질문',
  },
]

export const MAIL_COMPETENCIES: MailMeta[] = [
  { key: 'ethics',      ko: '윤리·성찰',   short: '윤리', cssTag: 'gray'   },
  { key: 'access',      ko: '접근·사용',   short: '접근', cssTag: 'blue'   },
  { key: 'analyze',     ko: '분석·평가',   short: '분석', cssTag: 'violet' },
  { key: 'participate', ko: '참여·협력',   short: '참여', cssTag: 'teal'   },
  { key: 'create',      ko: '창조',        short: '창조', cssTag: 'rose'   },
]

/** 셀(국면 × 수준) 하나에 들어가는 사용자 작성 항목 */
export interface StagedItem {
  stage: QuestionStage
  level: ProficiencyLevel
  competency: MailCompetency         // OECD MAIL 5역량
  krElement?: KrQuestionElement      // 한국 5요소 (정혜승) — 선택
  question: string                   // 학생용 질문
  evidence: string                   // 학생 응답이 보여줘야 할 증거/근거
  scoreHint: string                  // 채점 핵심 요소 (서·논술형 변환 시 사용)
}

/** 학습자 다양성 — 모델 책 「학생 다양성 기반 질문 중심 수업 모델」 */
export type LearnerDiversity = 'general' | 'special' | 'multicultural'

export interface LearnerDiversityMeta {
  key: LearnerDiversity
  ko: string
  desc: string
  emoji: string
}

export const LEARNER_DIVERSITIES: LearnerDiversityMeta[] = [
  { key: 'general',      ko: '일반',        desc: '비특수·비다문화 학습자 중심', emoji: '🎓' },
  { key: 'special',      ko: '특수교육형',  desc: '특수교육 대상 학생을 질문하는 존재로 — 시각적 자료·단계 세분화', emoji: '🧩' },
  { key: 'multicultural', ko: '다문화교육형', desc: '다양한 배경 학생의 경험·문화 공유 — 자기 경험 기반 질문', emoji: '🌏' },
]

/** 단계형 평가문항 작성기의 최상위 단위 */
export interface StagedAssessment {
  id: string
  title: string                      // 주제 (예: "행복동의 빈집 문제")
  subject: string                    // 교과
  grade: string                      // 학년
  contextMaterial: string            // 자료 박스 본문 (자유 텍스트)
  importantQuestion: string          // 단원 관통 ‘중요한 질문’
  learningModel?: QLearningModel     // 「학생 질문 능력 계발 모델」 4유형 중 적용 모델
  diversity?: LearnerDiversity       // 학습자 다양성 (모델 책 다양성 기반 모델)
  items: StagedItem[]                // 셀별 항목 (최대 5×3 = 15)
  createdAt: number
  updatedAt: number
}

/** 구버전 단계명 마이그레이션
 * - classify → refine (이전 축소)
 * - itemize → refine (평가화가 다리로 분리되면서 refine으로 흡수)
 */
export function migrateStage(s: QuestionStage): QuestionStage {
  if (s === 'classify' || s === 'itemize') return 'refine'
  return s
}

export function migrateStagedAssessment(a: StagedAssessment): StagedAssessment {
  let changed = false
  const items = a.items.map((it) => {
    const next = migrateStage(it.stage)
    if (next !== it.stage) {
      changed = true
      return { ...it, stage: next }
    }
    return it
  })
  return changed ? { ...a, items } : a
}

/* ============================================================
 *  외부 OCR 채점 도구로부터 받은 채점기록 (역방향 다리)
 *  - 교사가 OCR 채점 도구에서 채점한 결과 한 건을
 *    KCBC 갤러리에 학급 형성평가 데이터로 누적
 * ============================================================ */
export type KrGrade = '잘함' | '보통' | '노력 요함'

export interface GradingRecord {
  id: string
  /** 어떤 평가문항(AssessmentDraft)에 연결되는지 — 선택 */
  assessmentId?: string
  /** 학생 식별자 (이름 또는 번호) */
  studentLabel: string
  /** OCR 채점 도구상의 평가 제목 */
  evaluationTitle: string
  /** 첨부파일 이름 (있으면) */
  attachmentName?: string
  /** OCR 결과 텍스트 */
  ocrText: string
  /** 점수/등급 — 한국 표준 3단계 (교사 확정) */
  grade: KrGrade
  /** AI가 최초 제안한 등급 (편차 추적용, 선택) */
  aiGrade?: KrGrade
  /** AI 모델 라벨 (편차 원인 분석용, 선택) */
  aiModelLabel?: string
  /** 채점 근거 */
  rationale: string
  /** 학생에게 전달할 피드백 */
  feedback: string
  /** 외부 도구에서의 채점 완료 시각 */
  gradedAt?: number
  createdAt: number
  updatedAt: number
}

/** 셀별 시작 템플릿 — 교사가 ‘0에서 시작’하지 않게 도와주는 시드 문구 */
export const STAGED_SEED: Record<QuestionStage, Record<ProficiencyLevel, string>> = {
  generate: {
    low:  '자료에서 보이는 사실 중 무엇이 가장 눈에 띄나요?',
    mid:  '자료 속 두 가지 정보를 연결해 보면 어떤 궁금증이 생기나요?',
    high: '이 자료가 다른 시간·장소·집단에서는 어떻게 다르게 나타날까요?',
  },
  refine: {
    low:  '이 질문은 폐쇄형/개방형 중 어느 쪽인가요? 개방형으로 다시 써 봅시다.',
    mid:  '다른 자료(정성·정량) 한 가지를 더해 질문을 ‘연결 질문’으로 확장해 봅시다.',
    high: '개념 렌즈(예: 지속가능성, 정의, 변화)를 적용해 질문을 추상 단계로 끌어올려 봅시다.',
  },
  inquire: {
    low:  '이 질문에 답하려면 어떤 자료 한 가지를 더 봐야 할까요?',
    mid:  '자료 조사 외에 어떤 실험/관찰/인터뷰가 답을 더 풍부하게 할까요?',
    high: '여러 출처가 충돌한다면 어떤 기준으로 신뢰할 만한 근거를 골라야 할까요?',
  },
  // legacy — 마이그레이션 fallback
  itemize: {
    low:  '(구 버전 — refine 국면 + 평가문항 변환 버튼으로 대체)',
    mid:  '(구 버전 — refine 국면 + 평가문항 변환 버튼으로 대체)',
    high: '(구 버전 — refine 국면 + 평가문항 변환 버튼으로 대체)',
  },
  reflect: {
    low:  '이 질문을 탐구하면서 새로 알게 된 것은 무엇인가요?',
    mid:  '내 질문 / 친구 질문 중 가장 좋은 질문은 무엇이며, 그 이유는?',
    high: '이번 탐구가 만들어낸 ‘다음 질문’ 한 가지를 적어 봅시다. 무엇이 더 궁금해졌나요?',
  },
  // legacy — UI 표시 안 함, 마이그레이션 fallback용
  classify: {
    low:  '(구 버전 — refine 단계로 통합되었습니다)',
    mid:  '(구 버전 — refine 단계로 통합되었습니다)',
    high: '(구 버전 — refine 단계로 통합되었습니다)',
  },
}

/**
 * 학습자 다양성별 시드 오버라이드.
 * - 특수교육형: 시각적 자료 강조 · 단계 잘게 · 구체적 동사
 * - 다문화교육형: 자기 경험 · 가족 · 문화 비교 시작점
 */
export const STAGED_SEED_BY_DIVERSITY: Partial<
  Record<LearnerDiversity, Partial<Record<QuestionStage, Partial<Record<ProficiencyLevel, string>>>>>
> = {
  special: {
    generate: {
      low:  '자료에서 가장 먼저 눈에 들어오는 그림/사진은 무엇인가요? 한 가지만 골라 봅시다.',
      mid:  '자료에서 같은 색/모양/위치인 것을 두 개 찾아 봅시다. 둘 사이에 어떤 질문이 생기나요?',
      high: '자료를 친구에게 설명한다면, 어떤 질문을 먼저 물어볼 것 같나요?',
    },
    refine: {
      low:  '내 질문을 그림으로 표현해 봅시다. 그림이 더 분명해지려면 무엇을 추가해야 할까요?',
      mid:  '질문을 카드 한 장에 한 글자씩 적어 봅시다. 무엇이 바뀌면 더 좋아질까요?',
      high: '같은 질문을 친구가 다시 말한다면 어떻게 바꿔서 말할까요?',
    },
    inquire: {
      low:  '이 질문에 답하려면 어디서 알아볼 수 있을까요? (책 / 사람 / 직접 보기)',
      mid:  '답을 알아보는 순서를 1·2·3 단계로 나누어 봅시다.',
      high: '내가 알아본 답이 맞는지 어떻게 확인할까요? (친구·선생님·자료와 비교)',
    },
    reflect: {
      low:  '오늘 무엇이 가장 재미있었나요? 표정 그림으로 표현해 봅시다.',
      mid:  '내가 만든 질문 중에 가장 좋은 것은? 왜인가요?',
      high: '다음에 더 알고 싶은 것을 한 가지 적고, 친구에게 도움을 청해 봅시다.',
    },
  },
  multicultural: {
    generate: {
      low:  '내가 자란 곳/우리 가족의 경험과 자료가 비슷한 점, 다른 점은 무엇인가요?',
      mid:  '자료의 내용을 우리 가족·고향 친척이 본다면 어떤 질문을 할 것 같나요?',
      high: '자료가 보여주는 모습이 ‘모두에게 같은 모습’일까요? 누구의 시각이 빠져 있을까요?',
    },
    refine: {
      low:  '내 질문을 다른 언어(가족·친구의 언어)로 말하면 어떻게 바뀌나요?',
      mid:  '내 질문에 나의 문화·경험을 한 가지 더 넣어서 다시 써 봅시다.',
      high: '다른 배경을 가진 학생도 답할 수 있도록 질문을 ‘열어’ 다시 써 봅시다.',
    },
    inquire: {
      low:  '우리 가족이나 친척, 친구에게 이 질문을 묻는다면 어떤 답이 나올까요?',
      mid:  '서로 다른 배경의 두 사람이 이 질문에 다르게 답한다면, 무엇이 다를까요?',
      high: '같은 질문에 대해 두 문화의 답을 비교하면 어떤 공통점·차이점이 보이나요?',
    },
    reflect: {
      low:  '오늘 새로 알게 된 다른 친구의 생각/경험은 무엇인가요?',
      mid:  '내 경험과 친구의 경험이 만나서 어떤 새로운 질문이 생겼나요?',
      high: '오늘 배운 것을 가족·친척에게 어떻게 설명할 수 있을까요?',
    },
  },
}

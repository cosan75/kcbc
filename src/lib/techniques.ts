/* ============================================================
 *  창의적 사고·질문 기법 라이브러리
 *  ─ 「학생 질문 능력 계발 모델」 4유형의 놀이/활동 +
 *    일반 창의 사고법 (마인드맵·소크라테스·수평적 읽기 등)
 *  ─ 목표: 초등학생이 개념전이(Concept Transfer)할 수 있는
 *    깊이 있는 질문 생성
 *  ─ 모든 항목은 채팅창 입력 없이 클릭으로 시드/복사/적용 가능
 * ============================================================ */
import type { QLearningModel, QuestionStage } from '../domain'

export type TechniqueCategory =
  | 'all'
  | 'play'        // 놀이형
  | 'experiment'  // 실험·실습 연계형
  | 'discuss'     // 토의형
  | 'reflect'     // 성찰형
  | 'general'     // 일반 창의 사고법

export interface Technique {
  id: string
  ko: string                            // 한국어 이름
  en?: string                           // 영문 명칭
  emoji: string
  /** 어느 모델(들)에 가장 잘 어울리는가 */
  models: QLearningModel[]
  /** 어느 국면(들)에 사용 권장 */
  stages: QuestionStage[]
  oneLiner: string                       // 한 줄 설명
  desc: string                           // 3-4 문장 설명
  steps: string[]                        // 실행 절차 3-6단계
  example: string                        // 초등 적용 예시
  transferPrompt: string                 // 개념전이를 유도하는 셀 시드 문구
  source?: string                        // 출처
  category: TechniqueCategory
}

/** 15개 기법 마스터 라이브러리 */
export const TECHNIQUES: Technique[] = [
  // ─────── 질문 놀이형 (모델 책 출처) ───────
  {
    id: 'first-letter',
    ko: '질문 첫 글자 뽑기',
    emoji: '🎲',
    models: ['play'],
    stages: ['generate'],
    category: 'play',
    oneLiner: '학습 주제에서 첫 글자를 뽑아 그 글자로 시작하는 질문을 만든다.',
    desc:
      '단원 핵심 단어에서 첫 글자(자음 또는 음절)를 무작위 뽑기로 정한다. ' +
      '학생들은 그 글자로 시작하는 질문을 자유롭게 적는다. ' +
      '심리적 부담을 낮춰 다양한 질문을 모으는 데 효과적이다.',
    steps: [
      '주제 키워드 카드(한 글자씩) 준비',
      '학생이 카드 한 장을 뽑아 그 글자로 시작하는 질문 1-2개 작성',
      '모둠별 공유 + 칠판에 모두 게시',
      '비슷한 질문 묶어 ‘질문 지도’ 만들기',
    ],
    example:
      '단원: 우리 고장 자랑 → 카드 글자 "왜" 뽑힘 → "왜 우리 마을은 다른 마을과 다를까?"',
    transferPrompt:
      '주어진 자료에서 핵심 단어를 한 글자씩 뽑아, 그 글자로 시작하는 질문을 5개 이상 만들어 보세요. 그중 다른 단원/생활 상황에도 적용 가능한 질문을 ★표 하세요.',
    source: '「학생 질문 능력 계발 모델」 — 질문 놀이형',
  },
  {
    id: 'auction',
    ko: '질문 경매',
    emoji: '🏷',
    models: ['play', 'discuss'],
    stages: ['refine'],
    category: 'play',
    oneLiner: '학생이 만든 질문 중 “사고 싶은” 질문을 골라 정교화한다.',
    desc:
      '모둠이 만든 질문을 진열한 뒤 가상 화폐로 경매한다. ' +
      '학생들은 왜 그 질문이 가치 있는지 근거를 들어 입찰한다. ' +
      '질문의 ‘가치 평가’ 안목과 정교화를 동시에 기른다.',
    steps: [
      '각 학생/모둠이 질문 3-5개 작성',
      '가상 코인(예: 100코인) 배분',
      '돌아가며 마음에 드는 질문에 입찰 + 이유 설명',
      '낙찰 질문을 1단계 더 정교하게 다시 쓰기',
    ],
    example: '"왜 빈집이 많아?" → 낙찰 → "행복동 빈집 비율이 전국 평균보다 높은 까닭은 무엇인가?"',
    transferPrompt:
      '내 질문 중 다른 학년/다른 단원에서도 통할 만큼 ‘일반화 가능한 질문’ 3개를 골라 경매에 부쳐 봅시다. 가장 가치 있는 질문은 무엇이며 왜 그렇게 생각하나요?',
    source: '「학생 질문 능력 계발 모델」 — 질문 놀이형',
  },
  {
    id: 'dice-battle',
    ko: '질문 배틀 (주사위)',
    emoji: '🎯',
    models: ['play', 'experiment'],
    stages: ['inquire'],
    category: 'play',
    oneLiner: '주사위로 답 찾기 방법을 정해 빠른 탐구를 게임화한다.',
    desc:
      '주사위 면마다 ‘책에서 / 인터뷰 / 관찰 / 실험 / 비교 / 가설’ 같은 ' +
      '답 찾기 방법을 배정한다. 학생은 굴려 나온 방법으로 자기 질문에 답을 시도한다.',
    steps: [
      '주사위 6면에 답 찾기 방법 라벨링',
      '학생이 자기 질문을 들고 굴림',
      '나온 방법으로 5분 미니 탐구',
      '결과를 모둠에 공유하고 다른 방법과 비교',
    ],
    example:
      '"왜 우리 마을에 다리가 많을까?" → 굴림 "관찰" → 등굣길 다리 개수·위치 직접 세기',
    transferPrompt:
      '이 질문에 답하는 방법을 ‘책·인터뷰·관찰·실험·비교·가설’ 6가지로 나누어 봅시다. 한 가지를 골라 적용하고, 다른 단원의 비슷한 질문에도 같은 방법이 통할지 적어 보세요.',
    source: '「학생 질문 능력 계발 모델」 — 질문 놀이형',
  },
  {
    id: 'explore-cards',
    ko: '질문 탐험 카드 놀이',
    emoji: '🗺',
    models: ['play', 'reflect'],
    stages: ['reflect'],
    category: 'play',
    oneLiner: '탐구 여정을 카드로 펼쳐 보고 다음 질문을 만든다.',
    desc:
      '학생이 ‘처음 만든 질문 / 가장 어려웠던 점 / 새로 알게 된 것 / ' +
      '다음에 알고 싶은 것’ 카드를 채워 펼쳐 놓는다. 모둠끼리 카드를 ' +
      '읽으며 ‘다음 탐구 질문’을 함께 만든다.',
    steps: [
      '4가지 카드 양식 배포 (처음 질문/어려운 점/새 발견/다음 질문)',
      '개별 작성 후 모둠 책상 위에 모아 놓기',
      '시계 방향으로 한 장씩 읽고 공통 패턴 찾기',
      '모둠 공동 ‘다음 탐구 질문’ 1개 합의',
    ],
    example: '"우리 고장 탐구" 끝난 뒤 → 카드 모음 → "옆 마을은 우리와 어떤 점이 다를까?"',
    transferPrompt:
      '오늘 탐구한 내용에서 가장 중요한 발견 1가지를 적고, 그 발견이 다른 단원/생활에서 적용될 만한 상황을 1가지 떠올려 보세요.',
    source: '「학생 질문 능력 계발 모델」 — 질문 놀이형',
  },

  // ─────── 실험·실습 연계형 ───────
  {
    id: 'hypothesis-test',
    ko: '가설-검증 사이클',
    en: 'Hypothesis-Test Cycle',
    emoji: '🧪',
    models: ['experiment'],
    stages: ['refine', 'inquire'],
    category: 'experiment',
    oneLiner: '질문 → 가설 → 실험 → 결과 → 새 질문의 순환을 짧게 반복한다.',
    desc:
      '학생이 질문을 “만약 ~라면, ~일 것이다” 가설로 바꾸고, ' +
      '실험·관찰로 검증한 뒤 결과에서 새 질문을 도출한다. ' +
      '실패한 가설도 새 질문의 출발점이 된다.',
    steps: [
      '질문을 “만약 ~라면, ~일 것이다” 형식으로 변환',
      '검증 방법 (실험/관찰/측정) 2가지 이상 제안',
      '실행 + 결과 기록',
      '결과에서 새 질문 1개 도출 (성공이든 실패든)',
    ],
    example:
      '"식물은 어두운 곳에서도 자랄까?" → 가설 "햇빛 없는 컵 식물은 잎이 노래질 것이다" → 7일 관찰 → "그럼 노래진 잎은 다시 살아날까?"',
    transferPrompt:
      '이 질문을 가설 문장으로 바꾸고, 검증할 방법을 2가지 제안해 보세요. 실험 결과와 상관없이 ‘새 질문 1개’가 자연스럽게 떠오르도록 적어 보세요.',
  },
  {
    id: 'observe-record',
    ko: '관찰-기록-비교',
    emoji: '🔬',
    models: ['experiment'],
    stages: ['inquire'],
    category: 'experiment',
    oneLiner: '같은 대상을 시간/조건 달리해 관찰·기록한 뒤 패턴을 찾는다.',
    desc:
      '구체적 관찰 항목과 단위를 미리 정해 학생이 객관적으로 기록하게 한다. ' +
      '두 시점/두 조건의 결과를 나란히 놓아 ‘차이의 이유’를 질문으로 만든다.',
    steps: [
      '관찰 항목 3-5개 합의 (예: 색깔/높이/주변 환경)',
      '두 시점(또는 두 장소) 데이터 표로 정리',
      '차이가 큰 항목 표시',
      '"왜 이 차이가 났을까?" 질문으로 전환',
    ],
    example: '운동장 그늘 vs 양지 식물 키 7일 관찰 → "왜 양지가 더 자랐을까? 다른 식물도 같을까?"',
    transferPrompt:
      '이 질문과 관련된 관찰 항목 3가지를 정하고, 두 조건(시간·장소·집단)에서 비교해 보세요. 발견한 차이로 ‘다음 질문’을 만들어 보세요.',
  },
  {
    id: 'variable-control',
    ko: '변인 통제 매트릭스',
    en: 'Variable Control Matrix',
    emoji: '🧮',
    models: ['experiment'],
    stages: ['refine', 'inquire'],
    category: 'experiment',
    oneLiner: '바꿀 변인 1개·일정하게 둘 변인 N개를 표로 명시한다.',
    desc:
      '실험에서 “무엇을 바꾸고 무엇을 일정하게 둘지” 표로 분리한다. ' +
      '변인이 뒤섞이면 결과 해석이 불가하다는 과학적 사고의 기본 — ' +
      '학생이 표를 그리는 과정에서 자연스레 ‘왜 이 변인을 통제했나?’를 묻게 된다.',
    steps: [
      '“바꾸는 변인 (조작변인)” 1개 명시',
      '“일정하게 두는 변인 (통제변인)” 3-5개 표 열로 나열',
      '“측정하는 변인 (종속변인)” 1개 + 단위·시점',
      '한 행 = 한 시도. 시도별 값 채우기',
      '결과에서 “바꾼 변인이 정말 원인인가?” 비판 질문 만들기',
    ],
    example:
      '"식물은 햇빛 양에 따라 다르게 자랄까?" → 조작:햇빛 / 통제:물·온도·흙·물 주는 시간 / 종속:잎 수 (5일째)',
    transferPrompt:
      '이 질문을 검증할 때 “바꿀 변인 1개”와 “일정하게 둘 변인 3개 이상”을 표로 분리해 보세요. 그 표가 다른 실험(다른 단원)에도 적용 가능한지 표시하세요.',
  },

  // ─────── 토의형 ───────
  {
    id: 'socratic',
    ko: '소크라테스 문답법',
    en: 'Socratic Questioning',
    emoji: '🏛',
    models: ['discuss', 'reflect'],
    stages: ['refine', 'itemize'],
    category: 'discuss',
    oneLiner: '교사·학생이 “왜 그렇게 생각해?”를 6단계로 파고든다.',
    desc:
      '명확화 → 가정 점검 → 근거 묻기 → 다른 관점 → 결과 추적 → ' +
      '질문 자체에 대한 질문, 6범주로 답을 깊이 파고드는 고전 기법. ' +
      '학생이 자기 생각의 근거를 스스로 발견하게 한다.',
    steps: [
      '명확화: "그게 무슨 뜻이야? 예를 들면?"',
      '가정 점검: "왜 그게 당연하다고 생각해?"',
      '근거 묻기: "어떻게 알았어? 자료가 있어?"',
      '다른 관점: "다르게 보는 사람이 있을까?"',
      '결과 추적: "그렇다면 어떻게 될까?"',
      '메타: "이 질문 자체가 좋은 질문일까?"',
    ],
    example: '학생: "환경이 중요해요" → 교사: "환경이 무슨 뜻이야? 예를 들면? 다른 친구는 동의해?"',
    transferPrompt:
      '이 질문에 학생이 답한다고 가정하고, 답을 6단계 소크라테스 문답으로 깊이 파고드는 후속 질문 6개를 만들어 보세요.',
    source: 'Socratic Questioning · R. Paul & L. Elder',
  },
  {
    id: 'six-hats',
    ko: '여섯 색깔 모자',
    en: 'Six Thinking Hats',
    emoji: '🎩',
    models: ['discuss'],
    stages: ['refine', 'itemize'],
    category: 'discuss',
    oneLiner: '하나의 주제를 6가지 사고 방식(모자)으로 돌아가며 본다.',
    desc:
      '백(사실)·적(감정)·흑(비판)·황(긍정)·녹(창의)·청(메타) 6가지 색 모자를 ' +
      '돌려쓰며 같은 주제를 다각도로 분석한다. 일방적 토론을 막고 ' +
      '균형 잡힌 사고를 훈련한다.',
    steps: [
      '주제 한 개 합의',
      '6명/6모둠이 각자 한 색 모자 담당',
      '각자 그 관점으로만 1분 발표',
      '모자 한 번 더 돌리기 (시각 전환)',
      '최종 종합 질문 1개 합의',
    ],
    example: '"학교 급식에 채식 메뉴 도입" → 백(영양 데이터) 적(맛 거부감) 흑(비용) 황(건강) 녹(다양화) 청(왜 이 토론?)',
    transferPrompt:
      '이 주제에 대해 6색 모자(사실·감정·비판·긍정·창의·메타) 관점의 질문을 각 1개씩, 총 6개를 만들어 보세요.',
    source: 'Edward de Bono · Six Thinking Hats',
  },
  {
    id: 'fishbowl',
    ko: '어항 토의',
    en: 'Fishbowl Discussion',
    emoji: '🐟',
    models: ['discuss'],
    stages: ['inquire', 'reflect'],
    category: 'discuss',
    oneLiner: '안쪽 4-5명이 토의, 바깥은 관찰·메모 → 자리 교체.',
    desc:
      '소수가 안쪽 원에서 깊이 토의하고, 바깥쪽 학생들은 ‘무엇을 ' +
      '잘했나/놓쳤나’ 관찰 메모를 한다. 안팎 자리를 교체해 모두가 ' +
      '관찰자·발언자를 경험하게 한다.',
    steps: [
      '의자 안 원(4-5) + 바깥 원으로 배치',
      '안쪽 5-7분 토의 (교사는 개입 최소)',
      '바깥 학생은 ‘좋은 점/놓친 점/궁금한 점’ 메모',
      '자리 교체 + 안쪽 새 멤버는 바깥 메모를 받아 토의 계속',
    ],
    example: '"왜 우리 동네 거리에 가로등이 부족할까?" 안쪽 5명 토의 / 바깥 20명 메모 → 교체',
    transferPrompt:
      '이 질문으로 어항 토의를 한다고 가정하고, 안쪽 학생들이 깊이 들어가야 할 후속 질문 3개 + 바깥 관찰자가 적어야 할 체크 포인트 3개를 만들어 보세요.',
  },

  // ─────── 성찰형 ───────
  {
    id: 'kwl',
    ko: 'KWL 차트',
    en: 'Know · Wonder · Learned',
    emoji: '📊',
    models: ['reflect'],
    stages: ['generate', 'reflect'],
    category: 'reflect',
    oneLiner: '안다(K)·궁금하다(W)·배웠다(L) 세 칸으로 학습 메타인지.',
    desc:
      '단원 시작 전 K/W 칸을 채우고, 단원 끝나면 L 칸을 채운다. ' +
      'W에서 답하지 못한 것은 다음 학습의 출발점이 된다. ' +
      '학습 전후 변화를 학생 스스로 확인하게 한다.',
    steps: [
      '3칸 표 그리기 (K | W | L)',
      '단원 시작: K(이미 아는 것), W(궁금한 것) 작성',
      '단원 중간: W 답을 찾아가며 L 채우기',
      '단원 끝: W 중 남은 항목 → 다음 단원·생활로 전이',
    ],
    example: '단원 "지역" → K: "우리 동네 이름" / W: "왜 동네마다 다를까?" / L: "지리 환경 때문"',
    transferPrompt:
      '이 단원에서 학생이 단원 전 K, W, 단원 후 L에 무엇을 적을지 예측해 보고, W 중 ‘다음 학년·다른 교과로 이어질 만한 질문’을 1개 표시해 보세요.',
    source: 'Donna Ogle (1986) · K-W-L',
  },
  {
    id: 'reflection-journal',
    ko: '회고 일기 5문항',
    emoji: '📓',
    models: ['reflect'],
    stages: ['reflect'],
    category: 'reflect',
    oneLiner: '오늘 / 어렵 / 새롭 / 다음 / 비유 5문항으로 짧게 회고.',
    desc:
      '5문항으로 가볍게 기록하는 학습 일기. 매 수업 5분 투자로 ' +
      '메타인지가 누적된다. ‘비유’ 항목은 개념전이를 자극한다.',
    steps: [
      '5칸 양식 배포 (오늘/어려운 점/새로운 점/다음 질문/비유)',
      '수업 마무리 5분간 작성',
      '한 주에 한 번 모아 패턴 찾기',
      '학생부 기록 자료로 활용',
    ],
    example: '"오늘: 분수의 덧셈 / 어려움: 분모 통분 / 새로움: 약분 / 다음: 곱셈은? / 비유: 피자 조각 합치기"',
    transferPrompt:
      '오늘 학습을 회고하며 "이 개념은 ___와(과) 닮았다"는 비유 문장을 한 줄 만들어 보세요. 그 비유가 어울리는 새 상황을 한 가지 더 떠올려 보세요.',
  },

  // ─────── 일반 창의 사고법 ───────
  {
    id: 'mindmap',
    ko: '마인드맵',
    en: 'Mind Map',
    emoji: '🧠',
    models: ['play', 'discuss', 'reflect'],
    stages: ['generate', 'refine'],
    category: 'general',
    oneLiner: '중심 단어에서 가지를 뻗어 연관 개념을 시각화.',
    desc:
      '중앙에 핵심 단어를 두고 방사형으로 가지를 그리며 관련 단어/질문을 ' +
      '연결한다. 색·이미지·키워드를 활용해 우뇌적 사고를 자극하고 ' +
      '개념 간 관계를 시각화한다.',
    steps: [
      '중앙에 핵심 개념·질문 적기',
      '1차 가지로 3-5개 큰 범주',
      '각 범주에서 2차 가지(예시/이유/관련 질문)',
      '교차 연결선으로 ‘개념 간 다리’ 표시',
    ],
    example: '중앙 "환경" → 가지: 기후/동물/사람 활동 → 각 가지에서 "왜?" 질문 파생',
    transferPrompt:
      '이 질문의 핵심 개념을 중앙에 두고 마인드맵 3차 가지까지 그려 보세요. 가지 끝의 단어가 다른 단원에 등장한 적이 있는지 표시하세요.',
    source: 'Tony Buzan',
  },
  {
    id: 'see-think-wonder',
    ko: 'See·Think·Wonder',
    en: 'See–Think–Wonder',
    emoji: '👀',
    models: ['play', 'discuss', 'reflect'],
    stages: ['generate'],
    category: 'general',
    oneLiner: '자료를 보고 ‘본 것 → 생각 → 궁금증’ 순서로 단계별 진술.',
    desc:
      '하버드 프로젝트 제로의 사고 루틴. 학생이 자료(그림/사진/표)를 ' +
      '보며 ‘객관 관찰 → 해석 → 질문’ 순서로 분리해 진술한다. ' +
      '관찰과 해석을 섞지 않게 훈련한다.',
    steps: [
      '자료 1장 제시 (그림/사진/통계)',
      '학생이 "보이는 것"만 3개 적기 (해석 금지)',
      '"생각나는 것" 2개 적기 (왜 그럴까)',
      '"궁금한 것" 1개 적기 → 탐구 질문',
    ],
    example: '"마을 풍경 사진" → See: 빈집 / Think: 사람들이 떠났나 / Wonder: 왜 떠났을까?',
    transferPrompt:
      '이 자료를 See(본 것)·Think(생각한 것)·Wonder(궁금한 것) 세 칸으로 나누어 학생이 적을 만한 진술을 각 칸에 2개씩 작성해 보세요.',
    source: 'Harvard Project Zero · Visible Thinking',
  },
  {
    id: 'lateral-reading',
    ko: '수평적 읽기',
    en: 'Lateral Reading',
    emoji: '🔍',
    models: ['discuss', 'reflect'],
    stages: ['refine', 'inquire'],
    category: 'general',
    oneLiner: '한 자료에 머물지 말고 ‘다른 출처와 비교’부터 시작하기.',
    desc:
      '한 자료의 신뢰도를 평가할 때 그 자료 안에 머무르지 말고 ' +
      '다른 출처(검색·다른 책·다른 입장)를 먼저 열어 비교한다. ' +
      'AI 시대 정보 리터러시의 핵심 기법.',
    steps: [
      '주장이나 자료 한 개 선택',
      '브라우저 탭 3개 열기 — 다른 출처 검색',
      '같은 사실을 누가 어떻게 말하는지 비교',
      '의견·사실·광고를 색 구분으로 표시',
    ],
    example: '"AI가 1년에 ~억원 절약한대" → 다른 신문 3곳 검색 → 출처별 수치 비교',
    transferPrompt:
      '이 질문에 답할 때 사용할 자료를 최소 3개 출처에서 찾고, 같은 주제를 어떻게 다르게 다루는지 비교 표를 만들어 보세요.',
    source: 'Stanford History Education Group · Civic Online Reasoning',
  },
  {
    id: 'qft',
    ko: 'QFT 질문 형성 기법',
    en: 'Question Formulation Technique',
    emoji: '✨',
    models: ['play', 'discuss'],
    stages: ['generate', 'refine'],
    category: 'general',
    oneLiner: '4규칙으로 질문 폭발 → 분류 → 정교화 → 우선순위.',
    desc:
      'Right Question Institute가 개발한 학생 주도 질문 만들기 절차. ' +
      '"평가/판단 금지, 답하지 않기, 떠오른 대로 기록, 진술문은 질문화" ' +
      '4규칙을 지키며 질문을 만든 뒤 폐쇄/개방 분류, 정교화, 우선순위로 ' +
      '진행한다.',
    steps: [
      '질문 초점 자료 제시 (한 줄/사진 1장)',
      '4규칙 안내 후 질문 폭발 (5-10분)',
      '폐쇄형/개방형 분류 + 서로 바꿔 보기',
      '탐구 가치 있는 3개 우선순위 선정',
      '왜 그 3개를 골랐는지 메타 성찰',
    ],
    example: '"우리 마을의 빈 상가 사진" → 30개 질문 폭발 → 우선순위 "왜 빈 상가가 늘었나? 누구의 책임인가?"',
    transferPrompt:
      'QFT 4규칙을 지켜 이 자료에서 학생이 5분 동안 만들 만한 질문 10개를 예시로 작성하세요. 그중 우선순위 3개와 그 이유를 표시하세요.',
    source: 'Rothstein & Santana · Make Just One Change (Right Question Institute)',
  },
  {
    id: 'scamper',
    ko: 'SCAMPER',
    en: 'SCAMPER',
    emoji: '🔀',
    models: ['experiment', 'discuss'],
    stages: ['refine'],
    category: 'general',
    oneLiner: '대체·결합·응용·수정·다른용도·제거·재배열 7가지로 비틀기.',
    desc:
      'Substitute, Combine, Adapt, Modify, Put to other use, Eliminate, ' +
      'Rearrange. 기존 것의 한 요소를 7가지 방식으로 비틀어 새 질문/아이디어를 ' +
      '만든다. 개념전이에 특히 강력.',
    steps: [
      '주제·대상 한 개 선택',
      'S·C·A·M·P·E·R 7개 카드 준비',
      '카드 한 장씩 뽑아 "만약 ~ 한다면?" 질문 만들기',
      '7가지 질문 중 가장 가치 있는 것 선정',
    ],
    example: '"우리 학교 급식" → S: 채식으로 대체? / C: 학생과 결합? / A: 다른 학교 따라하기? ...',
    transferPrompt:
      '이 주제(또는 개념)를 SCAMPER 7가지 방식으로 비틀어 "만약 ~ 한다면?" 질문을 7개 만들어 보세요. 가장 새로운 시각을 주는 1개를 ★표 하세요.',
    source: 'Bob Eberle · SCAMPER',
  },
  {
    id: 'five-whys',
    ko: '5 Why (다섯 번 왜)',
    en: '5 Whys',
    emoji: '🪜',
    models: ['discuss', 'reflect'],
    stages: ['refine', 'reflect'],
    category: 'general',
    oneLiner: '한 문장에 “왜?”를 5번 이어 물어 근본 원인까지 사다리 내려가기.',
    desc:
      'Toyota 생산 시스템의 근본 원인 분석 기법. 표면 답에 멈추지 않고 ' +
      '“왜?”를 다섯 번 반복해 원인 사슬을 끝까지 추적한다. ' +
      '초등생도 직관적으로 따라할 수 있어 인과 사고 입문에 강력.',
    steps: [
      '관찰된 사실/현상 한 문장 적기',
      '"왜?" 1번째 → 답 1줄',
      '그 답에 다시 "왜?" 2번째 → 답 1줄',
      '5번까지 반복',
      '5번째 답이 ‘근본 원인’ — 이게 다른 단원/생활에도 적용되는가?',
    ],
    example:
      '"우리 동네 가게가 줄었다" → 왜? 손님이 적어서 → 왜? 사람들이 이사 가서 → 왜? 일자리가 적어서 → 왜? 큰 회사가 떠나서 → 왜? 더 큰 도시로 옮겨서 (근본: 지역 경제 변화)',
    transferPrompt:
      '이 질문(또는 학생 답안)에 “왜?”를 5번 연결해 사다리를 내려가 보세요. 5번째 답이 다른 단원/사회 현상에서도 통하는 ‘일반화 가능한 원인’인지 표시하세요.',
    source: 'Sakichi Toyoda · Toyota Production System',
  },
]

/* ============================================================
 *  Cross-component 시드 전달 (단계형 작성기로 보내기)
 *  - localStorage 한 키에 보류 시드를 저장
 *  - StagedAssessmentBuilder가 마운트 시 확인하고 적용 확인 후 셀에 채움
 * ============================================================ */

export interface PendingSeed {
  techniqueId: string
  techniqueKo: string
  text: string
  stage: QuestionStage
  level: 'low' | 'mid' | 'high'
  createdAt: number
}

const SEED_KEY = 'kcbc:pending-seed'

export function setPendingSeed(seed: PendingSeed): void {
  localStorage.setItem(SEED_KEY, JSON.stringify(seed))
}

export function consumePendingSeed(): PendingSeed | null {
  try {
    const raw = localStorage.getItem(SEED_KEY)
    if (!raw) return null
    localStorage.removeItem(SEED_KEY)
    return JSON.parse(raw) as PendingSeed
  } catch {
    return null
  }
}

/* ============================================================
 *  셀 단위 추천 (모델 × 국면 매칭)
 *  - 정렬 규칙: 모델 책 직접 출처 > 국면 정확 매칭 > 모델 매칭 > 이름순
 *  - 추천 0개일 때는 "일반" 카테고리 fallback
 * ============================================================ */
import type { QLearningModel as _M, QuestionStage as _S } from '../domain'

export function recommendForCell(
  stage: _S,
  model: _M | undefined,
  limit = 4,
): Technique[] {
  const scored = TECHNIQUES.map((t) => {
    let score = 0
    // 모델 책 직접 출처 (놀이형 4개) — 강한 가중
    if (t.source?.includes('「학생 질문 능력 계발 모델」')) score += 100
    // 국면 정확 매칭
    if (t.stages.includes(stage)) score += 50
    // 모델 매칭
    if (model && t.models.includes(model)) score += 30
    // 일반 카테고리는 fallback 가치
    if (t.category === 'general') score += 5
    return { t, score }
  })

  // 우선 매칭 강한 것만 (score >= 30)
  let primary = scored.filter((x) => x.score >= 30)
  if (primary.length === 0) {
    // fallback: 일반 + 국면 매칭이라도
    primary = scored.filter((x) => x.score > 0)
  }
  primary.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.t.ko.localeCompare(b.t.ko, 'ko-KR')
  })
  return primary.slice(0, limit).map((x) => x.t)
}

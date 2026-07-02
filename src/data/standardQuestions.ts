/**
 * 표준 평가 문항 5문항 — 스킬.md (사회과 서·논술형) 의 구조화 버전
 *
 * 원본: kcbc/스킬.md
 * Drive 저장 위치: 평가시대/산출물_아이디어/평가문항_*.json
 *
 * 이 파일은 React 앱에 baked-in 되어 있어 오프라인에서도 즉시 import 가능.
 * Drive 의 JSON 파일들은 외부 공유·백업·다른 도구 연동용 캐노니컬 소스.
 */

import type { AssessmentDraft } from '../domain'
import { DEFAULT_RUBRIC } from '../domain'

const COMMON_SOURCE = 'OpenAI(2025). ChatGPT[거대 언어 모델]. http://chat.open.com/chat'

export const STANDARD_QUESTIONS: AssessmentDraft[] = [
  {
    id: 'std_q1_geo',
    no: 1,
    type: '서술형',
    domain: '지리',
    title: '우리 지역의 자연환경',
    prompt: '우리 마을 안내 책자의 내용을 읽고 물음에 답하세요.',
    totalScore: 8,
    materialLabel: '우리 마을 안내 책자',
    material:
      `┌─────────────────────────────────────────────────────┐
│  🏞️  우리 마을 안내 책자                              │
│  OOOO년 OO월 OO일 발행                                │
│─────────────────────────────────────────────────────│
│  특집: 산과 강이 만든 우리 마을의 모습                  │
│                                                     │
│  [사진 A — 산비탈의 다랭이 논, 사과 과수원]            │
│  [사진 B — 강가의 평야, 비닐하우스, 큰 다리]           │
│                                                     │
│  ▲ 산골 마을        ▲ 강가 마을                      │
└─────────────────────────────────────────────────────┘`,
    source: COMMON_SOURCE,
    subQuestions: [
      {
        text: '산골 마을과 강가 마을 사람들의 생활 모습을 자연환경과 관련지어 3가지 비교하여 서술하세요.',
        score: 6,
      },
      {
        text: '두 마을 중 한 곳을 선택해, 그 마을 사람들이 자연환경을 이용하는 방법 1가지와 그렇게 이용하는 이유를 서술하세요.',
        score: 2,
      },
    ],
    rubric: DEFAULT_RUBRIC.map((r) => ({ ...r })),
    createdAt: Date.UTC(2026, 5, 1),
    updatedAt: Date.UTC(2026, 5, 1),
  },
  {
    id: 'std_q2_history',
    no: 2,
    type: '서술형',
    domain: '역사',
    title: '옛날과 오늘날의 가족생활',
    prompt: '할머니의 옛날이야기를 읽고 물음에 답하세요.',
    totalScore: 8,
    materialLabel: '할머니의 옛날이야기',
    material:
      `┌─────────────────────────────────────────────────────┐
│  👵  할머니의 옛날이야기                              │
│─────────────────────────────────────────────────────│
│  "내가 어릴 적엔 할아버지·할머니, 큰아버지 식구들까지   │
│   한집에 10명이 함께 살았단다. 명절이면 온 가족이      │
│   모여 송편을 빚고, 어른 말씀을 듣는 게 큰일이었지."   │
│                                                     │
│  ─────────────────────────────────────              │
│                                                     │
│  📷  오늘날 우리 가족                                │
│  "엄마, 아빠, 나, 동생 4명이 살아요. 할머니 댁은       │
│   영상통화로 자주 만나고, 명절에는 차로 다녀와요."     │
└─────────────────────────────────────────────────────┘`,
    source: COMMON_SOURCE,
    subQuestions: [
      {
        text: '옛날과 오늘날의 가족 형태와 생활 모습이 어떻게 달라졌는지 3가지 서술하세요.',
        score: 6,
      },
      {
        text: '(1)에서 답한 변화 중 1가지를 골라, 그렇게 변화하게 된 사회적 원인을 서술하세요.',
        score: 2,
      },
    ],
    rubric: DEFAULT_RUBRIC.map((r) => ({ ...r })),
    createdAt: Date.UTC(2026, 5, 1),
    updatedAt: Date.UTC(2026, 5, 1),
  },
  {
    id: 'std_q3_economy',
    no: 3,
    type: '논술형',
    domain: '경제',
    title: '합리적인 소비 선택',
    prompt: '광고지를 보고 물음에 답하세요.',
    totalScore: 10,
    materialLabel: '하늘마트 주말 광고지',
    material:
      `┌─────────────────────────────────────────────────────┐
│  🛒  하늘마트 주말 광고지                             │
│─────────────────────────────────────────────────────│
│                                                     │
│  ┌──────────┬──────────┬──────────┐                │
│  │  운동화 A │  운동화 B │  운동화 C │                │
│  ├──────────┼──────────┼──────────┤                │
│  │ 35,000원 │ 50,000원 │ 80,000원 │                │
│  │ 디자인★★ │ 디자인★★★│ 디자인★★★│                │
│  │ 내구성★★ │ 내구성★★★│ 내구성★★★│                │
│  │ 국내 생산 │ 국내 생산 │ 해외 생산 │                │
│  └──────────┴──────────┴──────────┘                │
│                                                     │
│  ※ 민지의 용돈은 60,000원입니다.                      │
└─────────────────────────────────────────────────────┘`,
    source: COMMON_SOURCE,
    subQuestions: [
      {
        text: '민지가 운동화를 살 때 고려해야 할 기준을 광고지에서 찾아 3가지 서술하세요.',
        score: 3,
      },
      {
        text: '자신이 민지라면 A, B, C 중 어떤 운동화를 선택할지 정하고, 합리적 선택의 이유를 2가지 이상 들어 서술하세요.',
        score: 5,
      },
      {
        text: '합리적인 소비가 우리 생활에 왜 중요한지 한 문장으로 서술하세요.',
        score: 2,
      },
    ],
    rubric: DEFAULT_RUBRIC.map((r) => ({ ...r })),
    createdAt: Date.UTC(2026, 5, 1),
    updatedAt: Date.UTC(2026, 5, 1),
  },
  {
    id: 'std_q4_politics',
    no: 4,
    type: '서술형',
    domain: '정치',
    title: '민주적 의사결정',
    prompt: '우리 반 학급 회의록을 읽고 물음에 답하세요.',
    totalScore: 8,
    materialLabel: '4학년 2반 학급 회의록',
    material:
      `┌─────────────────────────────────────────────────────┐
│  📋  4학년 2반 학급 회의록                            │
│  주제: 학급 텃밭에 무엇을 심을까?                      │
│─────────────────────────────────────────────────────│
│  · 의견 1 (지호) : 상추를 심자. 키우기 쉽다.           │
│  · 의견 2 (수아) : 방울토마토를 심자. 인기 많다.       │
│  · 의견 3 (도윤) : 허브를 심자. 향이 좋다.             │
│                                                     │
│  ─ 토의 과정 ─                                       │
│  "왜 그렇게 생각하나요?" / "다른 의견도 들어볼까요?"    │
│                                                     │
│  ─ 표결 결과 ─                                       │
│   상추 7표 │ 방울토마토 14표 │ 허브 4표                 │
│  → 결정: 방울토마토                                   │
└─────────────────────────────────────────────────────┘`,
    source: COMMON_SOURCE,
    subQuestions: [
      {
        text: '위 회의록에서 찾을 수 있는 민주주의의 원리 또는 민주적 태도를 3가지 서술하세요.',
        score: 6,
      },
      {
        text: '만약 표결 결과가 동수였다면, 우리 반은 어떤 방법으로 결정해야 좋을지 한 가지를 제안하고 그 이유를 서술하세요.',
        score: 2,
      },
    ],
    rubric: DEFAULT_RUBRIC.map((r) => ({ ...r })),
    createdAt: Date.UTC(2026, 5, 1),
    updatedAt: Date.UTC(2026, 5, 1),
  },
  {
    id: 'std_q5_sustain',
    no: 5,
    type: '논술형',
    domain: '지속가능 발전',
    title: '지구촌 환경 문제 — 기후 변화',
    prompt: '어린이 환경 신문의 내용을 읽고 물음에 답하세요.',
    totalScore: 10,
    materialLabel: '어린이 환경 신문',
    material:
      `┌─────────────────────────────────────────────────────┐
│  🌍  어린이 환경 신문                                │
│  OOOO년 OO월 OO일 O요일                              │
│─────────────────────────────────────────────────────│
│  특집: 빙하가 녹고 있어요                              │
│                                                     │
│  [그래프] 1980 → 2025 북극 빙하 면적 변화 (꾸준한 감소)│
│  [사진]  바다 위 작은 빙하 위 북극곰 한 마리           │
│                                                     │
│  "지난 40년간 북극의 빙하 면적이 약 40% 줄었습니다.    │
│   해수면이 높아져 섬에 사는 사람들이 집을 옮기고,      │
│   북극곰은 살 곳을 잃어가고 있어요."                   │
└─────────────────────────────────────────────────────┘`,
    source: COMMON_SOURCE,
    subQuestions: [
      {
        text: "위 자료를 바탕으로 지구촌 환경 문제 중 '기후 변화'로 인해 나타나는 모습을 3가지 서술하세요.",
        score: 3,
      },
      {
        text: '기후 변화 문제 해결을 위해 세계 여러 나라가 함께 노력해야 하는 이유를 서술하세요.',
        score: 3,
      },
      {
        text: '내가 학교와 가정에서 실천할 수 있는 방법 2가지를 구체적으로 서술하세요.',
        score: 4,
      },
    ],
    rubric: DEFAULT_RUBRIC.map((r) => ({ ...r })),
    createdAt: Date.UTC(2026, 5, 1),
    updatedAt: Date.UTC(2026, 5, 1),
  },
]

/** Drive 산출물_아이디어 폴더 내 파일 매핑 (가져오기 UI 에 표시) */
export const STANDARD_QUESTIONS_DRIVE_FOLDER =
  'https://drive.google.com/drive/folders/1VvtOWxOaW9clzTjXb9OO6uA0fSzsPWUb'

export interface DriveFileRef {
  id: string
  fileId: string
  filename: string
  url: string
}

/**
 * Drive 에 업로드된 5개 JSON 파일의 실제 메타데이터.
 * (2026-06-09 업로드, 평가시대/산출물_아이디어 폴더)
 */
export const STANDARD_QUESTIONS_DRIVE_FILES: DriveFileRef[] = [
  {
    id: 'std_q1_geo',
    fileId: '17OQhYGeT3ji2zrHAAmu72xJlCp1B3R_z',
    filename: '평가문항_1_지리.json',
    url: 'https://drive.google.com/file/d/17OQhYGeT3ji2zrHAAmu72xJlCp1B3R_z/view',
  },
  {
    id: 'std_q2_history',
    fileId: '17pw0KPyIMLnbNlPJPW7gykkcHcjpUoou',
    filename: '평가문항_2_역사.json',
    url: 'https://drive.google.com/file/d/17pw0KPyIMLnbNlPJPW7gykkcHcjpUoou/view',
  },
  {
    id: 'std_q3_economy',
    fileId: '11wwfqJUtSzGjIJp03RW246x-CvxD7kSy',
    filename: '평가문항_3_경제.json',
    url: 'https://drive.google.com/file/d/11wwfqJUtSzGjIJp03RW246x-CvxD7kSy/view',
  },
  {
    id: 'std_q4_politics',
    fileId: '1WjrJbY2xp97aUhrPgAfLxuqirxYUyzJS',
    filename: '평가문항_4_정치.json',
    url: 'https://drive.google.com/file/d/1WjrJbY2xp97aUhrPgAfLxuqirxYUyzJS/view',
  },
  {
    id: 'std_q5_sustain',
    fileId: '1RMkpvmXpzi6m2-RyC9w2JlrofV6v5f3b',
    filename: '평가문항_5_지속가능발전.json',
    url: 'https://drive.google.com/file/d/1RMkpvmXpzi6m2-RyC9w2JlrofV6v5f3b/view',
  },
]

export const STANDARD_QUESTIONS_MANIFEST_ID = '1Uj2vf0zHpU9LVEBnUV59bTEKU-pynC8P'

/**
 * KCBC 전체 흐름을 6장 카드뉴스로 설명.
 * - 좌우 화살표·도트 네비
 * - 자동재생 토글
 * - 모바일에서도 1장씩 풀폭 표시
 */
import { useEffect, useState } from 'react'

interface Card {
  id: string
  badge: string
  title: string
  subtitle: string
  bullets: string[]
  accent: 'violet' | 'brand' | 'teal' | 'amber' | 'rose' | 'green'
  emoji: string
}

const CARDS: Card[] = [
  {
    id: 'goal',
    badge: '01 · 목표',
    title: '학생이 질문하는 학교',
    subtitle: '「질문하는 학교」 정책의 교실 실천 도구',
    bullets: [
      '이화여대 산학협력단·교육부 정책 프레임',
      '4영역: 질문 배우기 / 으로 배우기 / 하며 살기 / 학교문화',
      'KCBC는 ★질문 배우기 + ★질문으로 배우기 영역의 교사 도구',
    ],
    accent: 'violet',
    emoji: '🏛',
  },
  {
    id: 'frame',
    badge: '02 · 상위 프레임',
    title: '학생 질문 능력 계발 모델 4유형',
    subtitle: '교사가 수업 성격에 맞게 모델을 선택',
    bullets: [
      '🎮 질문 놀이형 — 질문의 즐거움 · 자유로운 시도',
      '🧪 실험·실습 연계형 — 탐구 순환 · 복합 개념 깊이',
      '🗣 질문 토의형 — 비판적 사고 · 민주적 소통',
      '🪞 질문 성찰형 — 메타 인지 · 사고 확장',
    ],
    accent: 'brand',
    emoji: '🏷',
  },
  {
    id: 'matrix',
    badge: '03 · 핵심 도구',
    title: '단계형 매트릭스 (5국면 × 3수준)',
    subtitle: '하나의 평가를 15셀로 입체화',
    bullets: [
      '국면: 생성 → 정교화 → 탐구 → 평가화 → 성찰',
      '수준: PISA 2029 MAIL 학생 기대 진행 상황 (낮·중·높)',
      'OECD MAIL 5역량 + 한국 5요소(정혜승) 이중 태그',
      'MAIL 균형 점수 + 개방형 신호 자동 진단',
    ],
    accent: 'teal',
    emoji: '🧭',
  },
  {
    id: 'grade',
    badge: '04 · AI 채점',
    title: '토큰 가시화 채점',
    subtitle: 'AI 의존도를 메타인지로',
    bullets: [
      'Anthropic Claude · OpenAI GPT 직접 호출 (키는 브라우저에만)',
      '사용 토큰 + 추정 비용 (₩/USD) 항상 노출',
      '"AI에 의존할수록 학습 효과는 떨어진다" — OECD DEO 2026',
      '세션 누적 + 통산 누적 비용 추적',
    ],
    accent: 'amber',
    emoji: '🪙',
  },
  {
    id: 'record',
    badge: '05 · 채점 후 흐름',
    title: '외부 OCR 채점 ↔ KCBC',
    subtitle: '종이 답안 → 학급 대시보드',
    bullets: [
      '외부 OCR 채점 도구에서 학생 답안지(PDF/사진) 채점',
      '결과 한 건을 KCBC에 붙여넣기 — 5필드 자동 파싱',
      '학급 분포 시각화 (잘함/보통/노력요함 비율 + 평균)',
      '학생부 「교과학습발달상황」 초안 자동 변환',
    ],
    accent: 'rose',
    emoji: '📥',
  },
  {
    id: 'loop',
    badge: '06 · 닫힌 루프',
    title: '평가 설계부터 학생부까지',
    subtitle: '교사가 한 도구 안에서 한 호흡으로',
    bullets: [
      '① 매트릭스 설계 → ② 평가 문항 → ③ OCR 채점',
      '④ 학급 분포 → ⑤ 학생부 초안 → ⑥ NEIS 입력',
      '학습자 다양성 토글로 특수교육형/다문화형 즉시 변형',
      '모든 데이터 브라우저 로컬 (kcbc:* localStorage), 백업 JSON 지원',
    ],
    accent: 'green',
    emoji: '🔁',
  },
]

const AUTOPLAY_MS = 6500

export default function CardNews() {
  const [idx, setIdx] = useState(0)
  const [auto, setAuto] = useState(false)

  useEffect(() => {
    if (!auto) return
    const t = setInterval(() => setIdx((i) => (i + 1) % CARDS.length), AUTOPLAY_MS)
    return () => clearInterval(t)
  }, [auto])

  const card = CARDS[idx]
  const prev = () => setIdx((i) => (i - 1 + CARDS.length) % CARDS.length)
  const next = () => setIdx((i) => (i + 1) % CARDS.length)

  return (
    <section className="cardnews" aria-label="KCBC 전체 설명 카드뉴스">
      <div className="cardnews__head">
        <h2 className="cardnews__title">
          📰 KCBC 한눈에 — 6장 카드뉴스
        </h2>
        <div className="cardnews__nav">
          <button
            className={auto ? 'cardnews__autobtn is-on' : 'cardnews__autobtn'}
            onClick={() => setAuto((a) => !a)}
            title={auto ? '자동 재생 끄기' : '6.5초마다 자동 넘김'}
          >
            {auto ? '⏸ 자동' : '▶ 자동'}
          </button>
        </div>
      </div>

      <article className={`cardnews__card cardnews__card--${card.accent}`}>
        <div className="cardnews__badge">{card.badge}</div>
        <div className="cardnews__emoji">{card.emoji}</div>
        <h3 className="cardnews__h">{card.title}</h3>
        <p className="cardnews__sub">{card.subtitle}</p>
        <ul className="cardnews__bullets">
          {card.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>

        <button
          className="cardnews__arrow cardnews__arrow--left"
          onClick={prev}
          aria-label="이전 카드"
        >
          ‹
        </button>
        <button
          className="cardnews__arrow cardnews__arrow--right"
          onClick={next}
          aria-label="다음 카드"
        >
          ›
        </button>
      </article>

      <div className="cardnews__dots" role="tablist">
        {CARDS.map((c, i) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={i === idx}
            className={i === idx ? 'cardnews__dot is-on' : 'cardnews__dot'}
            onClick={() => setIdx(i)}
            title={c.title}
          />
        ))}
      </div>
    </section>
  )
}

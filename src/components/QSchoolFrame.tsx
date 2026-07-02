/**
 * 「질문하는 학교」 최상위 프레임 카드 (Dashboard 최상단).
 * 이화여대 산학협력단 + 교육부 정책 프레임을 KCBC 활동의 상위 목표로 명시.
 */
import { QSCHOOL_DOMAINS, QLEARNING_MODELS } from '../domain'

export default function QSchoolFrame() {
  return (
    <section className="qschool">
      <header className="qschool__head">
        <div>
          <h2 className="qschool__title">
            🏛 「질문하는 학교」 — KCBC의 상위 목표
          </h2>
          <p className="qschool__credit">
            이화여자대학교 산학협력단 · 교육부 (2024–2025)
          </p>
        </div>
        <a
          className="qschool__link"
          href="https://www.moe.go.kr"
          target="_blank"
          rel="noreferrer"
        >
          정책 자료 보기 ↗
        </a>
      </header>

      <div className="qschool__layer">
        <div className="qschool__layer-label">4영역</div>
        <ul className="qschool__pillars">
          {QSCHOOL_DOMAINS.map((d) => (
            <li
              key={d.key}
              className={
                d.key === 'learn' || d.key === 'by'
                  ? 'qschool__pillar qschool__pillar--active'
                  : 'qschool__pillar'
              }
            >
              <strong>{d.ko}</strong>
              <span>{d.desc}</span>
              {(d.key === 'learn' || d.key === 'by') && (
                <em className="qschool__mark">★ KCBC 활용</em>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="qschool__layer">
        <div className="qschool__layer-label">
          학생 질문 능력 계발 모델 4유형 <small>(질문 배우기 영역)</small>
        </div>
        <ul className="qschool__models">
          {QLEARNING_MODELS.map((m) => (
            <li key={m.key} className={`qschool__model qschool__model--${m.key}`}>
              <div className="qschool__model-head">
                <strong>{m.ko}</strong>
                <span className="qschool__model-short">{m.short}</span>
              </div>
              <p>{m.desc}</p>
              <em>{m.focus}</em>
            </li>
          ))}
        </ul>
      </div>

      <div className="qschool__foot">
        🧭 <strong>단계형 작성기</strong> 탭에서 위 4유형 중 하나를 골라 모델 기반
        평가문항을 설계합니다. KCBC 매트릭스(5국면)는 모델의 국면 구조와 정렬되어 있습니다.
      </div>
    </section>
  )
}

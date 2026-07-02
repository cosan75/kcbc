import { useState } from 'react'

interface Props {
  values: string[]
  onChange: (next: string[]) => void
  placeholder?: string
}

/** 콤마/엔터로 토큰 단위 입력하는 칩 입력기 */
export default function TagInput({ values, onChange, placeholder }: Props) {
  const [draft, setDraft] = useState('')

  const commit = () => {
    const t = draft.trim()
    if (!t) return
    if (values.includes(t)) {
      setDraft('')
      return
    }
    onChange([...values, t])
    setDraft('')
  }

  return (
    <div className="taginput">
      {values.map((v, i) => (
        <span key={i} className="taginput__chip">
          {v}
          <button
            type="button"
            className="taginput__x"
            onClick={() => onChange(values.filter((_, j) => j !== i))}
            aria-label="제거"
          >
            ×
          </button>
        </span>
      ))}
      <input
        className="taginput__field"
        placeholder={placeholder || '엔터로 추가'}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            commit()
          } else if (e.key === 'Backspace' && !draft && values.length) {
            onChange(values.slice(0, -1))
          }
        }}
        onBlur={commit}
      />
    </div>
  )
}

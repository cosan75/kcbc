import { useEffect, useMemo, useState } from 'react'
import type { ChecklistStore, ChecklistState } from '../lib/checklistStore'

interface Props {
  items: string[]
  store: ChecklistStore
}

function hashId(s: string): string {
  // 짧고 안정적인 id (저장키)
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return `c_${(h >>> 0).toString(36)}`
}

export default function Checklist({ items, store }: Props) {
  const ids = useMemo(() => items.map(hashId), [items])
  const [state, setState] = useState<ChecklistState>({})
  const [loaded, setLoaded] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // 초기 로드
  useEffect(() => {
    let active = true
    store
      .load()
      .then((s) => {
        if (active) {
          setState(s)
          setLoaded(true)
        }
      })
      .catch((e) => {
        if (active) {
          setErr(String(e))
          setLoaded(true)
        }
      })
    return () => {
      active = false
    }
  }, [store])

  // 변경 시 저장 (디바운스)
  // 저장은 항상 localStorage 에 일단 들어가므로 throw 안 됨.
  // store.mode 가 'local-fallback' 으로 바뀌면 그 사실만 노출.
  useEffect(() => {
    if (!loaded) return
    const t = setTimeout(() => {
      setSyncing(true)
      store
        .save(state)
        .catch(() => {
          // ResilientSheetsStore 는 더이상 throw 하지 않지만, 만약을 대비
        })
        .finally(() => {
          setSyncing(false)
          if (store.mode === 'local-fallback' && store.fallbackReason) {
            setErr(store.fallbackReason)
          } else if (err) {
            setErr(null)
          }
        })
    }, 400)
    return () => clearTimeout(t)
  }, [state, loaded, store])

  const total = items.length
  const done = ids.filter((id) => state[id]).length
  const pct = total ? Math.round((done / total) * 100) : 0

  const toggle = (id: string) =>
    setState((prev) => ({ ...prev, [id]: !prev[id] }))

  return (
    <section className="kc">
      <div className="section-head">
        <h2>⑤ KCBC 설계 자체 점검 체크리스트</h2>
        <span className="hint">
          CLAUDE.md §7 ·{' '}
          {store.mode === 'sheets'
            ? 'Google Sheets'
            : store.mode === 'local-fallback'
            ? 'localStorage (Sheets 미연결 폴백)'
            : 'localStorage'}
          {syncing && ' · 저장 중…'}
        </span>
      </div>

      <div className="progress">
        <strong>
          {done} / {total}
        </strong>
        <div className="bar">
          <div style={{ width: `${pct}%` }} />
        </div>
        <span>{pct}%</span>
      </div>

      <div className="check">
        {items.map((text, i) => {
          const id = ids[i]
          const checked = !!state[id]
          return (
            <label key={id} className={checked ? 'done' : ''}>
              <input type="checkbox" checked={checked} onChange={() => toggle(id)} />
              <span>{text}</span>
            </label>
          )
        })}
      </div>

      {err && (
        <div
          style={{
            marginTop: 12,
            color: 'var(--amber)',
            fontSize: 12,
            background: '#fffbe6',
            border: '1px solid #ffe082',
            borderRadius: 8,
            padding: '8px 12px',
            lineHeight: 1.5,
          }}
        >
          ℹ️ <strong>Sheets 동기화는 비활성</strong> ({err}) — 체크 상태는 이
          브라우저의 localStorage 에 안전하게 저장됩니다. Sheets 를 쓰려면{' '}
          <code>apps-script/Code.gs</code> 의 SPREADSHEET_ID 를 채우고 재배포하세요.
        </div>
      )}
    </section>
  )
}

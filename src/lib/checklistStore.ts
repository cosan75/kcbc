/**
 * 체크리스트 상태 저장소 추상화 (탄력적 폴백 모드)
 *
 * 우선순위:
 *   1) VITE_SHEETS_WEBAPP_URL 가 설정되어 있으면 Google Sheets 시도
 *      → 실패 시 자동 localStorage 폴백 (사용자에게는 mode='local-fallback')
 *   2) 그렇지 않으면 즉시 localStorage
 *
 * Sheets 연동은 apps-script/Code.gs 를 Apps Script 에 배포한 뒤
 * 웹앱 URL 을 .env.local 에 VITE_SHEETS_WEBAPP_URL 로 넣으면 자동 활성화됩니다.
 */

export type ChecklistState = Record<string, boolean>
export type ChecklistMode = 'sheets' | 'local' | 'local-fallback'

export interface ChecklistStore {
  load(): Promise<ChecklistState>
  save(state: ChecklistState): Promise<void>
  /** 현재 모드 (반응형으로 바뀔 수 있음) */
  readonly mode: ChecklistMode
  /** Sheets 실패 시 ‘왜’를 알려주는 짧은 메시지 (없으면 null) */
  readonly fallbackReason: string | null
}

const LS_KEY = 'kcbc:checklist'

function loadLocal(): ChecklistState {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveLocal(state: ChecklistState): void {
  localStorage.setItem(LS_KEY, JSON.stringify(state))
}

class LocalStorageStore implements ChecklistStore {
  mode: ChecklistMode = 'local'
  fallbackReason = null
  async load(): Promise<ChecklistState> { return loadLocal() }
  async save(state: ChecklistState): Promise<void> { saveLocal(state) }
}

/**
 * Sheets + LocalStorage 이중 저장 (탄력적).
 * Sheets 가 실패해도 LocalStorage 에는 항상 저장되므로 작업이 끊기지 않음.
 * 한 번이라도 Sheets 가 실패하면 mode 가 'local-fallback' 으로 전환되어
 * 이후 호출은 LocalStorage 만 사용 (반복 요청 방지).
 */
class ResilientSheetsStore implements ChecklistStore {
  mode: ChecklistMode = 'sheets'
  fallbackReason: string | null = null

  constructor(
    private webappUrl: string,
    private userId: string,
  ) {}

  async load(): Promise<ChecklistState> {
    if (this.mode !== 'sheets') return loadLocal()
    try {
      const url = `${this.webappUrl}?action=load&userId=${encodeURIComponent(this.userId)}`
      const res = await fetch(url, { method: 'GET' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as { ok: boolean; state?: ChecklistState }
      return json.state ?? loadLocal()
    } catch (e) {
      this.degradeToLocal(e)
      return loadLocal()
    }
  }

  async save(state: ChecklistState): Promise<void> {
    // LocalStorage 에는 무조건 저장 (안전망)
    saveLocal(state)
    if (this.mode !== 'sheets') return
    try {
      await fetch(this.webappUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'save', userId: this.userId, state }),
      })
    } catch (e) {
      this.degradeToLocal(e)
      // throw 하지 않음 — localStorage 저장은 이미 성공
    }
  }

  private degradeToLocal(e: unknown): void {
    this.mode = 'local-fallback'
    const msg = e instanceof Error ? e.message : String(e)
    this.fallbackReason = friendlyReason(msg)
    console.warn('[KCBC] Sheets 연결 실패 → localStorage 폴백:', msg)
  }
}

function friendlyReason(raw: string): string {
  if (/Failed to fetch|NetworkError/i.test(raw)) {
    return 'Sheets 연결 안 됨 (네트워크 / CORS / Apps Script 미배포)'
  }
  if (/HTTP 4\d\d/.test(raw)) return 'Sheets 응답 오류 (배포·권한 확인 필요)'
  if (/HTTP 5\d\d/.test(raw)) return 'Sheets 서버 일시 오류'
  return raw.slice(0, 80)
}

export function createChecklistStore(): ChecklistStore {
  const url = import.meta.env.VITE_SHEETS_WEBAPP_URL
  const userId = import.meta.env.VITE_SHEETS_USER_ID || 'default'
  if (url && url.length > 0) {
    return new ResilientSheetsStore(url, userId)
  }
  return new LocalStorageStore()
}

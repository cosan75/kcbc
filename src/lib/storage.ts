// localStorage 기반 도메인 객체 저장소 (제네릭)

export interface Repo<T extends { id: string; updatedAt: number }> {
  list(): T[]
  get(id: string): T | undefined
  save(item: T): void
  remove(id: string): void
  clear(): void
}

export function createRepo<T extends { id: string; updatedAt: number }>(
  key: string,
): Repo<T> {
  const read = (): T[] => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return []
      const parsed = JSON.parse(raw) as T[]
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  const write = (arr: T[]) => {
    localStorage.setItem(key, JSON.stringify(arr))
  }
  return {
    list() {
      return read().sort((a, b) => b.updatedAt - a.updatedAt)
    },
    get(id) {
      return read().find((x) => x.id === id)
    },
    save(item) {
      const all = read()
      const idx = all.findIndex((x) => x.id === item.id)
      if (idx >= 0) all[idx] = item
      else all.unshift(item)
      write(all)
    },
    remove(id) {
      write(read().filter((x) => x.id !== id))
    },
    clear() {
      localStorage.removeItem(key)
    },
  }
}

export function uid(prefix = ''): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return prefix + crypto.randomUUID().slice(0, 8)
    } catch {
      // fall through
    }
  }
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

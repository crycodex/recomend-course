import { useCallback, useState } from 'react'

// F010 — Historial de las últimas 3 búsquedas (localStorage)
const KEY = 'vozcursos:history'

export interface HistoryItem {
  query: string
  courseIds: string[]
  at: number
}

function read(): HistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export function useHistory() {
  const [items, setItems] = useState<HistoryItem[]>(read)

  const add = useCallback((item: HistoryItem) => {
    setItems((prev) => {
      const next = [item, ...prev.filter((p) => p.query !== item.query)].slice(0, 3)
      try {
        localStorage.setItem(KEY, JSON.stringify(next))
      } catch {
        /* sin almacenamiento */
      }
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setItems([])
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* sin almacenamiento */
    }
  }, [])

  return { items, add, clear }
}

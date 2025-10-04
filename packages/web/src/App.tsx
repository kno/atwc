
import React, { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { SearchBar } from './components/SearchBar'
import { Filters } from './components/Filters'
import { Results } from './components/Results'

type Item = {
  chat_id: string
  message_id: string
  date: string
  from_user_id: string | null
  score: number
  text_plain: string
  media_caption: string
  media_type: string
  has_links: boolean
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

export default function App() {
  const [q, setQ] = useState('')
  const [filters, setFilters] = useState<{chatId?: string; fromUserId?: string; dateFrom?: string; dateTo?: string; has?: string; mediaType?: string}>({})
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const params = useMemo(() => {
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    Object.entries(filters).forEach(([k,v]) => { if (v) p.set(k, String(v)) })
    p.set('limit','100')
    return p.toString()
  }, [q, filters])

  const search = async () => {
    if (!q.trim()) return
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API_BASE}/search?${params}`)
      const json = await res.json()
      setItems(json.items || [])
    } catch (e: any) {
      setError(e?.message || 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Búsqueda automática al cambiar parámetros con un pequeño debounce
    const t = setTimeout(() => { if (q.trim()) search() }, 300)
    return () => clearTimeout(t)
  }, [params])

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">Telegram — Search-first Client</h1>
      <div className="grid gap-3">
        <SearchBar value={q} onChange={setQ} onSearch={search} loading={loading} />
        <Filters value={filters} onChange={setFilters} />
        {error && <div className="text-sm text-red-600">{error}</div>}
        <Results items={items} query={q} />
        {!items.length && q && !loading && <p className="text-gray-500">Sin resultados</p>}
      </div>
      <footer className="mt-6 text-xs text-gray-500">Conectado a API: {API_BASE}</footer>
    </div>
  )
}

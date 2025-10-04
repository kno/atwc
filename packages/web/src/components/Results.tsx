
import React from 'react'

export function Results({ items, query }:{ items:any[]; query:string }) {
  const highlight = (text:string) => {
    if (!text) return null
    if (!query) return <span>{text}</span>
    try {
      const terms = query.replace(/".*?"/g,'').split(/\s+/).filter(Boolean).map(t=>t.replace(/[^\p{L}\p{N}@#:_-]/gu,''))
      if (!terms.length) return <span>{text}</span>
      const pattern = new RegExp('('+terms.map(t=>t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')+')','ig')
      const parts = text.split(pattern)
      return <span>{parts.map((p,i)=> i%2===1 ? <mark key={i} className="bg-yellow-200">{p}</mark> : p )}</span>
    } catch {
      return <span>{text}</span>
    }
  }

  return (
    <div className="bg-white rounded-xl border p-3">
      <div className="text-sm text-gray-500 mb-2">{items.length} resultados</div>
      <ul className="divide-y">
        {items.map((it,idx)=> (
          <li key={idx} className="py-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div>chat:{it.chat_id} • msg:{it.message_id} • {new Date(it.date).toLocaleString()}</div>
              <div>{it.media_type}{it.has_links? ' • link':''}</div>
            </div>
            <div className="mt-1 text-sm leading-relaxed">
              {highlight(it.text_plain || it.media_caption || '')}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

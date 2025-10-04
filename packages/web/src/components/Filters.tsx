
import React, { useState } from 'react'

type Filters = { chatId?: string; fromUserId?: string; dateFrom?: string; dateTo?: string; has?: string; mediaType?: string }
export function Filters({ value, onChange }:{ value:Filters; onChange:(v:Filters)=>void }) {
  const [local, setLocal] = useState<Filters>(value || {})
  const set = (k:keyof Filters, v:string) => { const n={...local,[k]:v||undefined}; setLocal(n); onChange(n) }
  return (
    <div className="grid md:grid-cols-6 gap-2">
      <input className="border rounded-lg px-3 py-2" placeholder="chatId" value={local.chatId||''} onChange={e=>set('chatId', e.target.value)} />
      <input className="border rounded-lg px-3 py-2" placeholder="fromUserId" value={local.fromUserId||''} onChange={e=>set('fromUserId', e.target.value)} />
      <input type="date" className="border rounded-lg px-3 py-2" value={local.dateFrom||''} onChange={e=>set('dateFrom', e.target.value? e.target.value+'T00:00:00Z':'' )} />
      <input type="date" className="border rounded-lg px-3 py-2" value={local.dateTo||''} onChange={e=>set('dateTo', e.target.value? e.target.value+'T23:59:59Z':'' )} />
      <select className="border rounded-lg px-3 py-2" value={local.has||''} onChange={e=>set('has', e.target.value)}>
        <option value="">has: —</option>
        <option value="link">has:link</option>
        <option value="media">has:media</option>
      </select>
      <input className="border rounded-lg px-3 py-2" placeholder="mediaType (p.ej. document/pdf)" value={local.mediaType||''} onChange={e=>set('mediaType', e.target.value)} />
    </div>
  )
}

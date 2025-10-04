
import React from 'react'

export function SearchBar({ value, onChange, onSearch, loading }:{ value:string; onChange:(v:string)=>void; onSearch:()=>void; loading:boolean }) {
  return (
    <div className="flex gap-2">
      <input
        className="flex-1 border rounded-xl px-4 py-2 outline-none focus:ring w-full"
        placeholder='Busca: "factura" from:@marta has:link before:2025-10-01'
        value={value}
        onChange={e=>onChange(e.target.value)}
        onKeyDown={e=>{ if(e.key==='Enter') onSearch() }}
      />
      <button onClick={onSearch} disabled={loading || !value.trim()} className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50">
        {loading ? 'Buscando...' : 'Buscar'}
      </button>
    </div>
  )
}

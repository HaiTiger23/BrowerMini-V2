import React, { useMemo, useState } from 'react'
import { Plus, Save } from 'lucide-react'

// items: [{title, url}]
export default function Quicklinks({ items = [], onNavigate, onChange }) {
  const [editingIndex, setEditingIndex] = useState(-1)
  const [draft, setDraft] = useState({ title: '', url: '' })
  const [menu, setMenu] = useState({ open:false, x:0, y:0, index:-1 })

  const list = useMemo(() => Array.isArray(items) ? items : [], [items])

  const startAdd = () => { setEditingIndex(list.length); setDraft({ title: '', url: '' }) }
  const startEdit = (i) => { setEditingIndex(i); setDraft(list[i]) }
  const cancel = () => { setEditingIndex(-1); setDraft({ title: '', url: '' }) }
  const save = () => {
    const t = (draft.title || '').trim() || new URL(draft.url).hostname
    const u = normalizeUrl(draft.url)
    if (!u) return
    const next = [...list]
    if (editingIndex >= next.length) next.push({ title: t, url: u })
    else next[editingIndex] = { title: t, url: u }
    onChange?.(next)
    cancel()
  }
  const remove = (i) => { const next = list.filter((_, idx) => idx !== i); onChange?.(next) }
  const openMenu = (e, i) => { e.preventDefault(); setMenu({ open:true, x:e.clientX, y:e.clientY, index:i }) }
  const closeMenu = () => setMenu({ open:false, x:0, y:0, index:-1 })

  return (
    <div className="relative flex items-center gap-1 overflow-x-auto" onClick={() => menu.open && closeMenu()}>
      {list.map((q, i) => (
        <button key={`${q.url}-${i}`} className="tab-chip" onClick={() => onNavigate?.(q.url)} onContextMenu={(e)=>openMenu(e,i)} title={q.url}>
          <span className="truncate">{q.title || q.url}</span>
        </button>
      ))}
      <button className="icon-btn ml-1" onClick={startAdd} title="Thêm Quicklink"><Plus size={16}/></button>

      {editingIndex !== -1 && (
        <div className="flex items-center gap-1 ml-2">
          <input className="input text-xs w-32" placeholder="Tiêu đề" value={draft.title} onChange={e=>setDraft({...draft, title:e.target.value})} />
          <input className="input text-xs w-56" placeholder="URL" value={draft.url} onChange={e=>setDraft({...draft, url:e.target.value})} />
          <button className="icon-btn" onClick={save} title="Lưu"><Save size={16}/></button>
          <button className="icon-btn" onClick={cancel} title="Huỷ">✕</button>
        </div>
      )}

      {menu.open && (
        <div className="fixed z-[1000] glass rounded-md px-2 py-1 text-xs" style={{ left: Math.min(menu.x, window.innerWidth-120), top: Math.min(menu.y, window.innerHeight-60) }} onMouseLeave={closeMenu}>
          <button className="icon-btn justify-start" onClick={()=>{ startEdit(menu.index); closeMenu() }}>Sửa</button>
          <button className="icon-btn justify-start" onClick={()=>{ remove(menu.index); closeMenu() }}>Xoá</button>
        </div>
      )}
    </div>
  )
}

function normalizeUrl(v=''){
  let u = v.trim()
  if (!u) return ''
  if (!/^https?:\/\//i.test(u)) {
    if (u.includes('.') && !u.includes(' ')) u = 'https://' + u
    else u = 'https://www.google.com/search?q=' + encodeURIComponent(u)
  }
  return u
}

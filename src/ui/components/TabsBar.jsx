import React, { useEffect, useRef, useState } from 'react'
import { Plus, X, MoreHorizontal } from 'lucide-react'
import Quicklinks from './Quicklinks'

export default function TabsBar({ tabs, activeId, onSwitch, onClose, onNew, quicklinks = [], onQuicklinkOpen, onQuicklinksChange }) {
  const [openQL, setOpenQL] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const ref = useRef(null)
  const btnQL = useRef(null)
  useEffect(()=>{
    const onDoc = (e)=>{ if (openQL && ref.current && !ref.current.contains(e.target)) setOpenQL(false) }
    document.addEventListener('mousedown', onDoc)
    return ()=> document.removeEventListener('mousedown', onDoc)
  },[openQL])

  const toggleQL = () => {
    if (!openQL) {
      const r = btnQL.current?.getBoundingClientRect()
      if (r) setPos({ x: Math.max(8, r.right - 280), y: r.bottom + 6 })
    }
    setOpenQL(v => !v)
  }

  return (
    <div ref={ref} className="w-full flex items-center gap-1 overflow-x-auto flex-nowrap relative">
      {tabs.map(t => (
        <button key={t.id}
          title={t.title || t.url}
          className={`tab-chip flex items-center gap-1 ${t.id===activeId ? 'ring-1 ring-white/20' : ''}`}
          onClick={() => onSwitch?.(t.id)}
        >
          <span className="truncate">{t.title || (t.url?.replace(/^https?:\/\//,'') || 'New Tab')}</span>
          <span className="icon-btn" onClick={(e)=>{ e.stopPropagation(); onClose?.(t.id) }}>
            <X size={14} />
          </span>
        </button>
      ))}
      <button className="icon-btn ml-1" onClick={() => onNew?.()} title="New Tab (Ctrl+T)">
        <Plus size={16} />
      </button>
      <button ref={btnQL} className="icon-btn" onClick={toggleQL} title="Quicklinks"><MoreHorizontal size={16}/></button>

      {openQL && (
        <div className="fixed bg-black text-white rounded-md px-2 py-2 z-[1000] shadow-lg border border-white/10 max-w-[90vw]" style={{ left: pos.x, top: pos.y }}>
          <Quicklinks
            items={quicklinks}
            onNavigate={(url)=>{ onQuicklinkOpen?.(url); setOpenQL(false) }}
            onChange={(list)=> onQuicklinksChange?.(list)}
          />
        </div>
      )}
    </div>
  )
}

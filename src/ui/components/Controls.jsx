import React, { useEffect, useRef, useState } from 'react'
import { MoreHorizontal, Pin, PinOff, TerminalSquare, X, Droplets } from 'lucide-react'

export default function Controls({ alwaysOnTop, opacity=1, onTogglePin, onDevTools, onHide, onQuit, onSetOpacity, onNewTab, onCloseTab, onReload, onOpenChange }) {
  const [open, setOpen] = useState(false)
  const [val, setVal] = useState(opacity)
  const ref = useRef(null)
  const [showOpacity, setShowOpacity] = useState(false)
  const apply = (v) => { const n = Math.max(0.2, Math.min(1, Number(v)||1)); onSetOpacity?.(n); setVal(n) }

  useEffect(()=>{ onOpenChange && onOpenChange(open) },[open])
  useEffect(()=>{
    const onDoc = (e)=>{ if (open && ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return ()=> document.removeEventListener('mousedown', onDoc)
  },[open])

  return (
    <div ref={ref} className="no-drag flex items-center gap-1">
      <button type="button" className="icon-btn" onClick={()=>setOpen(v=>!v)} title="Menu"><MoreHorizontal size={14}/></button>
      <div className={`glass rounded-md px-1 py-1 flex items-center gap-1 overflow-hidden transition-all duration-150 ${open ? 'max-w-[360px] opacity-100' : 'max-w-0 opacity-0'}`}>
        <button type="button" className="icon-btn" onClick={onTogglePin} title="Always on top">{alwaysOnTop ? <Pin size={14}/> : <PinOff size={14}/>}</button>
        <button type="button" className="icon-btn" onClick={onDevTools} title="DevTools"><TerminalSquare size={14}/></button>
        <button type="button" className="icon-btn" onClick={()=>setShowOpacity(s=>!s)} title={`Opacity ${Math.round((val||opacity)*100)}%`}><Droplets size={14}/></button>
        {showOpacity && (
          <div className="flex items-center gap-1 ml-1">
            <input type="range" min={20} max={100} value={Math.round((val||opacity)*100)} onChange={e=>{ const n = Number(e.target.value)/100; setVal(n); }} onMouseUp={e=>apply(Number(e.target.value)/100)} onTouchEnd={e=>apply(Number(e.target.value)/100)} className="w-24" />
          </div>
        )}
        <button type="button" className="icon-btn" onClick={onQuit} title="Quit"><X size={14}/></button>
      </div>
    </div>
  )
}

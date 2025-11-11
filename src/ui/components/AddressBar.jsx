import React, { useEffect, useRef, useState } from 'react'
import { RefreshCcw, CornerDownLeft } from 'lucide-react'
import Controls from './Controls'

export default function AddressBar({ url, onSubmit, onReload,alwaysOnTop,opacity,api,activeId,setCtrlOpen,headerRef }) {
  const [value, setValue] = useState(url || '')
  const ref = useRef(null)
  useEffect(() => setValue(url || ''), [url])

  const handleSubmit = (e) => {
    e.preventDefault()
    let u = value.trim()
    if (!/^https?:\/\//i.test(u)) {
      if (u.includes('.') && !u.includes(' ')) u = 'https://' + u
      else u = 'https://www.google.com/search?q=' + encodeURIComponent(u)
    }
    onSubmit?.(u)
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1">
      <input className="input text-sm" ref={ref} value={value} onChange={e=>setValue(e.target.value)} placeholder="Nhập URL hoặc tìm kiếm..." />
       <Controls
          alwaysOnTop={alwaysOnTop}
          opacity={opacity}
          onTogglePin={() => api?.toggleAlwaysOnTop()}
          onDevTools={() => api?.devtools()}
          onHide={() => api?.toggleShow()}
          onQuit={() => api?.appQuit?.()}
          onSetOpacity={(v) => api?.setOpacity?.(v)}
          onNewTab={() => api?.newTab()}
          onCloseTab={() => activeId && api?.closeTab(activeId)}
          onReload={() => api?.reload()}
          onOpenChange={(o)=> { setCtrlOpen(!!o); setTimeout(()=>{ if(headerRef.current) api?.setUiTop(headerRef.current.offsetHeight||0) }, 0) }}
        />
    </form>
  )
}

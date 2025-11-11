import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import TabsBar from './components/TabsBar'
import AddressBar from './components/AddressBar'

const api = window.electronAPI

export default function App() {
  const [tabs, setTabs] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [alwaysOnTop, setAlwaysOnTop] = useState(false)
  const [opacity, setOpacity] = useState(1)
  const [quicklinks, setQuicklinks] = useState([])
  const headerRef = useRef(null)
  const [ctrlOpen, setCtrlOpen] = useState(false)

  useEffect(() => {
    api?.onTabs((payload) => {
      setTabs(payload.tabs)
      setActiveId(payload.activeId)
    })
    api?.onWindowFlags((flags) => {
      setAlwaysOnTop(!!flags.alwaysOnTop)
      if (typeof flags.opacity === 'number') setOpacity(flags.opacity)
    })
    api?.onQuicklinks((list) => setQuicklinks(Array.isArray(list) ? list : []))
    api?.ready()
    api?.getQuicklinks?.()
  }, [])

  useEffect(() => {
    if (!headerRef.current || !api?.setUiTop) return
    let timer = null
    const ro = new ResizeObserver(() => {
      const h = headerRef.current.offsetHeight || 0
      if (timer) clearTimeout(timer)
      timer = setTimeout(()=> api.setUiTop(h), 16)
    })
    ro.observe(headerRef.current)
    // initial
    api.setUiTop(headerRef.current.offsetHeight || 0)
    return () => { if (timer) clearTimeout(timer); ro.disconnect() }
  }, [headerRef.current])

  const activeTab = useMemo(() => tabs.find(t => t.id === activeId), [tabs, activeId])

  return (
    <div className="w-screen h-screen">
      <motion.div ref={headerRef} initial={{opacity:0, y:-8}} animate={{opacity:1, y:0}} transition={{duration:0.18}} className="glass drag rounded-t-md">
        <div className="px-1 sm:px-2 pt-0 pb-1">
          <div className="py-[2px] flex items-center gap-1 justify-between">
            <TabsBar tabs={tabs} activeId={activeId}
              onNew={() => api?.newTab()}
              onClose={(id) => api?.closeTab(id)}
              onSwitch={(id) => api?.switchTab(id)}
              quicklinks={quicklinks}
              onQuicklinkOpen={(url)=>{ api?.newTab(); setTimeout(()=>api?.navigate(url), 0) }}
              onQuicklinksChange={(list)=> api?.setQuicklinks?.(list)}
            />
          </div>
          <AddressBar
            url={activeTab?.url || ''}
            onSubmit={(url) => api?.navigate(url)}
            onReload={() => api?.reload()}
            alwaysOnTop={alwaysOnTop}
            opacity={opacity}
            api={api}
            activeId={activeId}
            setCtrlOpen={setCtrlOpen}
            headerRef={headerRef}
          /> 
        </div>
      </motion.div>

      {/* Controls đã chuyển vào header để dropdown tăng chiều cao header và đẩy BrowserView xuống */}
    </div>
  )
}

import { BrowserView, ipcMain, Menu, clipboard } from 'electron'
import { saveSession, loadSession } from './windowState.js'

export class TabManager {
  constructor(win, opts = {}) {
    this.win = win
    this.tabs = []
    this.activeId = null
    this.uiTop = opts.uiTop || 92
    this._resizeTimer = null

    this._wireWinResize()
  }

  setUiTop(px) {
    const val = Math.max(0, Math.round(px || 0))
    if (val === this.uiTop) return
    this.uiTop = val
    try { console.log('[TabManager] setUiTop =', this.uiTop) } catch {}
    // immediate to prevent overlay while menus expand
    this.refreshActiveBounds()
  }

  refreshActiveBounds() {
    const v = this._activeView()
    if (!v) return
    const [cw, ch] = this.win.getContentSize()
    const width = Math.max(1, Math.floor(cw))
    const height = Math.max(1, Math.floor(ch - this.uiTop))
    try { console.log('[TabManager] refreshActiveBounds size=', [width, height+this.uiTop], 'uiTop=', this.uiTop) } catch {}
    v.setBounds({ x: 0, y: this.uiTop, width, height })
  }

  _wireWinResize() {
    const updateBounds = () => this._scheduleRefresh()
    this.win.on('resize', updateBounds)
    this.win.on('move', updateBounds)
    this.win.on('show', updateBounds)
    this.win.on('will-resize', updateBounds)
  }

  _activeView() {
    const t = this.tabs.find(t => t.id === this.activeId)
    return t?.view || null
  }

  _broadcast() {
    const payload = {
      tabs: this.tabs.map(t => ({ id: t.id, title: t.title, url: t.url })),
      activeId: this.activeId,
    }
    if (!this.win.isDestroyed()) this.win.webContents.send('tabs-update', payload)
  }

  // Public: allow main process to resend current state after renderer is ready
  broadcast() {
    this._broadcast()
  }

  _persist() {
    const session = {
      tabs: this.tabs.map(t => ({ url: t.url, title: t.title })),
      activeIndex: Math.max(0, this.tabs.findIndex(t => t.id === this.activeId)),
    }
    saveSession(session)
  }

  restore(defaultUrl = 'https://www.google.com/') {
    const sess = loadSession()
    if (sess?.tabs?.length) {
      sess.tabs.forEach((t, i) => this.newTab(t.url || defaultUrl, i === sess.activeIndex))
    } else {
      this.newTab(defaultUrl, true)
    }
  }

  newTab(url = 'https://www.google.com/', activate = true) {
    const view = new BrowserView({ webPreferences: { nodeIntegration: false, contextIsolation: true } })
    const id = Date.now() + Math.random().toString(16).slice(2)

    // Size and attach
    const [cw, ch] = this.win.getContentSize()
    const width = Math.max(1, Math.floor(cw))
    const height = Math.max(1, Math.floor(ch - this.uiTop))
    view.setBounds({ x: 0, y: this.uiTop, width, height })

    const tab = { id, view, url, title: 'Loading…' }
    this.tabs.push(tab)

    // Events
    view.webContents.on('page-title-updated', (_e, t) => { tab.title = t; this._broadcast(); this._persist() })
    view.webContents.on('did-navigate', (_e, u) => { tab.url = u; this._broadcast(); this._persist() })
    view.webContents.on('did-finish-load', () => { this._injectEnhancements(view) })
    // Open-in-new-window handling: open as new tab instead of popup window
    view.webContents.setWindowOpenHandler(({ url }) => {
      try { this.newTab(url, true) } catch {}
      return { action: 'deny' }
    })
    // Context menu like Chrome
    view.webContents.on('context-menu', (_e, params) => {
      const template = []
      const wc = view.webContents
      if (params.linkURL) {
        template.push(
          { label: 'Open link in new tab', click: () => this.newTab(params.linkURL, true) },
          { label: 'Copy link address', click: () => clipboard.writeText(params.linkURL) },
          { type: 'separator' },
        )
      }
      template.push(
        { label: 'Back', enabled: wc.canGoBack(), click: () => wc.goBack() },
        { label: 'Forward', enabled: wc.canGoForward(), click: () => wc.goForward() },
        { label: 'Reload', click: () => wc.reload() },
        { type: 'separator' },
        { label: 'Inspect Element', click: () => wc.inspectElement(params.x, params.y) },
      )
      const menu = Menu.buildFromTemplate(template)
      menu.popup({ window: this.win })
    })

    view.webContents.loadURL(url)

    if (activate) this.switchTab(id)
    else this._broadcast()

    this._persist()
    return id
  }

  _scheduleRefresh() {
    if (this._resizeTimer) clearTimeout(this._resizeTimer)
    this._resizeTimer = setTimeout(() => {
      this._resizeTimer = null
      this.refreshActiveBounds()
    }, 16)
  }

  _injectEnhancements(view) {
    const u = view.webContents.getURL()
    
  }

  switchTab(id) {
    const target = this.tabs.find(t => t.id === id)
    if (!target) return

    const current = this._activeView()
    if (current) this.win.removeBrowserView(current)
    this.win.addBrowserView(target.view)
    this.activeId = id

    this.refreshActiveBounds()

    this._broadcast()
    this._persist()
  }

  closeTab(id) {
    const idx = this.tabs.findIndex(t => t.id === id)
    if (idx === -1) return

    const t = this.tabs[idx]
    const wasActive = (t.id === this.activeId)
    try { t.view.webContents.destroy() } catch {}
    try { this.win.removeBrowserView(t.view) } catch {}
    this.tabs.splice(idx, 1)

    if (this.tabs.length === 0) {
      this.newTab()
    } else if (wasActive) {
      const next = this.tabs[Math.max(0, idx - 1)]
      this.switchTab(next.id)
    } else {
      this._broadcast();
    }
    this._persist()
  }

  reloadActive() {
    const v = this._activeView()
    v?.webContents.reload()
  }

  navigateActive(url) {
    const v = this._activeView()
    if (!v) return
    v.webContents.loadURL(url)
  }

  devtoolsActive() {
    const v = this._activeView()
    if (!v) return
    if (v.webContents.isDevToolsOpened()) v.webContents.closeDevTools()
    else v.webContents.openDevTools({ mode: 'detach' })
  }
}

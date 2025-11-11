import { app, BrowserWindow, ipcMain, globalShortcut, Menu, Tray, nativeImage, session } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { TabManager } from './src/core/tabManager.js'
import { loadWindowState, saveWindowState, loadAlwaysOnTop, saveAlwaysOnTop, loadQuicklinks, saveQuicklinks, loadOpacity, saveOpacity } from './src/core/windowState.js'
import { ElectronBlocker } from '@ghostery/adblocker-electron'
import fetch from 'cross-fetch'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let win = null
let tabManager = null
let tray = null

export async function initAdBlocker(mainWindow) {
  try {
    const blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch)

    // 👇 Ghostery không bind được `this.session` khi import ESM → phải gắn tay
    if (typeof session.defaultSession.registerPreloadScript === 'function') {
      blocker.enableBlockingInSession.call({ session: session.defaultSession })
      console.log('✅ Ghostery adblocker enabled via ESM patch (Electron 30+)')
    } else {
      console.warn('⚠️ Electron fallback: using manual blocking')
      session.defaultSession.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, cb) => {
        const { match } = blocker.match(details.url)
        if (match) {
          console.log('❌ Blocked manually:', details.url)
          return cb({ cancel: true })
        }
        cb({})
      })
    }
     // Inject script skip quảng cáo YouTube sau khi trang load
    session.defaultSession.webRequest.onCompleted({ urls: ['*://*.youtube.com/*'] }, (details) => {
      if (mainWindow && mainWindow.getBrowserView()) {
        const view = mainWindow.getBrowserView()
        if (!view || !view.webContents) return
        view.webContents.executeJavaScript(`
          (function skipAds(){
            const skipBtn = document.querySelector('.ytp-ad-skip-button, .ytp-ad-overlay-close-button');
            if (skipBtn) skipBtn.click();
            const video = document.querySelector('video');
            if (video && document.querySelector('.ad-showing')) video.currentTime = video.duration;
            document.querySelectorAll('.ytp-ad-module, .ytp-ad-player-overlay').forEach(el => el.remove());
          })();
          setInterval(skipAds, 1000);
        `).catch(() => {})
      }
    })
    blocker.on('request-blocked', req => console.log('🧱 Blocked:', req.url))
  } catch (err) {
    console.error('🚨 Adblock init error:', err)
  }
}


function bringToFront(win) {
  const wasAOT = win.isAlwaysOnTop()
  // show and raise above
  try { win.setSkipTaskbar(false) } catch {}
  win.show()
  win.moveTop?.()
  // temporary always-on-top to ensure z-order
  if (!wasAOT) win.setAlwaysOnTop(true, 'screen-saver')
  win.focus()
  setTimeout(() => { if (!wasAOT) try { win.setAlwaysOnTop(false) } catch {} }, 500)
}

function fadeIn(win, onDone, targetOpacity = 1) {
  const target = Math.max(0.2, Math.min(1, Number(targetOpacity) || 1))
  win.setOpacity(0)
  bringToFront(win)
  let o = 0
  const id = setInterval(() => {
    o += 0.08
    if (o >= target) { o = target; clearInterval(id); try { onDone && onDone() } catch {} }
    win.setOpacity(o)
  }, 16)
}

function toggleShow() {
  if (!win) return
  if (win.isVisible()) {
    // Save bounds on hide
    saveWindowState(win.getBounds())
    win.hide()
  } else {
    const s = loadWindowState()
    win.setBounds(s)
    const target = loadOpacity()
    fadeIn(win, () => { try { tabManager?.refreshActiveBounds() } catch {} }, target)
  }
}

function createTray() {
  let img
  try {
    const iconPath = process.platform === 'win32'
      ? path.join(__dirname, 'assets', 'icons', 'win', 'icon.ico')
      : path.join(__dirname, 'assets', 'icons', 'png', '256x256.png')
    img = nativeImage.createFromPath(iconPath)
    if (img.isEmpty()) img = nativeImage.createEmpty()
  } catch {
    img = nativeImage.createEmpty()
  }
  tray = new Tray(img)
  tray.setToolTip('BroMin')
  const openFromTray = () => { if (win) { if (!win.isVisible()) toggleShow(); else win.focus() } }
  tray.on('click', openFromTray)
  tray.on('double-click', openFromTray)
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open', click: openFromTray },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ])
  tray.setContextMenu(contextMenu)
}

function registerShortcuts() {
  // Chỉ giữ hotkey hệ thống để ẩn/hiện
  try { globalShortcut.register('Shift+Space', toggleShow) } catch {}
}

function createWindow() {
  const state = loadWindowState({ width: 1000, height: 680, x: undefined, y: undefined })
  const aot = loadAlwaysOnTop()

  win = new BrowserWindow({
    width: state.width, height: state.height, x: state.x, y: state.y,
    show: false,
    frame: false,
    transparent: false,
    backgroundColor: '#0b0e13',
    alwaysOnTop: !!aot,
    useContentSize: true,
    icon: process.platform === 'win32'
      ? path.join(__dirname, 'assets', 'icons', 'win', 'icon.ico')
      : path.join(__dirname, 'assets', 'icons', 'png', '256x256.png'),
    webPreferences: {
      preload: path.join(__dirname, 'src', 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  })
  try { win.setOpacity(loadOpacity()) } catch {}

  // Prevent app-level reload
  win.on('focus', () => {
    // noop
  })

  // Load renderer UI
  const isDev = !app.isPackaged
  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'
    win.loadURL(devUrl)
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'))
  }

  tabManager = new TabManager(win, { uiTop: 92 })
  tabManager.restore('https://www.google.com/')

  // Window events
  win.on('close', () => {
    try { saveWindowState(win.getBounds()) } catch {}
  })
  win.on('minimize', () => { try { saveWindowState(win.getBounds()) } catch {} })

  // IPC wires
  ipcMain.on('renderer-ready', () => {
    // Gửi trạng thái tabs ngay khi renderer sẵn sàng để hiển thị session khởi động
    try { tabManager?.broadcast?.() } catch {}
    // default quicklinks if empty
    let ql = loadQuicklinks()
    if (!Array.isArray(ql) || ql.length === 0) {
      ql = [
        { title: 'YouTube', url: 'https://www.youtube.com/' },
        { title: 'Facebook', url: 'https://www.facebook.com/' },
        { title: 'Zalo', url: 'https://zalo.me/' },
      ]
      saveQuicklinks(ql)
    }
    win.webContents.send('window-flags', { alwaysOnTop: win.isAlwaysOnTop(), opacity: win.getOpacity?.() ?? 1 })
    win.webContents.send('quicklinks', ql)
  })
  ipcMain.on('tab-new', () => tabManager.newTab())
  ipcMain.on('tab-close', (_e, id) => tabManager.closeTab(id))
  ipcMain.on('tab-switch', (_e, id) => tabManager.switchTab(id))
  ipcMain.on('tab-reload', () => tabManager.reloadActive())
  ipcMain.on('tab-navigate', (_e, url) => tabManager.navigateActive(url))
  ipcMain.on('tab-devtools', () => tabManager.devtoolsActive())

  ipcMain.on('win-toggle-show', toggleShow)
  ipcMain.on('win-toggle-aot', () => {
    const flag = !win.isAlwaysOnTop()
    win.setAlwaysOnTop(flag, 'floating')
    saveAlwaysOnTop(flag)
    win.webContents.send('window-flags', { alwaysOnTop: flag, opacity: win.getOpacity?.() ?? 1 })
  })
  ipcMain.on('win-set-opacity', (_e, value) => {
    const v = saveOpacity(value)
    try { win.setOpacity(v) } catch {}
    win.webContents.send('window-flags', { alwaysOnTop: win.isAlwaysOnTop(), opacity: v })
  })
  ipcMain.on('ui-top', (_e, px) => {
    tabManager?.setUiTop(Number(px) || 0)
  })
  ipcMain.on('quicklinks-get', () => {
    win.webContents.send('quicklinks', loadQuicklinks())
  })
  ipcMain.on('quicklinks-set', (_e, list) => {
    try { saveQuicklinks(Array.isArray(list) ? list : []) } catch {}
    win.webContents.send('quicklinks', loadQuicklinks())
  })
  ipcMain.on('app-quit', () => app.quit())
}

app.whenReady().then(async () => {
  createWindow()
  await initAdBlocker(win)
  createTray()
  registerShortcuts()
})

app.on('browser-window-created', (_e, w) => {
  // Intercept reload shortcuts inside window to prevent app reload
  w.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return
    // Ctrl+R
    if (input.control && !input.shift && input.code === 'KeyR') {
      event.preventDefault(); tabManager?.reloadActive(); return
    }
    // Ctrl+W
    if (input.control && !input.shift && input.code === 'KeyW') {
      event.preventDefault(); const id = tabManager?.activeId; if (id) tabManager.closeTab(id); return
    }
    // Ctrl+T
    if (input.control && !input.shift && input.code === 'KeyT') {
      event.preventDefault(); tabManager?.newTab(); return
    }
    // Ctrl+Tab (next tab)
    if (input.control && !input.shift && input.code === 'Tab') {
      event.preventDefault();
      if (!tabManager || tabManager.tabs.length <= 1) return
      const idx = tabManager.tabs.findIndex(t => t.id === tabManager.activeId)
      const next = tabManager.tabs[(idx + 1) % tabManager.tabs.length]
      tabManager.switchTab(next.id)
      return
    }
    // Ctrl+Shift+I
    if (input.control && input.shift && input.code === 'KeyI') {
      event.preventDefault(); tabManager?.devtoolsActive(); return
    }
  })
})

app.on('activate', () => {
  if (!win) createWindow()
})

app.on('window-all-closed', () => {
  // do not quit on Windows to keep tray alive
})

app.on('before-quit', () => {
  try { saveWindowState(win?.getBounds?.() ?? {}) } catch {}
  globalShortcut.unregisterAll()
})

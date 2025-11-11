const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  ready: () => ipcRenderer.send('renderer-ready'),
  onTabs: (cb) => ipcRenderer.on('tabs-update', (_e, payload) => cb(payload)),
  onWindowFlags: (cb) => ipcRenderer.on('window-flags', (_e, flags) => cb(flags)),
  onQuicklinks: (cb) => ipcRenderer.on('quicklinks', (_e, list) => cb(list)),

  newTab: () => ipcRenderer.send('tab-new'),
  closeTab: (id) => ipcRenderer.send('tab-close', id),
  switchTab: (id) => ipcRenderer.send('tab-switch', id),
  reload: () => ipcRenderer.send('tab-reload'),
  navigate: (url) => ipcRenderer.send('tab-navigate', url),
  devtools: () => ipcRenderer.send('tab-devtools'),

  toggleShow: () => ipcRenderer.send('win-toggle-show'),
  toggleAlwaysOnTop: () => ipcRenderer.send('win-toggle-aot'),
  setUiTop: (px) => ipcRenderer.send('ui-top', px),
  getQuicklinks: () => ipcRenderer.send('quicklinks-get'),
  setQuicklinks: (list) => ipcRenderer.send('quicklinks-set', list),
  appQuit: () => ipcRenderer.send('app-quit'),
  setOpacity: (value) => ipcRenderer.send('win-set-opacity', value),
})

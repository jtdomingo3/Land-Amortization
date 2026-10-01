const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  sqlite: {
    query: (sql, params) => ipcRenderer.invoke('sqlite:query', sql, params),
    run: (sql, params) => ipcRenderer.invoke('sqlite:run', sql, params),
    exec: (sql) => ipcRenderer.invoke('sqlite:exec', sql)
  },
  dialog: {
    saveFile: (options, data) => ipcRenderer.invoke('dialog:saveFile', options, data),
    showSaveDialog: (options) => ipcRenderer.invoke('dialog:showSaveDialog', options)
  },
  shell: {
    openPath: (p) => ipcRenderer.invoke('shell:openPath', p),
    openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
    showItemInFolder: (p) => ipcRenderer.invoke('shell:showItemInFolder', p)
  },
  app: {
    getPath: (name) => ipcRenderer.invoke('app:getPath', name)
  },
  print: {
    printHtml: (html, options) => ipcRenderer.invoke('print:html', html, options),
    toPdf: (html, options) => ipcRenderer.invoke('print:toPdf', html, options)
  },
  excel: {
    saveDirect: (fileName, data) => ipcRenderer.invoke('excel:saveDirect', fileName, data),
    getExcelDir: () => ipcRenderer.invoke('excel:getExcelDir')
  },
  dev: {
    toggleDevTools: () => ipcRenderer.invoke('dev:toggleDevTools'),
    reload: () => ipcRenderer.invoke('dev:reload')
  }
});

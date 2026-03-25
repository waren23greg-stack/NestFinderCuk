// preload.js — runs in a privileged context before the renderer
// Keep this minimal: only expose what the renderer actually needs
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Let the renderer know it's running inside Electron
  isElectron: true,

  // Platform info (useful for showing install prompts etc.)
  platform: process.platform,
})
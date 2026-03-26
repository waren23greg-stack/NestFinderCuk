const { app, BrowserWindow, session, shell, protocol } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = process.env.NODE_ENV === 'development'

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'NestFinder CUK',
    icon: path.join(__dirname, '../public/icon.svg'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  // ── Content Security Policy ──────────────────────────────────────────
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          [
            "default-src 'self' file:",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            // Allow local fonts + Google Fonts as fallback
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' file: data: https://fonts.gstatic.com",
            // Allow local images + Unsplash for listing photos
            "img-src 'self' file: data: blob: https://images.unsplash.com https://*.supabase.co https://*.supabase.in",
            // Allow Supabase API calls
            "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co",
            "frame-src 'none'",
          ].join('; '),
        ],
      },
    })
  })

  // ── Open external links in system browser ────────────────────────────
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  win.webContents.on('will-navigate', (event, url) => {
    const isLocal =
      url.startsWith('file://') ||
      url.startsWith('http://localhost') ||
      url.startsWith('http://127.0.0.1')
    if (!isLocal) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })

  // ── Load index.html directly — no Next.js server needed ─────────────
  win.loadFile(path.join(__dirname, '../index.html'))

  if (isDev) win.webContents.openDevTools()
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

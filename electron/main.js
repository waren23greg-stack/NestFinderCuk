const { app, BrowserWindow, session, shell } = require('electron')
const path = require('path')

const isDev = process.env.NODE_ENV === 'development'
const DEV_URL = 'http://localhost:3000'

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
  // Allows: Supabase API, Unsplash images, Google Fonts, M-Pesa/WhatsApp links
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' data: https://fonts.gstatic.com",
            // Allow Unsplash hero/listing images + Supabase storage images
            "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co https://*.supabase.in",
            // Allow Supabase API calls
            "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co",
            // Allow WhatsApp / M-Pesa links to open in browser
            "frame-src 'none'",
          ].join('; '),
        ],
      },
    })
  })

  // ── Open external links in the system browser, not in Electron ───────
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  // Intercept <a> clicks that navigate away (WhatsApp, M-Pesa, etc.)
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

  // ── Load the app ──────────────────────────────────────────────────────
  // Your app is plain HTML — load index.html directly, no Next.js server needed
  win.loadFile(path.join(__dirname, '../index.html'))

  // Remove this line once you are done testing:
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
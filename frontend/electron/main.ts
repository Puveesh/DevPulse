import { app, BrowserWindow, shell, ipcMain, protocol, net, session, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { pathToFileURL } from 'url'
import { setupSystemTray, destroySystemTray } from './tray.js'

// Runtime environment check
const isDev = !app.isPackaged || process.env.NODE_ENV === 'development'

// 1. Single instance lock: prevent accidental duplicate application instances
const gotSingleInstanceLock = app.requestSingleInstanceLock()
if (!gotSingleInstanceLock) {
  app.quit()
}

// 2. Register secure custom standard scheme for production desktop container
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
])

let mainWindow: BrowserWindow | null = null

// Configurable backend API URL
const BACKEND_URL =
  process.env.DEVPULSE_BACKEND_URL ||
  process.env.VITE_BACKEND_URL ||
  'http://localhost:8081'

function resolvePreloadPath(): string {
  const possiblePaths = [
    path.join(__dirname, '../preload/preload.mjs'),
    path.join(__dirname, '../preload/preload.js'),
    path.join(__dirname, '../preload/preload.cjs'),
    path.join(__dirname, '../preload/index.mjs'),
    path.join(__dirname, '../preload/index.js'),
    path.join(__dirname, '../preload/index.cjs'),
  ]
  for (const candidate of possiblePaths) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }
  return path.join(__dirname, '../preload/preload.mjs')
}

function resolveIconPath(): string {
  const candidates = [
    path.join(__dirname, '../../resources/icon.ico'),
    path.join(__dirname, '../../resources/icon.png'),
    path.join(app.getAppPath(), 'resources/icon.ico'),
    path.join(app.getAppPath(), 'resources/icon.png'),
    path.join(process.cwd(), 'resources/icon.ico'),
    path.join(process.cwd(), 'resources/icon.png'),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return c
    }
  }
  return ''
}

function createWindow(): void {
  const iconPath = resolveIconPath()

  mainWindow = new BrowserWindow({
    title: 'DevPulse Desktop Client',
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    ...(iconPath ? { icon: iconPath } : {}),
    webPreferences: {
      preload: resolvePreloadPath(),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  })

  // Prevent white flicker during initial load
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Safe external link handling: intercept new window requests and open in default OS browser
  mainWindow.webContents.setWindowOpenHandler((details) => {
    if (details.url.startsWith('https://') || details.url.startsWith('http://')) {
      shell.openExternal(details.url)
    }
    return { action: 'deny' }
  })

  // Prevent accidental in-app navigation to external websites
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    try {
      const parsed = new URL(navigationUrl)
      if (isDev && process.env['ELECTRON_RENDERER_URL']) {
        const devUrl = new URL(process.env['ELECTRON_RENDERER_URL'])
        if (parsed.origin !== devUrl.origin) {
          event.preventDefault()
          shell.openExternal(navigationUrl)
        }
      } else if (parsed.protocol !== 'app:') {
        event.preventDefault()
        shell.openExternal(navigationUrl)
      }
    } catch {
      event.preventDefault()
    }
  })

  // Gracefully handle renderer process crashes
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('DevPulse renderer process terminated unexpectedly:', details)
    if (details.reason !== 'clean-exit' && mainWindow) {
      dialog
        .showMessageBox(mainWindow, {
          type: 'error',
          title: 'DevPulse Process Warning',
          message: 'The desktop renderer process crashed unexpectedly.',
          detail: `Reason: ${details.reason} (code: ${details.exitCode}). Would you like to reload?`,
          buttons: ['Reload DevPulse', 'Exit Application'],
          defaultId: 0,
        })
        .then(({ response }) => {
          if (response === 0) {
            mainWindow?.reload()
          } else {
            app.quit()
          }
        })
    }
  })

  // Gracefully handle initial loading failures
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.warn(`DevPulse page load notice [${errorCode}]: ${errorDescription} (${validatedURL})`)
    if (errorCode !== -3 /* ERR_ABORTED */ && mainWindow && !mainWindow.isDestroyed()) {
      dialog
        .showMessageBox(mainWindow, {
          type: 'warning',
          title: 'DevPulse Connection Notice',
          message: 'Unable to reach the user interface.',
          detail: `Could not load ${validatedURL}\n${errorDescription} (${errorCode})`,
          buttons: ['Retry', 'Quit'],
          defaultId: 0,
        })
        .then(({ response }) => {
          if (response === 0) {
            if (isDev && process.env['ELECTRON_RENDERER_URL']) {
              mainWindow?.loadURL(process.env['ELECTRON_RENDERER_URL'])
            } else {
              mainWindow?.loadURL('app://devpulse/')
            }
          } else {
            app.quit()
          }
        })
    }
  })

  // Load DevPulse UI: Vite dev server with HMR in development, or custom secure app:// in production
  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadURL('app://devpulse/')
  }

  // Initialize System Tray architecture
  setupSystemTray(mainWindow)
}

// 3. Register IPC handlers with validation
function registerIpcHandlers(): void {
  ipcMain.handle('app:get-version', () => app.getVersion())
  ipcMain.handle('app:get-backend-url', () => BACKEND_URL)

  ipcMain.handle('app:open-external', async (_, url: unknown) => {
    if (typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://'))) {
      await shell.openExternal(url)
      return true
    }
    return false
  })

  ipcMain.on('window:minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.minimize()
  })

  ipcMain.on('window:maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize()
      } else {
        win.maximize()
      }
    }
  })

  ipcMain.on('window:close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.close()
  })

  ipcMain.handle('window:is-maximized', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    return win ? win.isMaximized() : false
  })
}

// 4. Application Lifecycle Setup
if (gotSingleInstanceLock) {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    // Register secure protocol handler for production runtime
    protocol.handle('app', (request) => {
      const url = new URL(request.url)
      let relativePath = decodeURIComponent(url.pathname)
      if (relativePath.startsWith('/')) {
        relativePath = relativePath.slice(1)
      }

      const rendererDir = path.join(__dirname, '../renderer')
      const targetFile = path.join(rendererDir, relativePath)

      // If an existing physical asset is requested, stream the file
      if (fs.existsSync(targetFile) && fs.statSync(targetFile).isFile()) {
        return net.fetch(pathToFileURL(targetFile).href)
      }

      // Single Page Application (SPA) fallback: serve index.html for client routes (e.g. /dashboard, /login)
      const indexFile = path.join(rendererDir, 'index.html')
      if (fs.existsSync(indexFile)) {
        return net.fetch(pathToFileURL(indexFile).href)
      }

      return new Response('Not found', { status: 404 })
    })

    // Setup origin headers for seamless Spring Boot CORS and session cookie compatibility
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
      const origin = details.requestHeaders['Origin']
      if (!origin || origin.startsWith('app://')) {
        details.requestHeaders['Origin'] = 'http://localhost:5173'
      }
      callback({ requestHeaders: details.requestHeaders })
    })

    registerIpcHandlers()
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  })

  app.on('window-all-closed', () => {
    destroySystemTray()
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}

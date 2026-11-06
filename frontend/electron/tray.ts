import { app, BrowserWindow, Menu, Tray, nativeImage, type NativeImage } from 'electron'
import path from 'path'
import fs from 'fs'

let tray: Tray | null = null

/**
 * Initializes and configures the system tray for DevPulse.
 * Prepares the desktop runtime for future background logging and session management.
 */
export function setupSystemTray(mainWindow: BrowserWindow): Tray | null {
  try {
    // Resolve icon path for tray (either packaged in resources or relative in dev)
    const iconCandidates = [
      path.join(__dirname, '../../resources/icon.png'),
      path.join(app.getAppPath(), 'resources/icon.png'),
      path.join(process.cwd(), 'resources/icon.png'),
    ]

    let iconPath = iconCandidates.find((p) => fs.existsSync(p))

    let trayIcon: NativeImage
    if (iconPath) {
      trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
    } else {
      trayIcon = nativeImage.createEmpty()
    }

    tray = new Tray(trayIcon)
    tray.setToolTip('DevPulse - Developer Worklog & Analytics Platform')

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open DevPulse',
        click: () => {
          if (mainWindow.isMinimized()) mainWindow.restore()
          mainWindow.show()
          mainWindow.focus()
        },
      },
      { type: 'separator' },
      {
        label: 'Quit DevPulse',
        click: () => {
          app.quit()
        },
      },
    ])

    tray.setContextMenu(contextMenu)

    tray.on('double-click', () => {
      if (mainWindow.isVisible()) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore()
        }
        mainWindow.focus()
      } else {
        mainWindow.show()
        mainWindow.focus()
      }
    })

    return tray
  } catch (err) {
    console.warn('System tray initialization deferred or unsupported:', err)
    return null
  }
}

export function destroySystemTray(): void {
  if (tray) {
    tray.destroy()
    tray = null
  }
}

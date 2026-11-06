import type { DesktopAPI } from '../../electron/preload'

declare global {
  interface Window {
    electronAPI?: DesktopAPI
  }
}

export {}


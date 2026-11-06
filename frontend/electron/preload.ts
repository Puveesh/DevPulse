import { contextBridge, ipcRenderer } from 'electron'

// Define the exposed desktop API contract
export interface DesktopAPI {
  platform: string
  getAppVersion: () => Promise<string>
  getBackendUrl: () => Promise<string>
  openExternal: (url: string) => Promise<boolean>
  minimizeWindow: () => void
  maximizeWindow: () => void
  closeWindow: () => void
  isMaximized: () => Promise<boolean>
}

const desktopAPI: DesktopAPI = {
  platform: process.platform,
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),
  getBackendUrl: () => ipcRenderer.invoke('app:get-backend-url'),
  openExternal: (url: string) => ipcRenderer.invoke('app:open-external', url),
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:is-maximized')
}

// Expose protected capabilities to the renderer via contextBridge if contextIsolation is active
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronAPI', desktopAPI)
  } catch (error) {
    console.error('Failed to expose electronAPI via contextBridge:', error)
  }
} else {
  // @ts-ignore (fallback if contextIsolation is disabled)
  window.electronAPI = desktopAPI
}

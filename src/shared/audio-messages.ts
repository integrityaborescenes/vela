import { isTabSettings, type TabSettings } from './audio-settings'

export type PopupAudioMessage =
  | { type: 'VELA_START_CAPTURE'; tabId: number; settings: TabSettings }
  | { type: 'VELA_UPDATE_SETTINGS'; tabId: number; settings: TabSettings }

export type OffscreenAudioMessage =
  | { type: 'VELA_OFFSCREEN_START'; tabId: number; streamId: string; settings: TabSettings }
  | { type: 'VELA_OFFSCREEN_UPDATE'; tabId: number; settings: TabSettings }
  | { type: 'VELA_OFFSCREEN_STOP'; tabId: number }

export function isPopupAudioMessage(value: unknown): value is PopupAudioMessage {
  if (!isObject(value) || !isValidTabId(value.tabId) || !isTabSettings(value.settings)) return false
  return value.type === 'VELA_START_CAPTURE' || value.type === 'VELA_UPDATE_SETTINGS'
}

export function isOffscreenAudioMessage(value: unknown): value is OffscreenAudioMessage {
  if (!isObject(value) || !isValidTabId(value.tabId)) return false
  switch (value.type) {
    case 'VELA_OFFSCREEN_START':
      return typeof value.streamId === 'string' && value.streamId.length > 0 && isTabSettings(value.settings)
    case 'VELA_OFFSCREEN_UPDATE':
      return isTabSettings(value.settings)
    case 'VELA_OFFSCREEN_STOP':
      return true
    default:
      return false
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isValidTabId(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0
}

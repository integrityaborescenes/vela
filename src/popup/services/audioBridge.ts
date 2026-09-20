import type { TabSettings } from '../../shared/audio-settings'
import type { PopupAudioMessage } from '../../shared/audio-messages'

type AudioResponse = { ok: boolean }

export async function startTabAudio(tabId: number, settings: TabSettings) {
  await sendAudioMessage({ type: 'VELA_START_CAPTURE', tabId, settings })
}

export async function updateTabAudio(tabId: number, settings: TabSettings) {
  await sendAudioMessage({ type: 'VELA_UPDATE_SETTINGS', tabId, settings })
}

async function sendAudioMessage(message: PopupAudioMessage) {
  const response = await chrome.runtime.sendMessage<PopupAudioMessage, AudioResponse>(message)
  if (!response?.ok) throw new Error('Chrome не смог запустить аудиообработку')
}

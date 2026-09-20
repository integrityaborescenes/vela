import { getTabSettingsKey, type TabSettings } from '../shared/audio-settings'
import { isPopupAudioMessage } from '../shared/audio-messages'

const MUTE_MENU_ID = 'vela-toggle-tab-mute'
const OFFSCREEN_URL = 'src/offscreen/offscreen.html'
let creatingOffscreen: Promise<void> | undefined

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: MUTE_MENU_ID, title: 'Включить/выключить звук этой вкладки', contexts: ['page'] })
  })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MUTE_MENU_ID || tab?.id === undefined) return
  void chrome.tabs.update(tab.id, { muted: !tab.mutedInfo?.muted })
})

chrome.tabs.onRemoved.addListener((tabId) => {
  void chrome.runtime.sendMessage({ type: 'VELA_OFFSCREEN_STOP', tabId }).catch(() => undefined)
  void chrome.storage.local.remove(getTabSettingsKey(tabId))
})

chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || !isPopupSender(sender.url) || !isPopupAudioMessage(message)) return

  if (message.type === 'VELA_START_CAPTURE') {
    void startCapture(message.tabId, message.settings).then(
      () => sendResponse({ ok: true }),
      () => sendResponse({ ok: false }),
    )
    return true
  }

  void chrome.runtime.sendMessage({ type: 'VELA_OFFSCREEN_UPDATE', tabId: message.tabId, settings: message.settings })
    .then(() => sendResponse({ ok: true }), () => sendResponse({ ok: false }))
  return true
})

async function startCapture(tabId: number, settings: TabSettings) {
  const existing = (await getCapturedTabs()).some((capture) => capture.tabId === tabId && capture.status === 'active')
  if (existing) {
    await chrome.runtime.sendMessage({ type: 'VELA_OFFSCREEN_UPDATE', tabId, settings })
    return
  }
  await ensureOffscreenDocument()
  const streamId = await getMediaStreamId(tabId)
  const response = await chrome.runtime.sendMessage({ type: 'VELA_OFFSCREEN_START', tabId, streamId, settings })
  if (!response?.ok) throw new Error('Audio processing could not start')
}

async function ensureOffscreenDocument() {
  const contexts = await chrome.runtime.getContexts({ contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT] })
  if (contexts.some((context) => context.documentUrl === chrome.runtime.getURL(OFFSCREEN_URL))) return
  if (!creatingOffscreen) {
    creatingOffscreen = chrome.offscreen.createDocument({
      url: OFFSCREEN_URL,
      reasons: ['USER_MEDIA'],
      justification: 'Обработка звука вкладки по запросу пользователя.',
    }).finally(() => { creatingOffscreen = undefined })
  }
  await creatingOffscreen
}

function isPopupSender(url?: string) {
  return typeof url === 'string' && url.startsWith(chrome.runtime.getURL('')) && url.endsWith('/index.html')
}

function getCapturedTabs() {
  return new Promise<chrome.tabCapture.CaptureInfo[]>((resolve) => chrome.tabCapture.getCapturedTabs(resolve))
}

function getMediaStreamId(tabId: number) {
  return new Promise<string>((resolve) => chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, resolve))
}

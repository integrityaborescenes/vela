import { getTabSettingsKey, type TabSettings } from '../shared/audio-settings'
import { isPopupAudioMessage } from '../shared/audio-messages'

const MUTE_MENU_ID = 'vela-toggle-tab-mute'
const OFFSCREEN_URL = 'src/offscreen/offscreen.html'
const MUTED_TABS_KEY = 'vela:muted-tabs'
let creatingOffscreen: Promise<void> | undefined

chrome.runtime.onInstalled.addListener(() => {
  void createMuteMenu()
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MUTE_MENU_ID || tab?.id === undefined) return
  void toggleTabMute(tab.id)
})

chrome.tabs.onRemoved.addListener((tabId) => {
  void chrome.runtime.sendMessage({ type: 'VELA_OFFSCREEN_STOP', tabId }).catch(() => undefined)
  void chrome.storage.local.remove(getTabSettingsKey(tabId))
  void removeMutedTab(tabId)
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
    await chrome.runtime.sendMessage({ type: 'VELA_OFFSCREEN_SET_MUTED', tabId, muted: await getMutedTab(tabId) })
    return
  }
  await ensureOffscreenDocument()
  const streamId = await getMediaStreamId(tabId)
  const muted = await getMutedTab(tabId)
  const response = await chrome.runtime.sendMessage({ type: 'VELA_OFFSCREEN_START', tabId, streamId, settings, muted })
  if (!response?.ok) throw new Error('Audio processing could not start')
}

async function createMuteMenu() {
  await chrome.contextMenus.removeAll()
  chrome.contextMenus.create({ id: MUTE_MENU_ID, title: 'Включить/выключить звук этой вкладки', contexts: ['page'] })
}

async function toggleTabMute(tabId: number) {
  const tab = await chrome.tabs.get(tabId)
  const muted = tab.mutedInfo?.reason === 'capture'
    ? !(await getMutedTab(tabId))
    : !tab.mutedInfo?.muted

  await Promise.all([
    chrome.tabs.update(tabId, { muted }),
    setMutedTab(tabId, muted),
    chrome.runtime.sendMessage({ type: 'VELA_OFFSCREEN_SET_MUTED', tabId, muted }).catch(() => undefined),
  ])
}

async function getMutedTab(tabId: number) {
  const result = await chrome.storage.session.get(MUTED_TABS_KEY)
  const mutedTabs = result[MUTED_TABS_KEY]
  return typeof mutedTabs === 'object' && mutedTabs !== null && (mutedTabs as Record<string, unknown>)[String(tabId)] === true
}

async function setMutedTab(tabId: number, muted: boolean) {
  const result = await chrome.storage.session.get(MUTED_TABS_KEY)
  const mutedTabs = typeof result[MUTED_TABS_KEY] === 'object' && result[MUTED_TABS_KEY] !== null
    ? { ...(result[MUTED_TABS_KEY] as Record<string, boolean>) }
    : {}
  await chrome.storage.session.set({ [MUTED_TABS_KEY]: { ...mutedTabs, [String(tabId)]: muted } })
}

async function removeMutedTab(tabId: number) {
  const result = await chrome.storage.session.get(MUTED_TABS_KEY)
  const mutedTabs = result[MUTED_TABS_KEY]
  if (typeof mutedTabs !== 'object' || mutedTabs === null) return
  const nextMutedTabs = { ...(mutedTabs as Record<string, boolean>) }
  delete nextMutedTabs[String(tabId)]
  await chrome.storage.session.set({ [MUTED_TABS_KEY]: nextMutedTabs })
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

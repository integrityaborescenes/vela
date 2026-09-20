import {
  DEFAULT_SETTINGS,
  getTabSettingsKey,
  isSavedPreset,
  isTabSettings,
  PRESETS_STORAGE_KEY,
  type SavedPreset,
  type TabSettings,
} from '../../shared/audio-settings'

export async function getTabSettings(tabId: number): Promise<TabSettings> {
  const key = getTabSettingsKey(tabId)
  const stored = await chrome.storage.local.get(key)
  const settings: unknown = stored[key]
  return isTabSettings(settings) ? settings : DEFAULT_SETTINGS
}

export async function saveTabSettings(tabId: number, settings: TabSettings) {
  await chrome.storage.local.set({ [getTabSettingsKey(tabId)]: settings })
}

export async function getPresets(): Promise<SavedPreset[]> {
  const stored = await chrome.storage.local.get(PRESETS_STORAGE_KEY)
  const presets: unknown = stored[PRESETS_STORAGE_KEY]
  return Array.isArray(presets) ? presets.filter(isSavedPreset) : []
}

export async function savePresets(presets: SavedPreset[]) {
  await chrome.storage.local.set({ [PRESETS_STORAGE_KEY]: presets })
}

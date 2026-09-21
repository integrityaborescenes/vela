import {
  DEFAULT_SETTINGS,
  DEFAULT_PRESETS,
  DEFAULT_PRESETS_VERSION,
  DEFAULT_PRESETS_VERSION_STORAGE_KEY,
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
  const stored = await chrome.storage.local.get([
    PRESETS_STORAGE_KEY,
    DEFAULT_PRESETS_VERSION_STORAGE_KEY,
  ])
  const presets: unknown = stored[PRESETS_STORAGE_KEY]
  const savedPresets = Array.isArray(presets) ? presets.filter(isSavedPreset) : []
  const defaultsVersion = stored[DEFAULT_PRESETS_VERSION_STORAGE_KEY]

  if (defaultsVersion === DEFAULT_PRESETS_VERSION) return savedPresets

  const savedNames = new Set(savedPresets.map((preset) => preset.name.trim().toLocaleLowerCase()))
  const missingDefaults = DEFAULT_PRESETS.filter(
    (preset) => !savedNames.has(preset.name.toLocaleLowerCase()),
  )
  const mergedPresets = [...structuredClone(missingDefaults), ...savedPresets]

  await chrome.storage.local.set({
    [PRESETS_STORAGE_KEY]: mergedPresets,
    [DEFAULT_PRESETS_VERSION_STORAGE_KEY]: DEFAULT_PRESETS_VERSION,
  })

  return mergedPresets
}

export async function savePresets(presets: SavedPreset[]) {
  await chrome.storage.local.set({ [PRESETS_STORAGE_KEY]: presets })
}

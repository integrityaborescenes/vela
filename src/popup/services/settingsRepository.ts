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

  const migratedPresets = savedPresets.map((preset) => (
    isDefaultPreset(preset) ? { ...preset, isBuiltIn: true } : preset
  ))
  const savedNames = new Set(migratedPresets.map((preset) => preset.name.trim().toLocaleLowerCase()))
  const missingDefaults = DEFAULT_PRESETS.filter(
    (preset) => !savedNames.has(preset.name.toLocaleLowerCase()),
  )
  const mergedPresets = [...structuredClone(missingDefaults), ...migratedPresets]

  await chrome.storage.local.set({
    [PRESETS_STORAGE_KEY]: mergedPresets,
    [DEFAULT_PRESETS_VERSION_STORAGE_KEY]: DEFAULT_PRESETS_VERSION,
  })

  return mergedPresets
}

export async function savePresets(presets: SavedPreset[]) {
  await chrome.storage.local.set({ [PRESETS_STORAGE_KEY]: presets })
}

function isDefaultPreset(preset: SavedPreset) {
  const defaultPreset = DEFAULT_PRESETS.find(
    (item) => item.name.toLocaleLowerCase() === preset.name.toLocaleLowerCase(),
  )
  if (!defaultPreset) return false

  return defaultPreset.settings.volume === preset.settings.volume
    && defaultPreset.settings.enabled === preset.settings.enabled
    && defaultPreset.settings.gains.every((gain, index) => gain === preset.settings.gains[index])
}

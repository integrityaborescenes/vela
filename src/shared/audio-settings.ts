export const FREQUENCIES = ['31', '63', '125', '250', '500', '1k', '2k', '4k', '8k', '16k'] as const
export const TAB_SETTINGS_PREFIX = 'vela:tab:'
export const PRESETS_STORAGE_KEY = 'vela:presets'

export type TabSettings = {
  gains: number[]
  volume: number
  enabled: boolean
}

export type SavedPreset = {
  name: string
  settings: TabSettings
}

export const DEFAULT_SETTINGS: TabSettings = {
  gains: FREQUENCIES.map(() => 0),
  volume: 100,
  enabled: true,
}

export function getTabSettingsKey(tabId: number) {
  return `${TAB_SETTINGS_PREFIX}${tabId}`
}

export function isTabSettings(value: unknown): value is TabSettings {
  if (!value || typeof value !== 'object') return false
  const settings = value as Partial<TabSettings>
  return Array.isArray(settings.gains)
    && settings.gains.length === FREQUENCIES.length
    && settings.gains.every((gain) => typeof gain === 'number' && Number.isFinite(gain) && gain >= -12 && gain <= 12)
    && typeof settings.volume === 'number' && Number.isFinite(settings.volume) && settings.volume >= 0 && settings.volume <= 200
    && typeof settings.enabled === 'boolean'
}

export function isSavedPreset(value: unknown): value is SavedPreset {
  if (!value || typeof value !== 'object') return false
  const preset = value as Partial<SavedPreset>
  return typeof preset.name === 'string'
    && preset.name.trim().length > 0
    && preset.name.length <= 40
    && isTabSettings(preset.settings)
}

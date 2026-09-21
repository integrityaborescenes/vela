export const FREQUENCIES = ['31', '63', '125', '250', '500', '1k', '2k', '4k', '8k', '16k'] as const
export const TAB_SETTINGS_PREFIX = 'vela:tab:'
export const PRESETS_STORAGE_KEY = 'vela:presets'
export const DEFAULT_PRESETS_VERSION_STORAGE_KEY = 'vela:default-presets-version'
export const DEFAULT_PRESETS_VERSION = 3
export const NEUTRAL_PRESET_NAME = 'Нейтральный'

export type TabSettings = {
  gains: number[]
  volume: number
  enabled: boolean
  selectedPresetName?: string
}

export type SavedPreset = {
  name: string
  settings: TabSettings
  isBuiltIn?: boolean
}

export const DEFAULT_SETTINGS: TabSettings = {
  gains: FREQUENCIES.map(() => 0),
  volume: 100,
  enabled: true,
  selectedPresetName: NEUTRAL_PRESET_NAME,
}

export const DEFAULT_PRESETS: SavedPreset[] = [
  {
    name: NEUTRAL_PRESET_NAME,
    isBuiltIn: true,
    settings: {
      ...DEFAULT_SETTINGS,
      gains: [...DEFAULT_SETTINGS.gains],
    },
  },
  {
    name: 'Бас',
    isBuiltIn: true,
    settings: {
      gains: [6, 5, 3, 1, 0, 0, -1, -1, -1, -1],
      volume: 100,
      enabled: true,
    },
  },
  {
    name: 'Вокал',
    isBuiltIn: true,
    settings: {
      gains: [-2, -1, 0, 2, 4, 5, 4, 2, 0, -1],
      volume: 100,
      enabled: true,
    },
  },
  {
    name: 'Рок',
    isBuiltIn: true,
    settings: {
      gains: [5, 3, -3, -5, -2, 2, 5, 7, 7, 7],
      volume: 100,
      enabled: true,
    },
  },
  {
    name: 'Электроника',
    isBuiltIn: true,
    settings: {
      gains: [5, 3, 0, -3, -2, 0, 5, 6, 6, 5],
      volume: 100,
      enabled: true,
    },
  },
]

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
    && (settings.selectedPresetName === undefined
      || (typeof settings.selectedPresetName === 'string' && settings.selectedPresetName.length <= 40))
}

export function isSavedPreset(value: unknown): value is SavedPreset {
  if (!value || typeof value !== 'object') return false
  const preset = value as Partial<SavedPreset>
  return typeof preset.name === 'string'
    && preset.name.trim().length > 0
    && preset.name.length <= 40
    && isTabSettings(preset.settings)
    && (preset.isBuiltIn === undefined || typeof preset.isBuiltIn === 'boolean')
}

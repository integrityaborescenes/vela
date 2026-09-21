import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_SETTINGS, type SavedPreset, type TabSettings } from '../../shared/audio-settings'
import { startTabAudio, updateTabAudio } from '../services/audioBridge'
import { getPresets, getTabSettings, savePresets, saveTabSettings } from '../services/settingsRepository'

type AudioStatus = 'loading' | 'active' | 'error'

export function useTabAudio() {
  const [tabId, setTabId] = useState<number | null>(null)
  const [settings, setSettings] = useState<TabSettings>(DEFAULT_SETTINGS)
  const [presets, setPresets] = useState<SavedPreset[]>([])
  const [status, setStatus] = useState<AudioStatus>('loading')

  useEffect(() => {
    let cancelled = false

    async function initialize() {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (tab?.id === undefined) throw new Error('Не удалось определить вкладку')

        const [savedSettings, savedPresets] = await Promise.all([
          getTabSettings(tab.id),
          getPresets(),
        ])
        if (cancelled) return

        setTabId(tab.id)
        setSettings(savedSettings)
        setPresets(savedPresets)
        await startTabAudio(tab.id, savedSettings)
        if (!cancelled) setStatus('active')
      } catch {
        if (!cancelled) setStatus('error')
      }
    }

    void initialize()
    return () => { cancelled = true }
  }, [])

  const updateSettings = useCallback(async (nextSettings: TabSettings) => {
    setSettings(nextSettings)
    if (tabId === null) return

    try {
      await Promise.all([
        saveTabSettings(tabId, nextSettings),
        updateTabAudio(tabId, nextSettings),
      ])
    } catch {
      setStatus('error')
    }
  }, [tabId])

  const savePreset = useCallback(async (name: string) => {
    const normalizedName = name.trim()
    if (!normalizedName || normalizedName.length > 40) return

    if (presets.some((preset) => preset.isBuiltIn
      && preset.name.toLocaleLowerCase() === normalizedName.toLocaleLowerCase())) {
      throw new Error('Нельзя перезаписать встроенный пресет')
    }

    const nextPresets = [
      ...presets.filter((preset) => preset.name.toLocaleLowerCase() !== normalizedName.toLocaleLowerCase()),
      { name: normalizedName, settings, isBuiltIn: false },
    ]
    await savePresets(nextPresets)
    setPresets(nextPresets)
    await updateSettings({ ...settings, selectedPresetName: normalizedName })
  }, [presets, settings, updateSettings])

  const applyPreset = useCallback((preset: SavedPreset) => updateSettings({
    ...preset.settings,
    gains: [...preset.settings.gains],
    selectedPresetName: preset.name,
  }), [updateSettings])

  const resetSettings = useCallback(() => updateSettings({
    ...DEFAULT_SETTINGS,
    gains: [...DEFAULT_SETTINGS.gains],
  }), [updateSettings])

  const deletePreset = useCallback(async (name: string) => {
    if (presets.some((preset) => preset.name === name && preset.isBuiltIn)) return
    const nextPresets = presets.filter((preset) => preset.name !== name)
    await savePresets(nextPresets)
    setPresets(nextPresets)
    if (settings.selectedPresetName === name) {
      await resetSettings()
    }
  }, [presets, settings.selectedPresetName, resetSettings])

  return { settings, presets, status, updateSettings, savePreset, applyPreset, deletePreset, resetSettings }
}

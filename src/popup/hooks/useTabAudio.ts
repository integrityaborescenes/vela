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

    const nextPresets = [
      ...presets.filter((preset) => preset.name.toLocaleLowerCase() !== normalizedName.toLocaleLowerCase()),
      { name: normalizedName, settings },
    ]
    await savePresets(nextPresets)
    setPresets(nextPresets)
  }, [presets, settings])

  const applyPreset = useCallback((preset: SavedPreset) => updateSettings(preset.settings), [updateSettings])

  const deletePreset = useCallback(async (name: string) => {
    const nextPresets = presets.filter((preset) => preset.name !== name)
    await savePresets(nextPresets)
    setPresets(nextPresets)
  }, [presets])

  const resetSettings = useCallback(() => updateSettings({
    ...DEFAULT_SETTINGS,
    gains: [...DEFAULT_SETTINGS.gains],
  }), [updateSettings])

  return { settings, presets, status, updateSettings, savePreset, applyPreset, deletePreset, resetSettings }
}

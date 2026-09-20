import { Equalizer } from '../Equalizer/Equalizer'
import { PresetControls } from '../PresetControls/PresetControls'
import { VolumeControl } from '../VolumeControl/VolumeControl'
import { useTabAudio } from '../../hooks/useTabAudio'
import styles from './App.module.css'

export function App() {
  const audio = useTabAudio()
  const controlsDisabled = audio.status !== 'active'

  function updateGain(index: number, gain: number) {
    const gains = [...audio.settings.gains]
    gains[index] = gain
    void audio.updateSettings({ ...audio.settings, gains })
  }

  return (
    <main className={styles.panel}>
      <p className="visually-hidden" role="status">
        {audio.status === 'active' ? 'Обработка звука включена' : 'Вкладка недоступна для обработки'}
      </p>
      <PresetControls
        presets={audio.presets}
        disabled={controlsDisabled}
        onSave={audio.savePreset}
        onApply={audio.applyPreset}
        onDelete={audio.deletePreset}
      />
      <div className={styles.audioControls}>
        <VolumeControl
          volume={audio.settings.volume}
          disabled={controlsDisabled}
          onVolumeChange={(volume) => void audio.updateSettings({ ...audio.settings, volume })}
        />
        <Equalizer gains={audio.settings.gains} disabled={controlsDisabled} onGainChange={updateGain} />
      </div>
      <footer className={styles.footer}>
        <button className={styles.resetButton} type="button" disabled={controlsDisabled} onClick={() => void audio.resetSettings()}>
          Сбросить
        </button>
      </footer>
    </main>
  )
}

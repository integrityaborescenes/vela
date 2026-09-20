import { useState, type FormEvent } from 'react'
import type { SavedPreset } from '../../../shared/audio-settings'
import styles from './PresetControls.module.css'

type PresetControlsProps = {
  presets: SavedPreset[]
  disabled?: boolean
  onSave: (name: string) => Promise<void>
  onApply: (preset: SavedPreset) => Promise<void>
  onDelete: (name: string) => Promise<void>
}

export function PresetControls({ presets, disabled = false, onSave, onApply, onDelete }: PresetControlsProps) {
  const [name, setName] = useState('')
  const [selectedName, setSelectedName] = useState('')
  const [error, setError] = useState('')
  const [isListOpen, setIsListOpen] = useState(false)
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const selectedPreset = presets.find((preset) => preset.name === selectedName)

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return setError('Укажи название пресета')
    if (trimmedName.length > 40) return setError('Название должно быть не длиннее 40 символов')

    setError('')
    try {
      await onSave(trimmedName)
      setSelectedName(trimmedName)
      setName('')
      setIsSaveDialogOpen(false)
    } catch {
      setError('Не удалось сохранить пресет')
    }
  }

  async function handleSelection(name: string) {
    setSelectedName(name)
    setIsListOpen(false)
    const preset = presets.find((item) => item.name === name)
    if (!preset) return

    setError('')
    try {
      await onApply(preset)
    } catch {
      setError('Не удалось применить пресет')
    }
  }

  async function handleDelete() {
    if (!selectedPreset) return
    setError('')
    try {
      await onDelete(selectedPreset.name)
      setSelectedName('')
    } catch {
      setError('Не удалось удалить пресет')
    }
  }

  return (
    <div className={styles.manager}>
      <div className={styles.actions}>
        <span className={styles.label}>Эффекты</span>
        <div className={styles.dropdown}>
          <button type="button" className={styles.dropdownTrigger} disabled={disabled} onClick={() => setIsListOpen((isOpen) => !isOpen)}>
            {selectedName || 'Без пресета'}<span className={styles.caret} aria-hidden="true" />
          </button>
          {isListOpen && (
            <div className={styles.dropdownMenu} role="listbox" aria-label="Сохранённые пресеты">
              {presets.length === 0 && <span className={styles.emptyState}>Нет сохранённых пресетов</span>}
              {presets.map((preset) => (
                <button type="button" role="option" aria-selected={preset.name === selectedName} key={preset.name} onClick={() => void handleSelection(preset.name)}>
                  {preset.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <button type="button" className={styles.deleteButton} disabled={disabled || !selectedPreset} onClick={() => void handleDelete()}>Удалить пресет</button>
        <button type="button" className={styles.saveButton} disabled={disabled} onClick={() => setIsSaveDialogOpen(true)}>Сохранить пресет</button>
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {isSaveDialogOpen && (
        <div className={styles.dialogOverlay} role="presentation" onMouseDown={() => setIsSaveDialogOpen(false)}>
          <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="save-preset-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.dialogHeader}>
              <h2 id="save-preset-title">Сохранить пресет</h2>
              <button type="button" className={styles.closeButton} aria-label="Закрыть" onClick={() => setIsSaveDialogOpen(false)}>×</button>
            </div>
            <form className={styles.dialogForm} onSubmit={(event) => void handleSave(event)}>
              <label className="visually-hidden" htmlFor="preset-name">Название пресета</label>
              <input id="preset-name" autoFocus value={name} maxLength={40} placeholder="Введите название пресета" onChange={(event) => setName(event.currentTarget.value)} />
              <button type="submit" className={styles.dialogSaveButton}>Сохранить</button>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

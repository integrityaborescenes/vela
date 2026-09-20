import type { KeyboardEvent, PointerEvent } from 'react'
import styles from './VolumeControl.module.css'

type VolumeControlProps = {
  volume: number
  disabled?: boolean
  onVolumeChange: (volume: number) => void
}

export function VolumeControl({ volume, disabled = false, onVolumeChange }: VolumeControlProps) {
  return (
    <section className={styles.volume} aria-label="Громкость">
      <output>{volume}%</output>
      <button
        aria-label="Громкость"
        aria-valuemin={0}
        aria-valuemax={200}
        aria-valuenow={volume}
        aria-valuetext={`${volume}%`}
        role="slider"
        type="button"
        disabled={disabled}
        onPointerDown={(event) => handlePointerDown(event, onVolumeChange)}
        onPointerMove={(event) => handlePointerMove(event, onVolumeChange)}
        onKeyDown={(event) => handleKeyDown(event, volume, onVolumeChange)}
      >
        <span className={styles.track} aria-hidden="true">
          <span className={styles.fill} style={{ height: `${volume / 2}%` }} />
          <span className={styles.thumb} style={{ bottom: `calc(${volume / 2}% - 4px)` }} />
        </span>
      </button>
      <span>Громкость</span>
    </section>
  )
}

function handlePointerDown(event: PointerEvent<HTMLButtonElement>, onVolumeChange: VolumeControlProps['onVolumeChange']) {
  event.currentTarget.setPointerCapture(event.pointerId)
  updateVolumeFromPointer(event, onVolumeChange)
}

function handlePointerMove(event: PointerEvent<HTMLButtonElement>, onVolumeChange: VolumeControlProps['onVolumeChange']) {
  if (event.currentTarget.hasPointerCapture(event.pointerId)) updateVolumeFromPointer(event, onVolumeChange)
}

function updateVolumeFromPointer(event: PointerEvent<HTMLButtonElement>, onVolumeChange: VolumeControlProps['onVolumeChange']) {
  const bounds = event.currentTarget.getBoundingClientRect()
  const position = Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height))
  onVolumeChange(Math.round((1 - position) * 200))
}

function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, volume: number, onVolumeChange: VolumeControlProps['onVolumeChange']) {
  const changes: Record<string, number> = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }
  if (event.key in changes) {
    event.preventDefault()
    onVolumeChange(Math.min(200, Math.max(0, volume + changes[event.key])))
  }
  if (event.key === 'Home') onVolumeChange(0)
  if (event.key === 'End') onVolumeChange(200)
}

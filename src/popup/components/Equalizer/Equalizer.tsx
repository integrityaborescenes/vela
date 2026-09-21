import { FREQUENCIES } from '../../../shared/audio-settings'
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react'
import styles from './Equalizer.module.css'

type EqualizerProps = {
  gains: number[]
  disabled?: boolean
  onGainChange: (index: number, gain: number) => void
}

export function Equalizer({ gains, disabled = false, onGainChange }: EqualizerProps) {
  const points = gains.map((gain, index) => ({
    x: 46 + index * (908 / (FREQUENCIES.length - 1)),
    y: 8 + ((12 - gain) / 24) * 152,
  }))
  const curve = createCurve(points)
  const area = `${curve} L ${points.at(-1)?.x} 168 L ${points[0]?.x} 168 Z`

  return (
    <section className={styles.equalizer} aria-label="10-полосный эквалайзер">
      <div className={styles.chart}>
        <svg className={styles.graph} viewBox="0 0 1000 190" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="vela-gradient" x1="0" x2="0" y1="0" y2="1" colorInterpolation="linearRGB">
              <stop offset="0%" stopColor="#ffffff" stopOpacity=".52" />
              <stop offset="32%" stopColor="#ffffff" stopOpacity=".34" />
              <stop offset="62%" stopColor="#ffffff" stopOpacity=".13" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line className={styles.midline} x1="0" x2="1000" y1="84" y2="84" />
          {points.map((point) => <line className={styles.gridLine} key={point.x} x1={point.x} x2={point.x} y1="0" y2="168" />)}
          <path className={styles.area} d={area} />
          <path className={styles.curve} d={curve} />
        </svg>
        <div className={styles.points} aria-hidden="true">
          {points.map((point) => <span className={styles.point} key={point.x} style={{ left: `${point.x / 10}%`, top: `${(point.y / 190) * 100}%` } as CSSProperties} />)}
        </div>
        <div className={styles.controls}>
        {FREQUENCIES.map((frequency, index) => (
          <div className={styles.band} key={frequency}>
            <button
              aria-label={`${frequency} Гц`}
              aria-valuemin={-12}
              aria-valuemax={12}
              aria-valuenow={gains[index]}
              aria-valuetext={`${gains[index]} дБ`}
              role="slider"
              type="button"
              disabled={disabled}
              onPointerDown={(event) => handlePointerDown(event, index, onGainChange)}
              onPointerMove={(event) => handlePointerMove(event, index, onGainChange)}
              onKeyDown={(event) => handleKeyDown(event, index, gains[index], onGainChange)}
            />
            <span>{frequency}Hz</span>
          </div>
        ))}
        </div>
      </div>
    </section>
  )
}

function handlePointerDown(event: PointerEvent<HTMLButtonElement>, index: number, onGainChange: EqualizerProps['onGainChange']) {
  event.currentTarget.setPointerCapture(event.pointerId)
  updateGainFromPointer(event, index, onGainChange)
}

function handlePointerMove(event: PointerEvent<HTMLButtonElement>, index: number, onGainChange: EqualizerProps['onGainChange']) {
  if (event.currentTarget.hasPointerCapture(event.pointerId)) updateGainFromPointer(event, index, onGainChange)
}

function updateGainFromPointer(event: PointerEvent<HTMLButtonElement>, index: number, onGainChange: EqualizerProps['onGainChange']) {
  const bounds = event.currentTarget.getBoundingClientRect()
  const position = Math.min(1, Math.max(0, (event.clientY - bounds.top - 8) / 152))
  onGainChange(index, Math.round(12 - position * 24))
}

function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number, gain: number, onGainChange: EqualizerProps['onGainChange']) {
  const changes: Record<string, number> = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }
  if (event.key in changes) {
    event.preventDefault()
    onGainChange(index, Math.min(12, Math.max(-12, gain + changes[event.key])))
  }
  if (event.key === 'Home') onGainChange(index, -12)
  if (event.key === 'End') onGainChange(index, 12)
}

type Point = { x: number; y: number }

function createCurve(points: Point[]) {
  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`
    const previous = points[index - 1]
    const controlX = (previous.x + point.x) / 2
    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`
  }, '')
}

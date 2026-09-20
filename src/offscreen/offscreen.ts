import { isTabSettings, type TabSettings } from '../shared/audio-settings'
import { isOffscreenAudioMessage } from '../shared/audio-messages'

type ActiveAudio = { stream: MediaStream; context: AudioContext; nodes: BiquadFilterNode[]; volume: GainNode }
const active = new Map<number, ActiveAudio>()

chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || !isOffscreenAudioMessage(message)) return
  if (message.type === 'VELA_OFFSCREEN_START') {
    void start(message.tabId, message.streamId, message.settings).then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }))
    return true
  }
  if (message.type === 'VELA_OFFSCREEN_UPDATE' && isTabSettings(message.settings)) {
    applySettings(message.tabId, message.settings)
    sendResponse({ ok: true })
  }
  if (message.type === 'VELA_OFFSCREEN_STOP') {
    stop(message.tabId)
    sendResponse({ ok: true })
  }
})

async function start(tabId: number, streamId: string, settings: TabSettings) {
  stop(tabId)
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: streamId } } as unknown as MediaTrackConstraints,
    video: false,
  })
  const context = new AudioContext()
  const source = context.createMediaStreamSource(stream)
  const nodes = Array.from({ length: 10 }, () => context.createBiquadFilter())
  const frequencies = [31, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]
  nodes.forEach((node, index) => {
    node.type = index === 0 ? 'lowshelf' : index === nodes.length - 1 ? 'highshelf' : 'peaking'
    node.frequency.value = frequencies[index]
    node.Q.value = 1
    if (index > 0) nodes[index - 1].connect(node)
  })
  const volume = context.createGain()
  nodes[nodes.length - 1].connect(volume)
  volume.connect(context.destination)
  source.connect(nodes[0])
  const audio = { stream, context, nodes, volume }
  active.set(tabId, audio)
  applySettings(tabId, settings)
  stream.getAudioTracks()[0]?.addEventListener('ended', () => stop(tabId), { once: true })
  try {
    await context.resume()
  } catch (error) {
    stop(tabId)
    throw error
  }
}

function applySettings(tabId: number, settings: TabSettings) {
  const audio = active.get(tabId)
  if (!audio) return
  audio.nodes.forEach((node, index) => { node.gain.value = settings.enabled ? settings.gains[index] : 0 })
  audio.volume.gain.value = settings.enabled ? settings.volume / 100 : 0
}

function stop(tabId: number) {
  const audio = active.get(tabId)
  if (!audio) return
  audio.stream.getTracks().forEach((track) => track.stop())
  void audio.context.close()
  active.delete(tabId)
}

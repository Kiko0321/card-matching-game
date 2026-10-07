export type Sound = 'flip' | 'match' | 'clear' | 'unlock' | 'big' | 'win' | 'lose'

/** Each note: [frequency Hz, start offset s, duration s]. */
const NOTES: Record<Sound, [number, number, number][]> = {
  flip: [[520, 0, 0.05]],
  match: [[660, 0, 0.08], [880, 0.07, 0.1]],
  clear: [[523, 0, 0.1], [659, 0.09, 0.1], [784, 0.18, 0.16]],
  unlock: [[392, 0, 0.12], [587, 0.1, 0.12], [784, 0.2, 0.22]],
  big: [[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.1], [1047, 0.3, 0.35]],
  win: [[523, 0, 0.15], [659, 0.15, 0.15], [784, 0.3, 0.15], [1047, 0.45, 0.5]],
  lose: [[392, 0, 0.2], [330, 0.2, 0.2], [262, 0.4, 0.4]],
}

let ctx: AudioContext | null = null

export function playSound(sound: Sound) {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    const now = ctx.currentTime
    for (const [freq, start, duration] of NOTES[sound]) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, now + start)
      gain.gain.exponentialRampToValueAtTime(0.18, now + start + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now + start)
      osc.stop(now + start + duration + 0.02)
    }
  } catch {
    // Audio unavailable: play silently.
  }
}

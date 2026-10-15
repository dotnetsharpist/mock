// The question bank's per-question clock: seconds spent on the question on
// screen. It measures wall-clock time between start() and stop() rather than
// counting ticks, so a throttled background tab does not lose time.
import { onBeforeUnmount, ref } from 'vue'

export function useBankClock() {
  const seconds = ref(0)
  let base = 0
  let startedAt = null
  let timer = null

  const tick = () => {
    seconds.value = base + Math.floor((Date.now() - startedAt) / 1000)
  }

  // Stops and returns the reading.
  function stop() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    if (startedAt !== null) {
      tick()
      base = seconds.value
      startedAt = null
    }
    return seconds.value
  }

  // Async work that finishes after the page is gone (a question loading as the
  // student leaves) must not start an interval nothing will ever clear.
  let disposed = false

  // Starts from `from` seconds — a revisited question keeps its earlier time.
  function start(from = 0) {
    stop()
    base = from
    seconds.value = from
    if (disposed) return
    startedAt = Date.now()
    timer = setInterval(tick, 250)
  }

  onBeforeUnmount(() => {
    stop()
    disposed = true
  })

  return { seconds, start, stop }
}

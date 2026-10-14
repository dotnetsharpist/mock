import { onBeforeUnmount, onMounted, ref } from 'vue'
import { getTestApiBaseUrl } from '@/utils/api'

// The real number of test attempts across every published test, summed from
// `GET /api/test` (`attemptCount` per test), eased up to on load and re-polled
// while the page is open so it reads as a live figure rather than a claim.
// A hidden tab skips its polls: nobody is watching the number, and each poll
// makes the backend count every test's questions and attempts.
//
// This is the same source and the same easing the old marketing hero used
// (components/Hero.vue) — lifted out so the landing hero can show it too.
export function useLiveTestCount({ fallback = 6500, pollMs = 30000 } = {}) {
  // Never blank and never zero: the static fallback shows until a real total
  // lands, and stays if the request fails.
  const count = ref(fallback)
  // True once a real value has arrived — drives the "Jonli" indicator, so the
  // dot never claims to be live while the fallback is on screen.
  const isLive = ref(false)

  let frame = 0
  let timer

  // easeOutCubic from the value on screen to the new total: 0 → total is wrong
  // here because the fallback is already shown, so it counts from that.
  const animateTo = (target) => {
    const from = count.value
    if (from === target) return
    cancelAnimationFrame(frame)
    const duration = 1400
    let start = null

    const step = (timestamp) => {
      if (start === null) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      count.value = Math.round(from + (target - from) * eased)
      if (progress < 1) frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
  }

  const load = async () => {
    try {
      // Anonymous, public read — plain fetch so a stray 401 can't bounce a
      // logged-out visitor off the landing page.
      const response = await fetch(`${getTestApiBaseUrl()}/test`)
      if (!response.ok) return
      const payload = await response.json()
      const tests = Array.isArray(payload?.data) ? payload.data : []
      const total = tests.reduce((sum, test) => sum + (test?.attemptCount ?? 0), 0)
      if (total > 0) {
        isLive.value = true
        animateTo(total)
      }
    } catch {
      // Offline or API down — keep the fallback.
    }
  }

  const poll = () => {
    if (document.visibilityState === 'visible') load()
  }

  onMounted(() => {
    load()
    timer = setInterval(poll, pollMs)
  })

  onBeforeUnmount(() => {
    cancelAnimationFrame(frame)
    if (timer) clearInterval(timer)
  })

  return { count, isLive }
}

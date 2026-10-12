// Seconds → "MM:SS", or "HH:MM:SS" once there is an hour or more left. Shared by
// the test page's timer pill and its pause overlay so both read the same.
export function formatCountdown(seconds) {
  const totalSeconds = Math.max(Math.floor(Number(seconds || 0)), 0)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60

  const normalizedMinutes = String(minutes).padStart(2, '0')
  const normalizedSeconds = String(secs).padStart(2, '0')

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${normalizedMinutes}:${normalizedSeconds}`
  }

  return `${normalizedMinutes}:${normalizedSeconds}`
}

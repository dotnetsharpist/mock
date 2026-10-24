// Ona tili insho (essay) AI-analysis — backend endpoint client.
//
// ⚠️ PROPOSED CONTRACT — the endpoint does not exist yet. Agree the final
// shape with the frontend team, implement it, then this module is the single
// place to adjust. Everything downstream (EssayAnalysisSection.vue +
// normalizeEssayAnalysis) already consumes the shapes below.
//
//   GET {api}/user-test-attempt/essay-analysis?testAttemptId=987   (Authorize)
//
//   → standard envelope: { "code": 200, "message": "Ok👍🏿", "data": {
//       "bandTotal": 17,            // overall band (12 mezon × 0–2 = 24 max)
//       "bandMax": 24,
//       "essayText": "…",           // the essay the AI graded (quotes refer to it)
//       "analysis": { …raw Gemini grading JSON… }
//     } }
//
//   `analysis` is passed through UNCHANGED from Gemini:
//   { on_topic, copied_suspected, global_notes, error_criteria, judgment_criteria }
//   — see utils/essayAnalysis.js for the full shape. The frontend normalizes
//   it tolerantly, so extra/missing criteria never require a frontend release.
//
//   Expected non-200 cases: analysis still pending (grading is async) → e.g.
//   code 202/404 with a message; the caller shows a "tahlil tayyorlanmoqda"
//   state and may poll.
import { apiFetch, getTestApiBaseUrl } from '@/utils/api'
import { useAuthStore } from '@/stores/auth'
import { t } from '@/i18n'

export async function fetchEssayAnalysis(testAttemptId) {
  const authStore = useAuthStore()
  const headers = { accept: '*/*' }
  if (authStore.token) {
    headers.Authorization = `Bearer ${authStore.token}`
  }

  const apiBaseUrl = getTestApiBaseUrl()
  const response = await apiFetch(
    `${apiBaseUrl}/user-test-attempt/essay-analysis?testAttemptId=${encodeURIComponent(testAttemptId)}`,
    { headers },
  )

  const payload = await response.json().catch(() => null)

  if (!response.ok || payload?.code !== 200 || !payload?.data) {
    const error = new Error(payload?.message || t('essayAnalysis.loadFailed'))
    error.code = payload?.code ?? response.status
    throw error
  }

  const { bandTotal, bandMax, essayText, analysis } = payload.data
  return {
    bandTotal: Number.isFinite(Number(bandTotal)) ? Number(bandTotal) : null,
    bandMax: Number.isFinite(Number(bandMax)) ? Number(bandMax) : 24,
    essayText: String(essayText || ''),
    analysis: analysis && typeof analysis === 'object' ? analysis : {},
  }
}

// Every request the question bank screens make goes through here, so the API
// envelope ({ code, message, data }), the token and the error wording live in
// one place. Backend: milliy-platform, QuestionBankController
// (`/api/question-bank/*`).
import { apiFetch, getTestApiBaseUrl, isNetworkError, readJsonBody } from '@/utils/api'
import { useAuthStore } from '@/stores/auth'

// The backend answers in English; students read Uzbek. Known messages are
// translated one to one, anything else falls back to a line chosen by status.
const SERVER_MESSAGES = {
  'Question not found': 'Savol topilmadi yoki olib tashlangan.',
  'Session not found': 'Mashq topilmadi.',
  'Answer the question to see its solution': 'Yechimni ko‘rish uchun avval javob bering.',
  'This question was saved by another request; refresh and try again':
    'Saqlash bir vaqtda ikki marta bosildi. Sahifani yangilab, qayta urinib ko‘ring.',
  'Unknown report category': 'Xato turini tanlang.',
  'Describe what is wrong with the question': 'Savolda nima xato ekanini yozing.',
  'You have already reported this question': 'Siz bu savol haqida allaqachon xabar bergansiz.',
  'Choose an option': 'Variantni tanlang.',
  'The option does not belong to this question': 'Bu variant savolga tegishli emas.',
  'Type an answer': 'Javobingizni yozing.',
  'This session is already finished': 'Bu mashq allaqachon yakunlangan.',
  'This question is not part of the session': 'Bu savol mashqqa kirmaydi.',
  'This question is already answered in this session': 'Bu savolga mashqda javob berib bo‘lgansiz.',
  'No questions match these filters': 'Tanlangan filtrlarga mos savol yo‘q.',
  'Count must be positive': 'Savollar sonini kiriting.',
}

const STATUS_MESSAGES = {
  400: 'So‘rovda xato bor. Maydonlarni tekshiring.',
  401: 'Sessiya tugagan. Qaytadan kiring.',
  403: 'Bu amalga ruxsat yo‘q.',
  404: 'Topilmadi.',
  409: 'Bu amal boshqa so‘rov bilan to‘qnashdi. Qayta urinib ko‘ring.',
}

export class BankApiError extends Error {
  constructor(message, { status = 0, kind = 'http', serverMessage = '' } = {}) {
    super(message)
    this.name = 'BankApiError'
    this.status = status
    // 'network' — the connection dropped; 'http' — the API said no.
    this.kind = kind
    this.serverMessage = serverMessage
  }
}

function messageFor(status, serverMessage) {
  const known = SERVER_MESSAGES[String(serverMessage || '').trim()]
  if (known) return known
  if (String(serverMessage || '').startsWith('The answer cannot be longer than')) {
    return 'Javob juda uzun — 200 belgidan oshmasin.'
  }
  if (String(serverMessage || '').startsWith('The message cannot be longer than')) {
    return 'Xabar juda uzun — 1000 belgidan oshmasin.'
  }
  return STATUS_MESSAGES[status] || 'Nimadir xato ketdi. Biroz kutib, qayta urinib ko‘ring.'
}

// Arrays repeat the key (`skillIds=1&skillIds=2`), which is how ASP.NET binds
// a list from the query string. Empty values are left out entirely.
function buildQuery(params = {}) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '' || value === false) continue
    if (Array.isArray(value)) {
      for (const item of value) search.append(key, String(item))
    } else {
      search.append(key, String(value))
    }
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}

async function request(method, path, { query, body } = {}) {
  const authStore = useAuthStore()
  const headers = { accept: 'application/json' }
  if (authStore.isAuthenticated) headers.Authorization = `Bearer ${authStore.token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let response
  try {
    response = await apiFetch(
      `${getTestApiBaseUrl()}/question-bank${path}${buildQuery(query)}`,
      { method, headers, body: body === undefined ? undefined : JSON.stringify(body) },
    )
  } catch (error) {
    throw new BankApiError(
      isNetworkError(error)
        ? 'Internetda uzilish bor. Ulanishni tekshiring.'
        : 'Server bilan bog‘lanib bo‘lmadi. Biroz kutib, qayta urinib ko‘ring.',
      { kind: isNetworkError(error) ? 'network' : 'http' },
    )
  }

  const payload = await readJsonBody(response)
  if (!response.ok) {
    throw new BankApiError(messageFor(response.status, payload?.message), {
      status: response.status,
      serverMessage: payload?.message || '',
    })
  }
  return payload?.data
}

export const questionBankApi = {
  topics: (subject, language) => request('GET', '/topics', { query: { subject, language } }),
  questions: (query) => request('GET', '/questions', { query }),
  question: (id) => request('GET', `/questions/${id}`),
  solution: (id) => request('GET', `/questions/${id}/solution`),
  answer: (dto) => request('POST', '/answer', { body: dto }),
  // Answers with the new saved state.
  toggleSave: (id) => request('POST', `/questions/${id}/save`),
  report: (id, dto) => request('POST', `/questions/${id}/report`, { body: dto }),
  startSession: (dto) => request('POST', '/sessions', { body: dto }),
  sessions: (subject) => request('GET', '/sessions', { query: { subject } }),
  session: (id) => request('GET', `/sessions/${id}`),
  finishSession: (id) => request('POST', `/sessions/${id}/finish`),
  stats: (subject) => request('GET', '/stats', { query: { subject } }),
  resetProgress: (subject) => request('DELETE', '/progress', { query: { subject } }),
}

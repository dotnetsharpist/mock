// Every request the question bank screens make goes through here, so the API
// envelope ({ code, message, data }), the token and the error wording live in
// one place. Backend: milliy-platform, QuestionBankController
// (`/api/question-bank/*`).
import { apiFetch, getTestApiBaseUrl, isNetworkError, readJsonBody } from '@/utils/api'
import { useAuthStore } from '@/stores/auth'
import { t } from '@/i18n'

// The backend answers in English; students read Uzbek or Russian. Known
// messages map one to one onto a message key (i18n/locales/questionBank.js),
// anything else falls back to a line chosen by status. The text is looked up
// as the error is built, in the language on screen at that moment.
const SERVER_MESSAGES = {
  'Question not found': 'bank.errors.questionNotFound',
  'Session not found': 'bank.errors.sessionNotFound',
  'Answer the question to see its solution': 'bank.errors.answerFirst',
  'This question was saved by another request; refresh and try again': 'bank.errors.concurrentSave',
  'Unknown report category': 'bank.errors.unknownCategory',
  'Describe what is wrong with the question': 'bank.errors.describeProblem',
  'You have already reported this question': 'bank.errors.alreadyReported',
  'Choose an option': 'bank.errors.chooseOption',
  'The option does not belong to this question': 'bank.errors.foreignOption',
  'Type an answer': 'bank.errors.typeAnswer',
  'This session is already finished': 'bank.errors.sessionFinished',
  'This question is not part of the session': 'bank.errors.notInSession',
  'This question is already answered in this session': 'bank.errors.alreadyAnswered',
  'No questions match these filters': 'bank.errors.noMatches',
  'Count must be positive': 'bank.errors.countPositive',
}

const STATUS_MESSAGES = {
  400: 'bank.errors.status400',
  401: 'bank.errors.status401',
  403: 'bank.errors.status403',
  404: 'bank.errors.status404',
  409: 'bank.errors.status409',
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
  if (known) return t(known)
  if (String(serverMessage || '').startsWith('The answer cannot be longer than')) {
    return t('bank.errors.answerTooLong')
  }
  if (String(serverMessage || '').startsWith('The message cannot be longer than')) {
    return t('bank.errors.messageTooLong')
  }
  return t(STATUS_MESSAGES[status] || 'bank.errors.generic')
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
      isNetworkError(error) ? t('bank.errors.network') : t('bank.errors.unreachable'),
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
  // How many questions a filter set matches, with the count behind each setup choice.
  summary: (filter) => request('GET', '/questions/summary', { query: filter }),
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

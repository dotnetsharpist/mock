// Vocabulary of the question bank: which subjects it covers, and the words
// for the backend's enum values. One place, so a filter chip, a badge and a
// stats row can never name the same thing differently.
//
// The words themselves live in i18n/locales/questionBank.js. Nothing here holds
// translated text: each entry keeps a message key and reads it through a
// `label` getter, so whatever renders the entry — a v-for, AppSelect — asks for
// the text in the language on screen and follows the switch without a reload.
import { SUBJECTS, SUBJECT_ORDER } from '@/components/app/subjects.js'
import { intlLocale, t } from '@/i18n'

const withLabels = (entries) =>
  entries.map(({ labelKey, ...entry }) => ({
    ...entry,
    get label() {
      return t(labelKey)
    },
  }))

// Subjects the bank backend accepts (SubjectType), in the platform's order.
const BANK_SUBJECT_API = new Set(['Math', 'Biology', 'History', 'Physics', 'MotherTongue'])

export const BANK_SUBJECT_KEYS = SUBJECT_ORDER.filter((key) => BANK_SUBJECT_API.has(SUBJECTS[key]?.api))

export const bankSubject = (key) => (BANK_SUBJECT_KEYS.includes(key) ? SUBJECTS[key] : null)

export const DIFFICULTIES = withLabels([
  { value: 'Easy', labelKey: 'bank.difficulty.easy', level: 1 },
  { value: 'Medium', labelKey: 'bank.difficulty.medium', level: 2 },
  { value: 'Hard', labelKey: 'bank.difficulty.hard', level: 3 },
])

export const difficultyOf = (value) => DIFFICULTIES.find((d) => d.value === value) ?? DIFFICULTIES[1]

// Status filters read the student's latest answer to each question.
export const STATUS_FILTERS = withLabels([
  { value: '', labelKey: 'bank.statusFilter.all' },
  { value: 'Unanswered', labelKey: 'bank.statusFilter.unanswered' },
  { value: 'Answered', labelKey: 'bank.statusFilter.answered' },
  { value: 'Correct', labelKey: 'bank.statusFilter.correct' },
  { value: 'Incorrect', labelKey: 'bank.statusFilter.incorrect' },
])

export const TYPE_OPTIONS = withLabels([
  { value: '', labelKey: 'bank.questionType.all' },
  { value: 'MultipleChoice', labelKey: 'bank.questionType.multipleChoice' },
  { value: 'FreeAnswer', labelKey: 'bank.questionType.freeAnswer' },
])

export const LANGUAGE_OPTIONS = withLabels([
  { value: '', labelKey: 'bank.questionLanguage.all' },
  { value: 'Uzbek', labelKey: 'bank.questionLanguage.uzbek' },
  { value: 'Russian', labelKey: 'bank.questionLanguage.russian' },
])

export const REPORT_CATEGORIES = withLabels([
  { value: 'WrongAnswerKey', labelKey: 'bank.reportCategory.wrongAnswerKey' },
  { value: 'IncorrectExplanation', labelKey: 'bank.reportCategory.incorrectExplanation' },
  { value: 'UnclearQuestion', labelKey: 'bank.reportCategory.unclearQuestion' },
  { value: 'Formatting', labelKey: 'bank.reportCategory.formatting' },
  { value: 'Other', labelKey: 'bank.reportCategory.other' },
])

const MODE_KEYS = { Practice: 'bank.mode.practice', Timed: 'bank.mode.timed' }

export const modeLabel = (mode) => (MODE_KEYS[mode] ? t(MODE_KEYS[mode]) : '')

export const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

// "1 daq 05 s" for durations, "45 s" under a minute.
export function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.round(Number(totalSeconds) || 0))
  if (seconds < 60) return t('bank.duration.seconds', { s: seconds })
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  if (minutes < 60) {
    return rest
      ? t('bank.duration.minutesSeconds', { m: minutes, s: String(rest).padStart(2, '0') })
      : t('bank.duration.minutes', { m: minutes })
  }
  const hours = Math.floor(minutes / 60)
  return t('bank.duration.hoursMinutes', { h: hours, m: minutes % 60 })
}

// 0:45, 12:05 — the running clocks in the player.
export function formatClock(totalSeconds) {
  const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0))
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
}

const MONTHS = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek']

// The backend stores Tashkent wall-clock time and serialises it with a `Z`, so
// the string's own fields are already local time: read them as UTC, never let
// the browser shift them a second time.
//
// Uzbek keeps these hand-written short months ("5-yan, 14:30"); Russian takes
// Intl's ("5 янв., 14:30"), read in UTC for the same reason.
export function formatBankDate(value, { withTime = true } = {}) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  if (intlLocale() !== 'uz-UZ') {
    return new Intl.DateTimeFormat(intlLocale(), {
      timeZone: 'UTC',
      day: 'numeric',
      month: 'short',
      ...(withTime ? { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' } : {}),
    }).format(date)
  }
  const day = `${date.getUTCDate()}-${MONTHS[date.getUTCMonth()]}`
  if (!withTime) return day
  return `${day}, ${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`
}

export const percent = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0)

// Vocabulary of the question bank: which subjects it covers, and the Uzbek
// words for the backend's enum values. One place, so a filter chip, a badge and
// a stats row can never name the same thing differently.
import { SUBJECTS, SUBJECT_ORDER } from '@/components/app/subjects.js'

// Subjects the bank backend accepts (SubjectType), in the platform's order.
const BANK_SUBJECT_API = new Set(['Math', 'Biology', 'History', 'Physics', 'MotherTongue'])

export const BANK_SUBJECT_KEYS = SUBJECT_ORDER.filter((key) => BANK_SUBJECT_API.has(SUBJECTS[key]?.api))

export const bankSubject = (key) => (BANK_SUBJECT_KEYS.includes(key) ? SUBJECTS[key] : null)

export const DIFFICULTIES = [
  { value: 'Easy', label: 'Oson', level: 1 },
  { value: 'Medium', label: 'O‘rta', level: 2 },
  { value: 'Hard', label: 'Qiyin', level: 3 },
]

export const difficultyOf = (value) => DIFFICULTIES.find((d) => d.value === value) ?? DIFFICULTIES[1]

// Status filters read the student's latest answer to each question.
export const STATUS_FILTERS = [
  { value: '', label: 'Hammasi' },
  { value: 'Unanswered', label: 'Yechilmagan' },
  { value: 'Answered', label: 'Yechilgan' },
  { value: 'Correct', label: 'To‘g‘ri' },
  { value: 'Incorrect', label: 'Xato' },
]

export const TYPE_OPTIONS = [
  { value: '', label: 'Barcha turlar' },
  { value: 'MultipleChoice', label: 'Variantli' },
  { value: 'FreeAnswer', label: 'Yozma javob' },
]

export const LANGUAGE_OPTIONS = [
  { value: '', label: 'Barcha tillar' },
  { value: 'Uzbek', label: 'O‘zbek tilida' },
  { value: 'Russian', label: 'Rus tilida' },
]

export const REPORT_CATEGORIES = [
  { value: 'WrongAnswerKey', label: 'Javob kaliti noto‘g‘ri' },
  { value: 'IncorrectExplanation', label: 'Yechimda xato bor' },
  { value: 'UnclearQuestion', label: 'Savol tushunarsiz' },
  { value: 'Formatting', label: 'Formula yoki rasm buzilgan' },
  { value: 'Other', label: 'Boshqa' },
]

export const MODE_LABELS = { Practice: 'Mashq', Timed: 'Vaqtli' }

export const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

// "1 daq 05 s" for durations, "45 s" under a minute.
export function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.round(Number(totalSeconds) || 0))
  if (seconds < 60) return `${seconds} s`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  if (minutes < 60) return rest ? `${minutes} daq ${String(rest).padStart(2, '0')} s` : `${minutes} daq`
  const hours = Math.floor(minutes / 60)
  return `${hours} soat ${minutes % 60} daq`
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
export function formatBankDate(value, { withTime = true } = {}) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const day = `${date.getUTCDate()}-${MONTHS[date.getUTCMonth()]}`
  if (!withTime) return day
  return `${day}, ${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`
}

export const percent = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0)

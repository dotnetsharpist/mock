// The subject registry. One entry per subject, shared by the Testlar grid, the
// test rows and the dashboard so a subject cannot look like two different things
// in two places.
//
// `icon` names a path set in AppIcon.vue — the platform's one icon style.
// `api` is the backend SubjectType enum value; `aliases` cover the other
// spellings the admin panel may have stored, matched case-insensitively, so a
// test is never dropped just because its subject string is worded differently.
//
// `label`, `fullLabel` and `description` are read through t() on every access
// rather than stored, so a screen that renders `subject.label` follows a
// language switch without each caller knowing the message keys. Names that
// messages.js already has (subjects.*) are read from there; the rest live in
// locales/appHome.js under subjectsCatalog.
import { t } from '@/i18n'

const withCopy = (entry) => {
  const copy = {
    label: { enumerable: true, configurable: true, get: () => t(entry.labelKey) },
    description: { enumerable: true, configurable: true, get: () => t(entry.descriptionKey) },
  }
  if (entry.fullLabelKey) {
    copy.fullLabel = { enumerable: true, configurable: true, get: () => t(entry.fullLabelKey) }
  }
  return Object.defineProperties(entry, copy)
}

export const SUBJECTS = {
  math: withCopy({
    labelKey: 'subjects.math.subjectValue',
    icon: 'calculator',
    api: 'Math',
    aliases: ['math', 'matematika', 'математика'],
    descriptionKey: 'subjectsCatalog.math.description',
  }),
  motherTongue: withCopy({
    labelKey: 'subjects.motherTongue.subjectValue',
    // The official name; rows and the subject page heading use this.
    fullLabelKey: 'subjectsCatalog.motherTongue.fullLabel',
    icon: 'book',
    api: 'MotherTongue',
    aliases: ['mothertongue', 'mother tongue', 'ona tili', 'onatili', 'родной язык'],
    descriptionKey: 'subjectsCatalog.motherTongue.description',
  }),
  physics: withCopy({
    labelKey: 'subjects.physics.subjectValue',
    icon: 'atom',
    api: 'Physics',
    aliases: ['physics', 'fizika', 'физика'],
    descriptionKey: 'subjectsCatalog.physics.description',
  }),
  chemistry: withCopy({
    labelKey: 'subjectsCatalog.chemistry.label',
    icon: 'flask',
    api: 'Chemistry',
    aliases: ['chemistry', 'kimyo', 'химия'],
    descriptionKey: 'subjectsCatalog.chemistry.description',
  }),
  history: withCopy({
    labelKey: 'subjects.history.subjectValue',
    icon: 'landmark',
    api: 'History',
    aliases: ['history', 'tarix', 'история'],
    descriptionKey: 'subjectsCatalog.history.description',
  }),
  geography: withCopy({
    labelKey: 'subjectsCatalog.geography.label',
    icon: 'globe',
    api: 'Geography',
    aliases: ['geography', 'geografiya', 'география'],
    descriptionKey: 'subjectsCatalog.geography.description',
  }),
  english: withCopy({
    labelKey: 'subjectsCatalog.english.label',
    icon: 'languages',
    api: 'English',
    aliases: ['english', 'ingliz tili', 'ingliztili', 'английский'],
    descriptionKey: 'subjectsCatalog.english.description',
  }),
  informatics: withCopy({
    labelKey: 'subjectsCatalog.informatics.label',
    icon: 'monitor',
    api: 'Informatics',
    aliases: ['informatics', 'informatika', 'информатика'],
    descriptionKey: 'subjectsCatalog.informatics.description',
  }),
  biology: withCopy({
    labelKey: 'subjects.biology.subjectValue',
    icon: 'leaf',
    api: 'Biology',
    aliases: ['biology', 'biologiya', 'биология'],
    descriptionKey: 'subjectsCatalog.biology.description',
  }),
}

// Display order of the Fanlar grid. Subjects the backend has no tests for are
// dropped from the grid entirely, so this is an ordering, not a whitelist.
export const SUBJECT_ORDER = [
  'math',
  'motherTongue',
  'physics',
  'chemistry',
  'history',
  'geography',
  'english',
  'informatics',
  'biology',
]

// What a subject unknown to this registry falls back to, so a test whose
// subject string we do not recognise is still shown rather than silently lost.
// The raw string is the backend's and stays as sent; only the stand-in for a
// missing one is ours to translate.
export const unknownSubject = (raw) => ({
  get label() {
    return raw ? String(raw) : t('subjectsCatalog.other')
  },
  icon: 'tests',
  description: '',
  isUnknown: true,
})

export const getSubject = (key) => SUBJECTS[key] ?? null

// Every name a test title may open with, longest first: the ones on screen,
// plus the Uzbek ones, because titles are typed in the admin panel in Uzbek
// whatever the interface language ("Tarix - Milliy Sertifikat 04.04.2026").
export function subjectTitleNames(subject) {
  const names = [subject.fullLabel, subject.label]
  if (subject.fullLabelKey) names.push(t(subject.fullLabelKey, {}, { locale: 'uz' }))
  if (subject.labelKey) names.push(t(subject.labelKey, {}, { locale: 'uz' }))
  return [...new Set(names.filter(Boolean))]
}

// Backend subject string → registry key. Exact enum match first, then aliases,
// both case-insensitive. Returns null when nothing matches.
export function subjectKeyFromApi(value) {
  const raw = String(value ?? '').toLowerCase().trim()
  if (!raw) return null

  for (const [key, subject] of Object.entries(SUBJECTS)) {
    if (subject.api.toLowerCase() === raw) return key
  }
  for (const [key, subject] of Object.entries(SUBJECTS)) {
    if (subject.aliases.some((alias) => raw === alias || raw.includes(alias))) return key
  }
  return null
}

// Testlar is where a student *takes* a test, so the action always starts one —
// a finished test is offered again, not swapped for its result. Results live on
// Natijalar. The one exception is a half-finished attempt, which resumes rather
// than restarting so the student does not lose their answers.
//
// Getters, like the labels above, so a row reading ACTION_BY_STATE[state]
// during render picks up the current language.
export const ACTION_BY_STATE = {
  get new() {
    return t('appUi.startTest')
  },
  get progress() {
    return t('appUi.continueTest')
  },
  get done() {
    return t('appUi.startTest')
  },
}

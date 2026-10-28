// Biology open-response (AiReviewMode.BiologyOpenResponse) AI review: constants
// + normalizer for what get-results returns under `biologyReviews`.
//
// One entry per AI-graded TASK — a question GROUP, not a question: the group's
// typed sub-answers plus the solution photos are reviewed together, for the
// group's full mark.
//
//   {
//     id, questionGroupId,
//     problemType: "genetika (uch genli birikish va krossingover)",
//     verdict: "graded" | "wrong_method" | …,
//     totalScore: 25,                 // or { source: "22.0", parsedValue: 22 }
//     maxScore: 25,
//     methodologicalScore, arithmeticScore, presentationScore,
//     methodBlockVoided: false,
//     globalNotes: "…",
//     elementBreakdownJson: "{\"a1\":{applicable,verdict,weight}, …}",
//     evaluationJson: "{ problem_type, …flags, global_notes, elements:[…] }"
//   }
//
// Two verdicts never reach the AI and arrive with `id: 0` and no JSON columns:
// `all_correct` (every typed sub-answer matched — full marks, no review needed)
// and `no_solution` (an answer was wrong and no photos were uploaded at all).
// Both normalize to a verdict explanation with no criterion breakdown.
//
// The two JSON columns overlap: elementBreakdownJson carries each criterion's
// WEIGHT, evaluationJson carries its REASONING and QUOTE. normalizeBiologyReview
// merges them by criterion code, and is deliberately tolerant — either column
// may be missing, unparseable, or gain criteria this build has never seen.

import { t } from '@/i18n'

// Every label and explanation below is an i18n key under `biologyReview`,
// worded by normalizeBiologyReview. The section calls that inside a computed,
// so a language switch re-words an open review.

// Criterion codes are grouped by their leading letter. a/b feed the
// methodological score, c the arithmetic score, d the presentation score.
export const ELEMENT_GROUPS = [
  { key: 'a', labelKey: 'biologyReview.groups.a' },
  { key: 'b', labelKey: 'biologyReview.groups.b' },
  { key: 'c', labelKey: 'biologyReview.groups.c' },
  { key: 'd', labelKey: 'biologyReview.groups.d' },
]

const OTHER_GROUP = { key: 'other', labelKey: 'biologyReview.groups.other' }

export const ELEMENT_VERDICTS = {
  full: { labelKey: 'biologyReview.elementVerdicts.full', color: '#4f7a55' },
  partial: { labelKey: 'biologyReview.elementVerdicts.partial', color: '#c08a3e' },
  zero: { labelKey: 'biologyReview.elementVerdicts.zero', color: '#c25d52' },
}

// Criteria the AI marked not applicable to this problem type (e.g. a Punnett
// square on a molecular-biology task). They score nothing and are not failures.
export const SKIPPED_VERDICT = { labelKey: 'biologyReview.elementVerdicts.skipped', color: '#a39e94' }

export const SCORE_BUCKETS = [
  { key: 'methodologicalScore', labelKey: 'biologyReview.buckets.methodologicalScore', color: '#5b7ea3' },
  { key: 'arithmeticScore', labelKey: 'biologyReview.buckets.arithmeticScore', color: '#4f8f88' },
  { key: 'presentationScore', labelKey: 'biologyReview.buckets.presentationScore', color: '#b8703c' },
]

// verdict === "graded" is the normal case. EVERY other verdict is an official
// zero condition — totalScore is 0 and the UI shows the verdict's `explanation`
// instead of a score breakdown. The wording is `biologyReview.verdicts.<key>`
// (`label`, and `explanation` where `explained`).
const REVIEW_VERDICTS = {
  graded: { tone: 'ok' },
  all_correct: { tone: 'ok', explained: true },
  wrong_method: { tone: 'bad', explained: true },
  answer_only: { tone: 'warn', explained: true },
  no_solution: { tone: 'bad', explained: true },
  illegible: { tone: 'bad', explained: true },
  gross_biological_error: { tone: 'bad', explained: true },
  no_applicable_elements: { tone: 'bad', explained: true },
  pending: { tone: 'warn' },
}

// A verdict's display shape: { key, label, tone, explanation? }.
function wordVerdict(key) {
  const { tone, explained } = REVIEW_VERDICTS[key]
  const verdict = { label: t(`biologyReview.verdicts.${key}.label`), tone }
  if (explained) verdict.explanation = t(`biologyReview.verdicts.${key}.explanation`)
  return verdict
}

// Blocking problems the AI flags on the evaluation payload. Each one explains a
// heavily reduced score, so they surface as warning chips above the criteria.
const FLAGS = [
  'method_fundamentally_wrong',
  'gross_biological_error',
  'answer_only',
  'no_solution',
  'illegible',
]

// Scores arrive either as a bare number or boxed as { source, parsedValue }
// (a serializer quirk on the grading pipeline), and `source` is a string that
// may use a decimal comma. Read every one of those shapes, else null.
export function readScore(value) {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === 'string') {
    const parsed = Number(value.trim().replace(',', '.'))
    return Number.isFinite(parsed) ? parsed : null
  }

  if (typeof value === 'object') {
    const parsed = readScore(value.parsedValue ?? value.ParsedValue)
    return parsed !== null ? parsed : readScore(value.source ?? value.Source)
  }

  return null
}

// Trim trailing zeros so 22.0 reads "22" but 4.5 stays "4.5".
export function formatScore(value) {
  const score = readScore(value)
  if (score === null) {
    return '—'
  }
  return Number.isInteger(score) ? String(score) : String(Math.round(score * 10) / 10)
}

function parseJsonColumn(raw) {
  if (raw && typeof raw === 'object') {
    return raw
  }

  if (typeof raw === 'string' && raw.trim()) {
    try {
      return JSON.parse(raw)
    } catch {
      // Malformed column — the caller falls back to the flattened fields.
    }
  }

  return null
}

function normalizeVerdict(value) {
  const verdict = String(value || '').trim().toLowerCase()

  if (REVIEW_VERDICTS[verdict]) {
    return { key: verdict, ...wordVerdict(verdict) }
  }

  // No verdict at all → an older row from before the verdict column; treat as
  // graded. An UNKNOWN verdict is, per the contract, some new zero condition —
  // pass the raw name through with a generic zero explanation.
  if (!verdict) {
    return { key: '', ...wordVerdict('graded') }
  }

  return {
    key: verdict,
    label: String(value),
    tone: 'warn',
    explanation: t('biologyReview.verdicts.unknownExplanation'),
  }
}

// One raw review → the view model BiologyReviewSection renders. Never throws.
export function normalizeBiologyReview(raw) {
  const review = raw && typeof raw === 'object' ? raw : {}
  const evaluation = parseJsonColumn(review.evaluationJson) || {}
  const breakdown = parseJsonColumn(review.elementBreakdownJson) || {}

  // Criterion codes from BOTH columns, so a criterion present in only one still
  // renders. evaluationJson's order is the AI's own reading order; anything that
  // exists only in the breakdown is appended.
  const evaluationElements = Array.isArray(evaluation.elements) ? evaluation.elements : []
  const codes = [
    ...evaluationElements.map((element) => String(element?.code || '').trim()).filter(Boolean),
  ]
  for (const code of Object.keys(breakdown)) {
    if (!codes.includes(code)) {
      codes.push(code)
    }
  }

  const elements = codes.map((code) => {
    const fromEvaluation =
      evaluationElements.find((element) => String(element?.code || '').trim() === code) || {}
    const fromBreakdown = breakdown[code] || {}

    // `applicable: false` wins from either column — a criterion the AI skipped
    // must not read as a lost point.
    const applicable = fromEvaluation.applicable !== false && fromBreakdown.applicable !== false
    const verdictKey = String(fromEvaluation.verdict || fromBreakdown.verdict || '')
      .trim()
      .toLowerCase()
    const weight = readScore(fromBreakdown.weight ?? fromEvaluation.weight)
    const verdict = applicable ? ELEMENT_VERDICTS[verdictKey] || SKIPPED_VERDICT : SKIPPED_VERDICT

    return {
      code,
      label: code.toUpperCase(),
      groupKey: /^[a-d]/i.test(code) ? code[0].toLowerCase() : OTHER_GROUP.key,
      applicable,
      verdictKey: applicable ? verdictKey : 'skipped',
      verdict: { label: t(verdict.labelKey), color: verdict.color },
      weight,
      reasoning: String(fromEvaluation.reasoning || ''),
      quote: String(fromEvaluation.quote || '').trim(),
    }
  })

  const applicableElements = elements.filter((element) => element.applicable)

  const groups = [...ELEMENT_GROUPS, OTHER_GROUP]
    .map((group) => ({
      key: group.key,
      label: t(group.labelKey),
      elements: elements.filter((element) => element.groupKey === group.key),
    }))
    .filter((group) => group.elements.length > 0)

  const totalScore = readScore(review.totalScore)
  const maxScore = readScore(review.maxScore)

  const buckets = SCORE_BUCKETS.map((bucket) => ({
    key: bucket.key,
    label: t(bucket.labelKey),
    color: bucket.color,
    value: readScore(review[bucket.key]) ?? 0,
  }))

  const rawVerdict = normalizeVerdict(review.verdict)
  // `no_solution` arrives from two places: the AI (the photos held no solution)
  // and the scorer with id 0 (no photos were ever uploaded). Same verdict, very
  // different thing to tell the student — so re-word the id 0 one.
  const verdict =
    rawVerdict.key === 'no_solution' && Number(review.id ?? 0) === 0
      ? { ...rawVerdict, explanation: t('biologyReview.verdicts.no_solution.noPhotos') }
      : rawVerdict

  return {
    id: review.id ?? null,
    questionGroupId: Number(review.questionGroupId) || null,
    problemType: String(review.problemType || evaluation.problem_type || '').trim(),
    verdict,
    // Only a graded review shows the score split + criterion breakdown; a zero
    // condition shows verdict.explanation instead.
    isGraded: verdict.key === 'graded' || verdict.key === '',
    totalScore,
    maxScore,
    percent:
      totalScore !== null && maxScore
        ? Math.max(0, Math.min(100, Math.round((totalScore / maxScore) * 100)))
        : null,
    buckets,
    globalNotes: String(evaluation.global_notes || review.globalNotes || '').trim(),
    methodBlockVoided: review.methodBlockVoided === true,
    flags: FLAGS.filter((flag) => evaluation[flag] === true).map((flag) => ({
      key: flag,
      label: t(`biologyReview.flags.${flag}`),
    })),
    groups,
    counts: {
      total: applicableElements.length,
      full: applicableElements.filter((element) => element.verdictKey === 'full').length,
      partial: applicableElements.filter((element) => element.verdictKey === 'partial').length,
      zero: applicableElements.filter((element) => element.verdictKey === 'zero').length,
      skipped: elements.length - applicableElements.length,
    },
  }
}

export function normalizeBiologyReviews(rawReviews) {
  return (Array.isArray(rawReviews) ? rawReviews : []).map(normalizeBiologyReview)
}

// Question bank state that has to outlive one screen: each subject's practice
// setup — the topics ticked and the options chosen — so "Yangi mashq" at the
// end of a session comes back to the same setup rather than a reset one.
import { defineStore } from 'pinia'
import { reactive } from 'vue'

// The backend caps a session at this many questions.
export const MAX_SESSION_QUESTIONS = 200

export const emptySetup = () => ({
  skillIds: [],
  difficulties: [],
  // Where the session draws from: '' (every question) | 'Unanswered' |
  // 'Incorrect' | 'Saved' — see SOURCE_OPTIONS in bankLabels.js.
  source: '',
  type: '',
  language: '',
  mode: 'Practice',
  // null = every question that matches (the API's own meaning of no count).
  count: 10,
  secondsPerQuestion: 90,
  randomize: true,
})

// The setup's filters in the shape the API's BankQuestionFilterDto binds.
export function toApiFilter(subjectApi, setup) {
  return {
    subject: subjectApi,
    skillIds: setup.skillIds,
    difficulties: setup.difficulties,
    status: setup.source === 'Unanswered' || setup.source === 'Incorrect' ? setup.source : undefined,
    saved: setup.source === 'Saved' || undefined,
    type: setup.type || undefined,
    language: setup.language || undefined,
  }
}

export const useQuestionBankStore = defineStore('questionBank', () => {
  const setupBySubject = reactive({})

  function setupFor(subjectKey) {
    if (!setupBySubject[subjectKey]) setupBySubject[subjectKey] = emptySetup()
    return setupBySubject[subjectKey]
  }

  return { setupFor }
})

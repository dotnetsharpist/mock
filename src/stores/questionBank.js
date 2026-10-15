// Question bank state that has to outlive one screen:
//
//   filters  — each subject's filter set and page, so coming back from a
//              question lands on the same list rather than a reset one.
//   browse   — the list a question was opened from, so the player can step to
//              the previous / next question of that same filtered list. It is
//              mirrored to sessionStorage so a reload inside the player keeps it.
import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import { questionBankApi } from '@/utils/questionBankApi'

export const LIST_PAGE_SIZE = 20

const BROWSE_STORAGE_KEY = 'milliymock_bank_browse'

export const emptyFilters = () => ({
  skillIds: [],
  difficulties: [],
  status: '',
  type: '',
  language: '',
  saved: false,
  page: 1,
})

// The filter set in the shape the API's BankQuestionFilterDto binds.
export function toApiFilter(subjectApi, filters) {
  return {
    subject: subjectApi,
    skillIds: filters.skillIds,
    difficulties: filters.difficulties,
    status: filters.status || undefined,
    type: filters.type || undefined,
    language: filters.language || undefined,
    saved: filters.saved || undefined,
  }
}

function readStoredBrowse() {
  try {
    const raw = sessionStorage.getItem(BROWSE_STORAGE_KEY)
    const value = raw ? JSON.parse(raw) : null
    return value && Array.isArray(value.ids) ? value : null
  } catch {
    return null
  }
}

function storeBrowse(value) {
  try {
    if (value) sessionStorage.setItem(BROWSE_STORAGE_KEY, JSON.stringify(value))
    else sessionStorage.removeItem(BROWSE_STORAGE_KEY)
  } catch {
    // Private mode / blocked storage: navigation still works until a reload.
  }
}

export const useQuestionBankStore = defineStore('questionBank', () => {
  const filtersBySubject = reactive({})
  const browse = ref(readStoredBrowse())

  function filtersFor(subjectKey) {
    if (!filtersBySubject[subjectKey]) filtersBySubject[subjectKey] = emptyFilters()
    return filtersBySubject[subjectKey]
  }

  // Called when a question is opened from the list: remember that page of the
  // list as the stretch the player can walk through.
  function startBrowse({ subjectKey, apiFilter, page, ids, totalCount }) {
    browse.value = {
      subjectKey,
      apiFilter,
      ids: [...ids],
      firstPage: page,
      lastPage: page,
      totalCount,
      done: false,
    }
    storeBrowse(browse.value)
  }

  function browseFor(subjectKey) {
    return browse.value?.subjectKey === subjectKey ? browse.value : null
  }

  async function fetchPage(apiFilter, page) {
    return questionBankApi.questions({ ...apiFilter, page, pageSize: LIST_PAGE_SIZE })
  }

  // Extends the walk past its last loaded question. The list can shift under
  // the student while they answer — with "Yechilmagan" on, every answered
  // question drops out and the rest move up a page — so the same page is read
  // again and anything not seen yet is appended, before moving on to the next.
  async function loadMoreAfter() {
    const current = browse.value
    if (!current || current.done) return false
    const seen = new Set(current.ids)

    for (let page = current.lastPage, guard = 0; guard < 6; guard += 1) {
      const result = await fetchPage(current.apiFilter, page)
      const fresh = (result?.items ?? []).map((item) => item.id).filter((id) => !seen.has(id))
      current.totalCount = result?.totalCount ?? current.totalCount
      if (fresh.length) {
        current.ids.push(...fresh)
        current.lastPage = page
        storeBrowse(current)
        return true
      }
      if (page >= (result?.totalPages ?? 0)) break
      page += 1
    }

    current.done = true
    storeBrowse(current)
    return false
  }

  // The same, backwards: one page before the first one loaded.
  async function loadMoreBefore() {
    const current = browse.value
    if (!current || current.firstPage <= 1) return false
    const seen = new Set(current.ids)
    const page = current.firstPage - 1
    const result = await fetchPage(current.apiFilter, page)
    const fresh = (result?.items ?? []).map((item) => item.id).filter((id) => !seen.has(id))
    current.firstPage = page
    current.ids.unshift(...fresh)
    storeBrowse(current)
    return fresh.length > 0
  }

  return {
    filtersFor,
    browse,
    browseFor,
    startBrowse,
    loadMoreAfter,
    loadMoreBefore,
  }
})

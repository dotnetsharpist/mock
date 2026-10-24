import { createI18n } from 'vue-i18n'
import baseMessages from './messages'

// Each screen group keeps its strings in its own file under ./locales — one
// `{ uz: {...}, ru: {...} }` per file, under top-level keys no other file uses —
// so translating one area never means editing the same 1,500-line file as
// another. They are folded into the base messages here.
const localeModules = import.meta.glob('./locales/*.js', { eager: true, import: 'default' })

const messages = Object.values(localeModules).reduce(
  (merged, module) => {
    for (const lang of Object.keys(merged)) {
      for (const [key, value] of Object.entries(module[lang] || {})) {
        if (key in merged[lang]) {
          throw new Error(`i18n: "${lang}.${key}" is defined twice`)
        }
        merged[lang][key] = value
      }
    }
    return merged
  },
  { uz: { ...baseMessages.uz }, ru: { ...baseMessages.ru } },
)

const fallbackLocale = 'uz'

const getInitialLocale = () => {
  if (typeof window === 'undefined') {
    return fallbackLocale
  }

  const savedLocale = window.localStorage.getItem('locale')

  if (savedLocale && savedLocale in messages) {
    return savedLocale
  }

  return fallbackLocale
}

// Russian agrees the noun with the number ("1 секунду", "2 секунды",
// "5 секунд"), which vue-i18n's default one/other rule can't express. Messages
// that need it carry four forms — zero | one | few | many — in this order.
const russianPluralRule = (choice, choicesLength) => {
  if (choice === 0) return 0

  const isTeen = choice % 100 > 10 && choice % 100 < 20
  const lastDigit = choice % 10

  if (!isTeen && lastDigit === 1) return 1
  if (!isTeen && lastDigit >= 2 && lastDigit <= 4) return 2

  return choicesLength < 4 ? 2 : 3
}

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: getInitialLocale(),
  fallbackLocale,
  messages,
  pluralRules: {
    ru: russianPluralRule
  }
})

const setLocale = (nextLocale) => {
  if (!(nextLocale in messages)) {
    return
  }

  i18n.global.locale.value = nextLocale

  if (typeof document !== 'undefined') {
    document.documentElement.lang = nextLocale
  }

  if (typeof window !== 'undefined') {
    window.localStorage.setItem('locale', nextLocale)
  }
}

setLocale(i18n.global.locale.value)

// For code outside components (composables, utils, stores). Inside a computed
// or a render it is as reactive as `t` from useI18n — it reads the same locale.
const t = (...args) => i18n.global.t(...args)

// The BCP 47 tag for Intl / toLocale* calls.
const intlLocale = () => (i18n.global.locale.value === 'ru' ? 'ru-RU' : 'uz-UZ')

export { i18n, setLocale, t, intlLocale }

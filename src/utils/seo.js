// Client-side SEO head manager.
//
// This SPA serves a single index.html for every route, so the document <head>
// must be updated in JS as the user navigates. `applySeo` is wired into the
// router's `afterEach` hook (see src/router/index.js) and rewrites the title,
// description, canonical link and Open Graph / Twitter tags from each route's
// `meta.seo`. Tags are found-or-created so repeated navigations never duplicate
// them. The defaults below mirror the static tags baked into index.html.
//
// Titles and descriptions are i18n keys (`titleKey`, `descriptionKey`, under
// `seo` in i18n/locales/marketing.js), so the head follows the UZ/RU switch.
// Switching language does not navigate, so the watch at the bottom re-applies
// the current route's head when the locale changes.
import { watch } from 'vue'
import { i18n, t } from '@/i18n'

export const SITE = {
  name: 'MilliyMock',
  url: 'https://milliymock.uz',
  defaultTitleKey: 'seo.default.title',
  defaultDescriptionKey: 'seo.default.description',
  defaultImage: 'https://milliymock.uz/og-image.jpg',
}

// Open Graph wants language_TERRITORY, not the bare BCP 47 code.
const OG_LOCALES = { uz: 'uz_UZ', ru: 'ru_RU' }

// What the last applySeo call was given, for the locale watch below.
let lastApplied = null

// Find-or-create a <meta> tag keyed by its name/property attribute, then set
// its content. `attr` is 'name' (standard meta) or 'property' (Open Graph).
function upsertMeta(attr, key, content) {
  if (!content) return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

// Find-or-create a <link rel="..."> tag, then set its href.
function upsertLink(rel, href) {
  if (!href) return
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

// Apply per-route SEO. `seo` is the route's `meta.seo` ({ titleKey,
// descriptionKey, robots, image }); `route` is the resolved route (for the
// canonical URL).
export function applySeo(seo = {}, route) {
  lastApplied = { seo, route }

  const title = seo.titleKey ? `${t(seo.titleKey)} – ${SITE.name}` : t(SITE.defaultTitleKey)
  const description = seo.descriptionKey ? t(seo.descriptionKey) : t(SITE.defaultDescriptionKey)
  const image = seo.image || SITE.defaultImage
  const robots = seo.robots || 'index, follow'
  const path = route?.path === '/' ? '/' : route?.path || '/'
  const canonical = `${SITE.url}${path}`

  document.title = title

  upsertMeta('name', 'description', description)
  upsertMeta('name', 'robots', robots)
  upsertLink('canonical', canonical)

  // Open Graph
  upsertMeta('property', 'og:title', title)
  upsertMeta('property', 'og:description', description)
  upsertMeta('property', 'og:url', canonical)
  upsertMeta('property', 'og:image', image)
  upsertMeta('property', 'og:type', 'website')
  upsertMeta('property', 'og:locale', OG_LOCALES[i18n.global.locale.value] || OG_LOCALES.uz)

  // Twitter
  upsertMeta('name', 'twitter:card', 'summary_large_image')
  upsertMeta('name', 'twitter:title', title)
  upsertMeta('name', 'twitter:description', description)
  upsertMeta('name', 'twitter:image', image)
}

watch(i18n.global.locale, () => {
  if (lastApplied) applySeo(lastApplied.seo, lastApplied.route)
})

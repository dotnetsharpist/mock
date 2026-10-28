<script setup>
// /oferta and /maxfiylik — the public offer and the privacy policy.
//
// GET /payment/offer hands these two URLs to the payment dialog (offerUrl,
// privacyUrl), whose "Men … qabul qilaman" checkbox opens them in a new tab.
// The text lives in src/content/legal/*.md. Its "Versiya" line must match the
// backend's offer `version`: the server records that version as the one the
// student accepted, so a page edited without a new version would be a text
// nobody agreed to.
//
// For the same reason the documents are not translated: the Uzbek text is the
// one the student accepts. In Russian the page says so above it, and the
// article keeps lang="uz" so a screen reader still reads it as Uzbek.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import MarkdownIt from 'markdown-it'
import oferta from '@/content/legal/oferta.md?raw'
import maxfiylik from '@/content/legal/maxfiylik.md?raw'

const props = defineProps({
  doc: { type: String, required: true },
})

const { t, locale } = useI18n()

const DOCS = { oferta, maxfiylik }

// Our own text, but raw HTML stays off anyway.
const md = new MarkdownIt({ html: false, linkify: false, typographer: false })

// The two documents link to each other and to /narxlar in place; anything off
// the site (Telegram, Google, mail) opens in a new tab.
const defaultLinkOpen =
  md.renderer.rules.link_open ?? ((tokens, index, options, env, self) => self.renderToken(tokens, index, options))
md.renderer.rules.link_open = (tokens, index, options, env, self) => {
  const href = tokens[index].attrGet('href') || ''
  if (/^https?:/i.test(href)) {
    tokens[index].attrSet('target', '_blank')
    tokens[index].attrSet('rel', 'noopener noreferrer')
  }
  return defaultLinkOpen(tokens, index, options, env, self)
}

// Wide tables scroll inside their own box on a phone, not the whole page.
md.renderer.rules.table_open = () => '<div class="legal-table"><table>\n'
md.renderer.rules.table_close = () => '</table></div>\n'

const html = computed(() => md.render(DOCS[props.doc] || ''))
</script>

<template>
  <main class="mx-auto max-w-3xl px-4 pb-24 pt-16 sm:px-6 sm:pt-20 lg:px-8">
    <p
      v-if="locale !== 'uz'"
      class="mb-8 rounded-[14px] border border-hairline bg-panel px-4 py-3 text-[14px] leading-[1.6] text-muted"
    >
      {{ t('legalPage.uzbekOnly') }}
    </p>
    <!-- eslint-disable-next-line vue/no-v-html -- our own Markdown, raw HTML disabled -->
    <article class="legal" lang="uz" v-html="html"></article>
  </main>
</template>

<style scoped>
.legal {
  color: var(--color-ink);
  font-size: 15px;
  line-height: 1.7;
}

.legal :deep(h1) {
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

/* The "Versiya: …" line right under the title. */
.legal :deep(h1 + p) {
  margin-top: 0.5rem;
  font-size: 14px;
  color: var(--color-muted);
}

.legal :deep(h2) {
  margin-top: 2.5rem;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.01em;
}

.legal :deep(p),
.legal :deep(ul),
.legal :deep(ol),
.legal :deep(.legal-table) {
  margin-top: 0.875rem;
}

.legal :deep(ul) {
  list-style: disc;
  padding-left: 1.25rem;
}

.legal :deep(li + li) {
  margin-top: 0.375rem;
}

.legal :deep(a) {
  text-decoration: underline;
  text-decoration-color: var(--color-hairline-strong);
  text-underline-offset: 3px;
}

.legal :deep(a:hover) {
  text-decoration-color: var(--color-ink);
}

.legal :deep(.legal-table) {
  overflow-x: auto;
  border: 1px solid var(--color-hairline);
  border-radius: 14px;
}

.legal :deep(table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  line-height: 1.55;
}

.legal :deep(th) {
  background: var(--color-panel);
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
}

.legal :deep(th),
.legal :deep(td) {
  padding: 0.625rem 0.875rem;
  vertical-align: top;
}

.legal :deep(td) {
  min-width: 8rem;
  border-top: 1px solid var(--color-hairline);
}
</style>

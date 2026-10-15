<script setup>
// Renders question bank text — Markdown, LaTeX and images (utils/bankMarkdown.js).
// `inline` is for one-line contexts (list previews, options): no paragraphs,
// formulas stay in the run of text.
import { computed } from 'vue'
import 'katex/dist/katex.min.css'
import { renderBankMarkdown } from '@/utils/bankMarkdown'

const props = defineProps({
  text: { type: String, default: '' },
  inline: { type: Boolean, default: false },
  tag: { type: String, default: '' },
})

const html = computed(() => renderBankMarkdown(props.text, { inline: props.inline }))
const element = computed(() => props.tag || (props.inline ? 'span' : 'div'))
</script>

<template>
  <!-- v-html is safe here: markdown-it runs with html:false. -->
  <component :is="element" class="bank-rich" :class="{ 'bank-rich--inline': inline }" v-html="html" />
</template>

<style>
/* Not scoped: v-html content never carries the scope attribute. Every rule is
   anchored on .bank-rich so nothing leaks into the rest of the page. */
.bank-rich {
  overflow-wrap: anywhere;
}
.bank-rich > * + * {
  margin-top: 0.8em;
}
.bank-rich strong {
  font-weight: 700;
}
.bank-rich em {
  font-style: italic;
}
.bank-rich ul,
.bank-rich ol {
  padding-left: 1.4em;
}
.bank-rich ul {
  list-style: disc;
}
.bank-rich ol {
  list-style: decimal;
}
.bank-rich li + li {
  margin-top: 0.3em;
}
.bank-rich h1,
.bank-rich h2,
.bank-rich h3 {
  font-weight: 700;
  line-height: 1.35;
}
.bank-rich blockquote {
  border-left: 3px solid var(--color-app-border);
  padding-left: 0.9em;
  color: var(--color-app-muted);
}
.bank-rich code {
  border-radius: 6px;
  background: var(--color-app-tile);
  padding: 0.1em 0.35em;
  font-size: 0.92em;
}
.bank-rich a {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.bank-rich hr {
  border: 0;
  border-top: 1px solid var(--color-app-border);
}
.bank-rich img {
  display: block;
  max-width: 100%;
  max-height: 420px;
  margin-inline: auto;
  border-radius: 12px;
  object-fit: contain;
}
.bank-rich table {
  display: block;
  max-width: 100%;
  overflow-x: auto;
  border-collapse: collapse;
  font-size: 0.95em;
}
.bank-rich th,
.bank-rich td {
  border: 1px solid var(--color-app-border);
  padding: 0.4em 0.75em;
  text-align: left;
}
.bank-rich th {
  background: var(--color-app-sunken);
  font-weight: 600;
}
/* Wide display formulas scroll inside themselves instead of widening the page. */
.bank-rich .katex-display {
  margin: 0.6em 0;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0.15em 0;
}
.bank-rich--inline img {
  display: none;
}
</style>

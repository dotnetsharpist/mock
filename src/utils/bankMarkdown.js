// Question bank text is Markdown with LaTeX between `$…$` (inline) and `$$…$$`
// (display), and images uploaded through the admin API as `images/FILE_….png`.
// This is a separate renderer from components/test/TestInlineMathText.vue on
// purpose: that one repairs the mock tests' legacy, partly mangled text with
// heuristics, while bank text is authored clean and only needs to be rendered.
//
// Raw HTML is off (markdown-it escapes it), so question text cannot inject
// markup; KaTeX runs with its default `trust: false`.
import MarkdownIt from 'markdown-it'
import katex from 'katex'
import { getTestApiBaseUrl } from '@/utils/api'

const md = new MarkdownIt({ html: false, linkify: false, breaks: true, typographer: false })

// Relative image paths are served by the API host, next to /api.
const resolveAssetUrl = (src) => {
  if (!src || /^(https?:|data:)/i.test(src)) return src
  try {
    return `${new URL(getTestApiBaseUrl()).origin}/${src.replace(/^\/+/, '')}`
  } catch {
    return src
  }
}

md.renderer.rules.image = (tokens, index, options, env, self) => {
  const token = tokens[index]
  token.attrSet('src', resolveAssetUrl(token.attrGet('src')))
  token.attrSet('loading', 'lazy')
  // A formula in alt text would be swapped for KaTeX markup inside the
  // attribute, so its marker is dropped here instead.
  const alt = self.renderInlineAsText(token.children ?? [], options, env)
  token.attrSet('alt', alt.replace(/\d+/g, ''))
  return self.renderToken(tokens, index, options)
}

const defaultLinkOpen = md.renderer.rules.link_open ?? ((tokens, index, options, env, self) => self.renderToken(tokens, index, options))
md.renderer.rules.link_open = (tokens, index, options, env, self) => {
  tokens[index].attrSet('target', '_blank')
  tokens[index].attrSet('rel', 'noopener noreferrer')
  return defaultLinkOpen(tokens, index, options, env, self)
}

// Private-use characters mark where a formula was lifted out. markdown-it
// leaves them alone, so emphasis and escapes inside a formula never reach it.
const OPEN = ''
const CLOSE = ''

// `$$…$$` first, then `$…$` on one line. `\$` is a literal dollar and is left
// for markdown-it, which unescapes it.
function extractMath(source) {
  const formulas = []
  let text = ''
  let i = 0
  while (i < source.length) {
    const char = source[i]
    if (char === '\\' && source[i + 1] === '$') {
      text += '\\$'
      i += 2
      continue
    }
    if (char === '$') {
      const display = source[i + 1] === '$'
      const start = i + (display ? 2 : 1)
      let end = start
      while (end < source.length) {
        if (source[end] === '\\') {
          end += 2
          continue
        }
        if (!display && source[end] === '\n') break
        if (source[end] === '$' && (!display || source[end + 1] === '$')) break
        end += 1
      }
      const closed = end < source.length && source[end] === '$'
      const tex = source.slice(start, end)
      if (closed && tex.trim()) {
        formulas.push({ tex, display })
        text += `${OPEN}${formulas.length - 1}${CLOSE}`
        i = end + (display ? 2 : 1)
        continue
      }
    }
    text += char
    i += 1
  }
  return { text, formulas }
}

function renderFormula({ tex, display }) {
  return katex.renderToString(tex, {
    displayMode: display,
    throwOnError: false,
    strict: 'ignore',
    output: 'html',
  })
}

const PLACEHOLDER = new RegExp(`${OPEN}(\\d+)${CLOSE}`, 'g')

export function renderBankMarkdown(source, { inline = false } = {}) {
  const { text, formulas } = extractMath(String(source ?? ''))
  const html = inline ? md.renderInline(text) : md.render(text)
  // On one line (a list preview, an option) a display formula would break the
  // line and tower over its neighbours, so it is set inline there.
  return html.replace(PLACEHOLDER, (_, index) => {
    const formula = formulas[Number(index)]
    return renderFormula(inline ? { ...formula, display: false } : formula)
  })
}

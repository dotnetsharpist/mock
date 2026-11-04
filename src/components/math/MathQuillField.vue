<script setup>
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import 'mathquill/build/mathquill.css'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  compact: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'focus'])

let mathQuillLoaderPromise = null

const loadMathQuill = async () => {
  if (window.MathQuill?.getInterface) {
    return window.MathQuill.getInterface(2)
  }

  if (!mathQuillLoaderPromise) {
    mathQuillLoaderPromise = (async () => {
      if (!window.jQuery) {
        await import('mathquill/formula/jquery.min.js')

        if (!window.jQuery) {
          const jqueryModule = await import('mathquill/node_modules/jquery/dist/jquery.js')
          const jqueryInstance = jqueryModule.default || window.jQuery || window.$

          if (jqueryInstance) {
            window.jQuery = jqueryInstance
            window.$ = jqueryInstance
          }
        }
      }

      await import('mathquill/build/mathquill.js')

      if (!window.MathQuill?.getInterface) {
        throw new Error('MathQuill interface is unavailable after local import')
      }

      return window.MathQuill.getInterface(2)
    })()
  }

  return mathQuillLoaderPromise
}

const mathFieldHostRef = ref(null)
// shallowRef, NOT ref: a plain ref() makes the MathQuill field object deeply
// reactive, so every call made through it (on-screen keyboard, clear, …)
// runs on Vue Proxies and stores Proxy objects as `parent`/`[L]`/`[R]` links
// in MathQuill's node tree. MathQuill's own keyboard path then works on the raw
// objects, its identity checks (`leftward.parent === parent`) fail with
// "prayer failed", and a physical Backspace removes the glyph from the DOM but
// not from the tree — the field looks stuck until Tozalash.
const mathFieldRef = shallowRef(null)
const currentLatex = ref('')
const isFocused = ref(false)
const hasLoadError = ref(false)
const isApplyingExternalUpdate = ref(false)

let removeFieldListeners = null
let isUnmounted = false

// MathQuill expects `\text{°}` for the degree symbol. Map every degree
// shorthand we see in the wild to that canonical form so MathQuill renders a
// real degree mark instead of leaving raw characters / braces visible.
//
// Inside a superscript group `^{…}` we also treat a *standalone* `o` (Latin)
// or `о` (Cyrillic) as a degree, because Uzbek/Russian math text writes
// angles as `105^{o}`. This is scoped to braces with nothing but the o, so
// real superscripted variables like `x^{o+1}` are left untouched. Outside a
// superscript we never reinterpret a lone `o`.
const normalizeLatexInput = (value) => {
  // `\text{…}` groups — notably the `\text{°}` this function produces, which
  // is also what MathQuill emits for a degree mark — are set aside before the
  // rewrites and restored after, so the function is idempotent. Without this,
  // the glyph rule re-wrapped `\text{°}` into `\text{\text{°}}` on every sync;
  // the watcher then saw a value that differed from the field, re-rendered it,
  // and MathQuill wiped the whole answer because it can't parse nested \text.
  const textGroups = []
  const protectedValue = String(value || '').replace(/\\text\{[^{}]*\}/g, (group) => {
    textGroups.push(group)
    return `\u0001${textGroups.length - 1}\u0001`
  })

  // The rewrites emit a \u0002 stand-in rather than `\text{°}` itself, so the
  // bare-glyph rule can't re-wrap the `°` of a mark produced one line earlier.
  return protectedValue
    // A bare brace group right after a number is the API's shorthand for a
    // degree mark — `94{o}` means 94°. Convert it BEFORE the other patterns
    // so the `o` inside doesn't get reinterpreted as a variable.
    .replace(/(\d)\s*\{\s*(?:∘|°|º|˚|ᵒ|o|о|\\circ)\s*\}/g, '$1^{\u0002}')
    .replace(/\^\s*\{\s*(?:∘|°|º|˚|ᵒ|o|о|\\circ)\s*\}/g, '^{\u0002}')
    .replace(/\^\s*(?:∘|°|º|˚|ᵒ|\\circ)\b/g, '^{\u0002}')
    .replace(/(\d)\s*(?:∘|°|º|˚|ᵒ)/g, '$1^{\u0002}')
    .replace(/\\circ\b/g, '\u0002')
    .replace(/[∘°º˚ᵒ]/g, '\u0002')
    .replace(/\u0002/g, '\\text{°}')
    .replace(/\u0001(\d+)\u0001/g, (_, index) => textGroups[Number(index)])
    .trim()
}

const extractIncomingValue = (value) => {
  if (typeof value !== 'string') {
    return ''
  }

  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return ''
  }

  if (!normalizedValue.includes('<') || typeof document === 'undefined') {
    return normalizeLatexInput(normalizedValue)
  }

  const container = document.createElement('div')
  container.innerHTML = normalizedValue

  container.querySelectorAll('[data-type="inline-math"]').forEach((node) => {
    const latexValue =
      node.getAttribute('data-latex') ||
      node.getAttribute('data-math-latex') ||
      node.getAttribute('data-math') ||
      node.textContent ||
      ''

    node.replaceWith(document.createTextNode(` ${latexValue} `))
  })

  return normalizeLatexInput((container.textContent || '').replace(/\s+/g, ' ').trim())
}

currentLatex.value = extractIncomingValue(props.modelValue)

// Last LaTeX we read back cleanly from MathQuill. Used to recover if a later
// edit corrupts MathQuill's internal tree (see recover()).
const lastGoodLatex = ref('')

const syncFromMathField = () => {
  const mathField = mathFieldRef.value

  if (!mathField) {
    return
  }

  const nextLatex = normalizeLatexInput(mathField.latex())
  currentLatex.value = nextLatex
  lastGoodLatex.value = nextLatex

  if (!isApplyingExternalUpdate.value) {
    emit('update:modelValue', nextLatex)
  }
}

// Safety net for MathQuill's internal "prayer failed" assertions. The one
// known cause (Vue Proxies leaking into MathQuill's tree via a deep ref — see
// mathFieldRef) is fixed, so these should no longer fire; if one does, we must
// not "recover" by reverting to a previous value, because that silently undoes
// valid keystrokes. We just swallow the error so it can't crash the handler;
// the Tozalash/clear button is the escape hatch if the field ever gets stuck.
const safeOp = (fn) => {
  try {
    fn()
  } catch (error) {
    console.warn('[MathQuillField] ignored a MathQuill error:', error)
  }
}

// Reset the field to empty. Always works (latex('') rebuilds the tree from
// scratch), so it doubles as the escape hatch for a stuck field.
const clear = () => {
  const mathField = mathFieldRef.value
  if (!mathField || props.disabled) {
    return
  }
  isApplyingExternalUpdate.value = true
  try {
    mathField.latex('')
  } catch {
    /* ignore */
  }
  isApplyingExternalUpdate.value = false
  lastGoodLatex.value = ''
  currentLatex.value = ''
  emit('update:modelValue', '')
  try {
    mathField.focus()
  } catch {
    /* ignore */
  }
}

const syncMathFieldValue = (value) => {
  const nextLatex = extractIncomingValue(value)
  currentLatex.value = nextLatex

  if (!mathFieldRef.value) {
    return
  }

  if (normalizeLatexInput(mathFieldRef.value.latex()) === nextLatex) {
    return
  }

  isApplyingExternalUpdate.value = true
  mathFieldRef.value.latex(nextLatex)
  isApplyingExternalUpdate.value = false
}

const focus = () => {
  mathFieldRef.value?.focus()
}

const isInsideSystemBlock = () => normalizeLatexInput(mathFieldRef.value?.latex() || '').includes('\\left\\{')

const handleNativeKeyDown = (event) => {
  const mathField = mathFieldRef.value

  if (!mathField) {
    return
  }

  const rootElement = typeof mathField.el === 'function' ? mathField.el() : mathFieldHostRef.value
  const isMathFieldFocused = rootElement?.contains(document.activeElement)

  if (!isMathFieldFocused) {
    return
  }

  if (event.key === '/' && isInsideSystemBlock()) {
    event.preventDefault()
    event.stopPropagation()
    mathField.write('/')
    return
  }

  if ((event.key === 'Enter' || event.keyCode === 13) && event.shiftKey && isInsideSystemBlock()) {
    event.preventDefault()
    event.stopPropagation()
    mathField.cmd('/')
    return
  }

  // Space advances the cursor out of the current sub-block (root, exponent,
  // fraction…) instead of injecting a "\ " space inside it. Injecting a space
  // used to trap the cursor inside the construct (e.g. typing inside a root,
  // pressing space, then being unable to type after it — producing malformed
  // output like \sqrt{3\ }).
  if (event.key === ' ' || event.code === 'Space') {
    event.preventDefault()
    safeOp(() => mathField.keystroke('Right'))
    return
  }

  if (event.key === '{') {
    event.preventDefault()
    mathField.write('\\left\\{\\right\\}')
    mathField.keystroke('Left')
  }
}

// MathQuill 0.10.1 only inserts typed characters when a `keypress` event fires
// (saneKeyboardEvents arms text insertion from onKeypress only). Android soft
// keyboards (Gboard, etc.) don't fire `keypress` for typing — they fire
// `keydown` with keyCode 229 and deliver text through `input`/composition
// events — so the character lands in MathQuill's hidden <textarea> but is never
// read out, and nothing appears. iOS/desktop fire real `keypress` events, so
// they work. This bridge reads those dropped characters and feeds them through
// `typedText()` (the same path the on-screen keyboard uses) — but only when no
// `keypress` handled the keystroke, so it never double-inserts where MathQuill's
// native path already works.
const INSERTING_INPUT_TYPES = new Set([
  'insertText',
  'insertReplacementText',
  'insertCompositionText',
])

// Android soft keyboards (Gboard, Samsung, etc.) report Backspace/Delete as an
// `input` event carrying one of these inputTypes while the keydown is the IME
// placeholder (keyCode 229) — so MathQuill's keydown path never sees a real
// Backspace and the deletion is silently dropped. We translate these into
// MathQuill keystrokes. iOS/desktop send a real keyCode 8/46 keydown, which
// MathQuill already handles, so the bridge stands down for those (see
// `nativeDeleteFromKeydown`).
const DELETING_BACKWARD_INPUT_TYPES = new Set([
  'deleteContentBackward',
  'deleteWordBackward',
  'deleteSoftLineBackward',
  'deleteHardLineBackward',
  'deleteContent',
])
const DELETING_FORWARD_INPUT_TYPES = new Set([
  'deleteContentForward',
  'deleteWordForward',
  'deleteSoftLineForward',
  'deleteHardLineForward',
])

const attachAndroidInputBridge = (rootElement) => {
  const textarea = rootElement?.querySelector?.('textarea')

  if (!textarea) {
    return null
  }

  // Whether a `keypress` already armed MathQuill's own insertion for the
  // current keystroke. Reset on every keydown; set on keypress.
  let keypressHandledInput = false
  // Whether the current keydown was a real Backspace/Delete (keyCode 8/46, as
  // sent by desktop and iOS) that MathQuill's own path will handle — so our
  // delete bridge must NOT fire for it and double-delete.
  let nativeDeleteFromKeydown = false
  // Whether this keystroke's delete was already bridged from `beforeinput`, so
  // the later `input` event (if any) doesn't delete a second time.
  let deleteBridgedInBeforeInput = false
  // True between compositionstart/compositionend (swipe, autocorrect,
  // suggestion strip) — we wait for the final committed text instead of
  // inserting partial composition buffers.
  let isComposing = false

  const handleKeydown = (event) => {
    keypressHandledInput = false
    deleteBridgedInBeforeInput = false
    nativeDeleteFromKeydown =
      event.keyCode === 8 ||
      event.keyCode === 46 ||
      event.key === 'Backspace' ||
      event.key === 'Delete'
  }

  // Delete one unit in MathQuill (Backspace = back, Del = forward). Translates
  // Android's delete `input` events into the keystroke MathQuill understands.
  const deleteOneUnit = (key) => {
    const mathField = mathFieldRef.value

    if (!mathField || props.disabled) {
      return
    }

    // The textarea may mirror a MathQuill selection (placed there for copy);
    // clear it so the delete doesn't leave a stray buffer that a later `input`
    // re-inserts, then delete inside MathQuill.
    textarea.value = ''
    safeOp(() => mathField.keystroke(key))
  }
  const handleKeypress = () => {
    keypressHandledInput = true
  }
  const handleCompositionStart = () => {
    isComposing = true
  }

  const flushTypedText = () => {
    const mathField = mathFieldRef.value

    if (!mathField || props.disabled) {
      return
    }

    // A selection in the textarea means its contents mirror selected math (put
    // there by MathQuill for copy), not freshly typed text — don't insert it.
    if (textarea.selectionStart !== textarea.selectionEnd) {
      return
    }

    const text = textarea.value

    if (!text) {
      return
    }

    // Clear first so any trailing `input` (e.g. the event browsers fire right
    // after compositionend) sees an empty textarea and no-ops.
    textarea.value = ''
    safeOp(() => mathField.typedText(text))
  }

  // Android delete handling lives here, on `beforeinput`, NOT on `input`. After
  // every insert we clear the hidden textarea, so when the cursor sits in an
  // empty spot — e.g. right after inserting a √ or fraction from the on-screen
  // keyboard — a soft-keyboard Backspace changes nothing in the textarea and
  // fires NO `input` event, only `beforeinput`. That's why deleting a freshly
  // inserted symbol felt impossible. `beforeinput` fires regardless of textarea
  // contents, so we bridge the delete here and cancel the textarea's own edit.
  const handleBeforeInput = (event) => {
    const inputType = event.inputType
    const isBackward = DELETING_BACKWARD_INPUT_TYPES.has(inputType)
    const isForward = DELETING_FORWARD_INPUT_TYPES.has(inputType)

    if (!isBackward && !isForward) {
      // Insertions and everything else are handled on `input`.
      return
    }

    // Let an in-progress IME composition manage its own edits.
    if (isComposing || event.isComposing) {
      return
    }

    // A real Backspace/Delete keydown (desktop, iOS) is already handled by
    // MathQuill's own keystroke path — don't delete twice.
    if (nativeDeleteFromKeydown) {
      return
    }

    if (event.cancelable) {
      event.preventDefault()
    }

    deleteBridgedInBeforeInput = true
    deleteOneUnit(isForward ? 'Del' : 'Backspace')
  }

  const handleInput = (event) => {
    // Desktop / iOS: a keypress already armed MathQuill's own insertion — let
    // it run so the character isn't inserted twice.
    if (keypressHandledInput) {
      return
    }

    // Mid-composition: wait for the committed word on compositionend.
    if (isComposing || event.isComposing) {
      return
    }

    const inputType = event.inputType

    // Deletes are normally bridged on `beforeinput` above. If one reaches here,
    // only act when neither `beforeinput` nor a native keydown already handled
    // it — a fallback for browsers that don't fire a usable beforeinput — so we
    // never double-delete.
    if (
      inputType &&
      (DELETING_BACKWARD_INPUT_TYPES.has(inputType) || DELETING_FORWARD_INPUT_TYPES.has(inputType))
    ) {
      if (deleteBridgedInBeforeInput || nativeDeleteFromKeydown) {
        return
      }
      deleteOneUnit(DELETING_FORWARD_INPUT_TYPES.has(inputType) ? 'Del' : 'Backspace')
      return
    }

    // Only bridge real text insertion. Paste has its own MathQuill handler.
    if (inputType && !INSERTING_INPUT_TYPES.has(inputType)) {
      return
    }

    flushTypedText()
  }

  const handleCompositionEnd = () => {
    isComposing = false

    // If a keypress drove this composition (desktop dead keys), MathQuill
    // already inserted it — don't duplicate.
    if (keypressHandledInput) {
      return
    }

    flushTypedText()
  }

  textarea.addEventListener('keydown', handleKeydown)
  textarea.addEventListener('keypress', handleKeypress)
  textarea.addEventListener('beforeinput', handleBeforeInput)
  textarea.addEventListener('input', handleInput)
  textarea.addEventListener('compositionstart', handleCompositionStart)
  textarea.addEventListener('compositionend', handleCompositionEnd)

  return () => {
    textarea.removeEventListener('keydown', handleKeydown)
    textarea.removeEventListener('keypress', handleKeypress)
    textarea.removeEventListener('beforeinput', handleBeforeInput)
    textarea.removeEventListener('input', handleInput)
    textarea.removeEventListener('compositionstart', handleCompositionStart)
    textarea.removeEventListener('compositionend', handleCompositionEnd)
  }
}

const attachFieldListeners = () => {
  const mathField = mathFieldRef.value
  const rootElement = typeof mathField?.el === 'function' ? mathField.el() : mathFieldHostRef.value

  if (!rootElement) {
    return
  }

  const handleFocusIn = () => {
    isFocused.value = true
    emit('focus')
  }

  const handleFocusOut = () => {
    window.setTimeout(() => {
      const nextActiveElement = document.activeElement
      isFocused.value = Boolean(rootElement.contains(nextActiveElement))
    }, 0)
  }

  rootElement.addEventListener('focusin', handleFocusIn)
  rootElement.addEventListener('focusout', handleFocusOut)
  document.addEventListener('keydown', handleNativeKeyDown, true)

  // Recover Android soft-keyboard typing, which MathQuill 0.10.1 can't capture
  // on its own (see attachAndroidInputBridge).
  const detachInputBridge = attachAndroidInputBridge(rootElement)

  removeFieldListeners = () => {
    rootElement.removeEventListener('focusin', handleFocusIn)
    rootElement.removeEventListener('focusout', handleFocusOut)
    document.removeEventListener('keydown', handleNativeKeyDown, true)
    detachInputBridge?.()
  }
}

const initializeMathField = async () => {
  try {
    const MQ = await loadMathQuill()

    if (isUnmounted || !mathFieldHostRef.value) {
      return
    }

    const mathField = MQ.MathField(mathFieldHostRef.value, {
      spaceBehavesLikeTab: false,
      leftRightIntoCmdGoes: 'up',
      restrictMismatchedBrackets: false,
      supSubsRequireOperand: false,
      charsThatBreakOutOfSupSub: '+-=<>',
      autoCommands: 'theta sqrt nthroot',
      autoOperatorNames: 'dummyop',
      handlers: {
        edit: () => {
          syncFromMathField()
        },
      },
    })

    mathFieldRef.value = mathField
    isApplyingExternalUpdate.value = true
    mathField.latex(currentLatex.value)
    syncFromMathField()
    isApplyingExternalUpdate.value = false
    attachFieldListeners()
  } catch (error) {
    console.error('[MathQuillField] Failed to initialize MathQuill:', error)
    hasLoadError.value = true
  }
}

const cmd = (latexCmd) => {
  const mathField = mathFieldRef.value
  if (!mathField || props.disabled) return
  mathField.focus()
  safeOp(() => mathField.cmd(latexCmd))
}

const write = (latex) => {
  const mathField = mathFieldRef.value
  if (!mathField || props.disabled) return
  mathField.focus()
  safeOp(() => mathField.write(latex))
}

const typedText = (text) => {
  const mathField = mathFieldRef.value
  if (!mathField || props.disabled) return
  mathField.focus()
  safeOp(() => mathField.typedText(text))
}

const keystroke = (key) => {
  const mathField = mathFieldRef.value
  if (!mathField || props.disabled) return
  mathField.focus()
  safeOp(() => mathField.keystroke(key))
}

const getLatex = () => mathFieldRef.value?.latex() ?? ''

watch(
  () => props.modelValue,
  (value) => {
    if (isApplyingExternalUpdate.value) {
      return
    }

    syncMathFieldValue(value)
  },
)

onMounted(() => {
  initializeMathField()
})

onBeforeUnmount(() => {
  isUnmounted = true
  removeFieldListeners?.()

  if (mathFieldRef.value?.revert) {
    mathFieldRef.value.revert()
  }
})

defineExpose({
  cmd,
  write,
  typedText,
  keystroke,
  focus,
  getLatex,
  clear,
})
</script>

<template>
  <div class="relative" @focus.capture="emit('focus')">
    <div
      class="mq-shell relative rounded-2xl border border-[#e0ddd7] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-all duration-150 hover:border-[#bcb7ad]"
      :class="[
        disabled ? 'pointer-events-none opacity-60' : '',
        isFocused ? 'border-[#1a1814] shadow-[0_4px_14px_rgba(15,23,42,0.08)]' : '',
        (!currentLatex && isFocused) ? 'mq-hide-native-caret' : '',
      ]"
      @click="focus"
    >
      <!-- A clear blinking caret, shown only when THIS field is focused and
           empty (i.e. the user clicked into it), so just the active field shows
           a cursor — never every empty field at once. MathQuill's own thin
           caret is hidden in that state so there's exactly one cursor; once the
           user types, this hides and MathQuill's caret takes over. -->
      <span
        v-if="!currentLatex && isFocused"
        class="mq-fake-caret"
        aria-hidden="true"
      ></span>

      <span
        v-if="!currentLatex && placeholder"
        class="pointer-events-none absolute inset-y-0 flex items-center text-[15px] font-normal text-[#9b958c]"
        :class="isFocused ? 'left-[34px]' : 'left-5'"
      >
        {{ placeholder }}
      </span>

      <!-- IMPORTANT: this element is owned by MathQuill, which adds its own
           classes (mq-editable-field, mq-math-mode, mq-focused) directly to the
           DOM. Do NOT put a *changing* :class binding here — Vue would re-patch
           the class attribute on every keystroke/focus change and clobber
           MathQuill's classes, breaking all of MathQuill's CSS. `compact` is a
           fixed prop, so its binding never changes and is safe. State-dependent
           classes (e.g. mq-hide-native-caret) live on the shell instead. -->
      <div
        ref="mathFieldHostRef"
        class="mq-host mq-field-root"
        :class="compact ? 'mq-compact' : ''"
      ></div>

      <span
        v-if="hasLoadError"
        class="absolute left-5 top-1/2 -translate-y-1/2 text-[11px] uppercase tracking-[0.12em] text-[#b91c1c]"
      >
        Math editor failed to load
      </span>
    </div>
  </div>
</template>

<style scoped>
.mq-shell {
  cursor: text;
}

/* Custom typing indicator shown while the field is empty. Sits at the field's
   text start (matches the 24px content padding) and blinks like a native caret. */
.mq-fake-caret {
  position: absolute;
  left: 24px;
  top: 50%;
  transform: translateY(-50%);
  width: 2px;
  height: 22px;
  background: #1a1814;
  border-radius: 1px;
  pointer-events: none;
  z-index: 2;
  animation: mq-caret-blink 1.06s steps(1, end) infinite;
}

@keyframes mq-caret-blink {
  0%,
  49% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0;
  }
}

/* While the custom caret is showing (empty field), hide MathQuill's own thin
   caret so there is exactly one cursor. */
:deep(.mq-hide-native-caret .mq-cursor) {
  display: none !important;
}

/* MathQuill's input proxy is a real <textarea>. A global textarea reset
   (Tailwind preflight: resize:vertical + a focus outline) was overriding
   MathQuill's own hiding rules, leaving a visible ~177x48 box with a resize
   grip and focus ring on click. Force it back to an invisible 1px proxy so the
   only thing the user sees is our caret. Input still works (it stays focused). */
:deep(.mq-field-root .mq-textarea textarea),
:deep(.mq-field-root textarea) {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  outline: none !important;
  box-shadow: none !important;
  resize: none !important;
  opacity: 0 !important;
  clip: rect(0 0 0 0) !important;
  -webkit-appearance: none !important;
  appearance: none !important;
}

/* ---------------------------------------------------------------------------
   Field container. We present MathQuill's editable field as a large, padded
   text box (it defaults to a small inline field with a 1px border + blue focus
   glow). Everything below is intentional container/caret styling only — the
   math layout itself (exponents, fractions, roots, parens…) is left to
   MathQuill's own CSS, which is loaded and wins the cascade. Do NOT re-add
   per-construct layout overrides here; they fight MathQuill and cause the
   "fix one thing, break another" churn.
   --------------------------------------------------------------------------- */
:deep(.mq-field-root.mq-editable-field) {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 96px;
  max-height: 400px;
  overflow: auto;
  padding: 24px;
  margin: 0;
  font-size: 16px;
  color: #1a1814;
  background: transparent;
  border: none;
  box-shadow: none;
  outline: none;
  cursor: text;
}

:deep(.mq-compact) {
  min-height: 96px;
  padding: 24px;
}

:deep(.mq-field-root.mq-editable-field.mq-focused) {
  box-shadow: none;
  outline: none;
}

/* MathQuill's own caret (shown once the user has typed content). Our custom
   empty-field caret is .mq-fake-caret above. */
:deep(.mq-field-root .mq-cursor) {
  border-left: 2px solid #1a1814;
}

/* Selection highlight */
:deep(.mq-field-root .mq-selection),
:deep(.mq-field-root .mq-selection .mq-non-leaf),
:deep(.mq-field-root .mq-selection span) {
  background-color: rgba(37, 99, 235, 0.15);
}

/* Suppress MathQuill's empty-field 'c' placeholder glyph — we draw our own
   caret + placeholder. */
:deep(.mq-field-root .mq-empty .mq-root-block:before) {
  content: '' !important;
}
</style>

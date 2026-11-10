<script setup>
import { nextTick, ref, watch } from 'vue'

// The 6-box SMS-code input shared by the register and phone-verify flows.
// Typing auto-advances, Backspace walks left, paste/autofill spreads digits
// across the boxes. Emits `complete` once every box is filled (so the parent
// can auto-submit) and `enter` on an explicit Enter press.
const props = defineProps({
  modelValue: { type: String, default: '' },
  length: { type: Number, default: 6 },
})

const emit = defineEmits(['update:modelValue', 'complete', 'enter'])

const digits = ref(Array(props.length).fill(''))
const inputs = ref([])

// Mirror external writes (e.g. the parent resetting the code to '').
watch(
  () => props.modelValue,
  (value) => {
    const normalized = String(value || '').replace(/\D/g, '').slice(0, props.length)
    if (normalized === digits.value.join('')) {
      return
    }
    digits.value = Array.from({ length: props.length }, (_, index) => normalized[index] || '')
  },
)

const setInputRef = (element, index) => {
  inputs.value[index] = element
}

const focusInput = (index) => {
  const input = inputs.value[index]
  if (input) {
    input.focus()
    input.select?.()
  }
}

const sync = () => {
  const code = digits.value.join('')
  emit('update:modelValue', code)
  if (code.length === props.length) {
    emit('complete', code)
  }
}

const onInput = (index, event) => {
  const typed = String(event.target.value).replace(/\D/g, '')

  if (!typed) {
    digits.value[index] = ''
    event.target.value = ''
    sync()
    return
  }

  // Typing normally gives one digit; an autofill/paste into a box can give
  // several — spread them across the following boxes.
  const nextValues = [...digits.value]
  let cursor = index
  for (const digit of typed.slice(0, props.length - index)) {
    nextValues[cursor] = digit
    cursor += 1
  }
  digits.value = nextValues
  event.target.value = nextValues[index]
  focusInput(Math.min(cursor, props.length - 1))
  sync()
}

const onKeydown = (index, event) => {
  if (event.key === 'Backspace' && !digits.value[index] && index > 0) {
    digits.value[index - 1] = ''
    focusInput(index - 1)
    event.preventDefault()
    sync()
  } else if (event.key === 'ArrowLeft' && index > 0) {
    focusInput(index - 1)
    event.preventDefault()
  } else if (event.key === 'ArrowRight' && index < props.length - 1) {
    focusInput(index + 1)
    event.preventDefault()
  } else if (event.key === 'Enter') {
    emit('enter')
  }
}

const onPaste = (event) => {
  const pasted = String(event.clipboardData?.getData('text') || '').replace(/\D/g, '')
  if (!pasted) {
    return
  }
  event.preventDefault()
  const nextValues = Array(props.length).fill('')
  for (let index = 0; index < Math.min(pasted.length, props.length); index += 1) {
    nextValues[index] = pasted[index]
  }
  digits.value = nextValues
  focusInput(Math.min(pasted.length, props.length - 1))
  sync()
}

const clear = async () => {
  digits.value = Array(props.length).fill('')
  emit('update:modelValue', '')
  await nextTick()
  focusInput(0)
}

const focusFirst = async () => {
  await nextTick()
  focusInput(0)
}

defineExpose({ clear, focus: focusFirst })
</script>

<template>
  <div class="flex justify-center gap-2" @paste="onPaste">
    <input
      v-for="(digit, index) in digits"
      :key="index"
      :ref="(element) => setInputRef(element, index)"
      :value="digit"
      type="text"
      inputmode="numeric"
      autocomplete="one-time-code"
      :maxlength="length"
      class="h-[52px] w-[42px] rounded-xl border bg-white text-center text-xl font-bold text-ink outline-none transition focus:border-ink"
      :class="digit ? 'border-ink' : 'border-hairline-strong'"
      @input="onInput(index, $event)"
      @keydown="onKeydown(index, $event)"
    />
  </div>
</template>

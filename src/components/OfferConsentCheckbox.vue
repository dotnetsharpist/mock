<script setup>
// "Men [ommaviy oferta] va [maxfiylik siyosati] shartlarini qabul qilaman" —
// the one consent checkbox, shared by the payment dialog (where the two URLs
// come from GET /payment/offer) and the register form (our own /oferta and
// /maxfiylik pages). Both links open in a new tab, so ticking the box never
// costs the student the form they were filling in.
//
// Without a URL a link word is plain text and the box can't be ticked: the
// payment dialog uses that while the offer is still loading.
const accepted = defineModel({ type: Boolean, default: false })

const props = defineProps({
  offerUrl: { type: String, default: '' },
  privacyUrl: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  // id of the error under the box, when there is one.
  errorId: { type: String, default: '' },
})

const linkClass =
  'font-semibold text-[#1a1814] underline decoration-[#c9c3b8] underline-offset-2 hover:decoration-[#1a1814]'
</script>

<template>
  <label
    class="flex items-start gap-3 text-[13px] leading-relaxed text-[#4a463f]"
    :class="offerUrl && privacyUrl ? 'cursor-pointer' : 'cursor-default'"
  >
    <input
      v-model="accepted"
      type="checkbox"
      class="mt-[3px] h-4 w-4 shrink-0 cursor-pointer accent-[#1a1814] disabled:cursor-default"
      :disabled="disabled || !offerUrl || !privacyUrl"
      :aria-invalid="props.errorId ? 'true' : undefined"
      :aria-describedby="props.errorId || undefined"
    />
    <i18n-t keypath="offerConsent.label" tag="span" scope="global">
      <template #offer>
        <a v-if="offerUrl" :href="offerUrl" target="_blank" rel="noopener noreferrer" :class="linkClass">{{
          $t('offerConsent.offerLink')
        }}</a>
        <span v-else>{{ $t('offerConsent.offerLink') }}</span>
      </template>
      <template #privacy>
        <a v-if="privacyUrl" :href="privacyUrl" target="_blank" rel="noopener noreferrer" :class="linkClass">{{
          $t('offerConsent.privacyLink')
        }}</a>
        <span v-else>{{ $t('offerConsent.privacyLink') }}</span>
      </template>
    </i18n-t>
  </label>
</template>

<script setup>
// Sozlamalar — the account screen, and the only one. It replaces both the
// placeholder that used to sit here and views/ProfilePage.vue, which rendered on
// the old chrome; /profile now redirects here. Before this there were three
// entry points (sidebar card, topbar "Sozlamalar", topbar "Profil") leading to
// two different screens, one of them empty.
//
// The profile editing is ported from ProfilePage as-is, including the two rules
// that matter: all three name fields are required (they print on the
// certificate, and a partial save would blank one), and the phone must be a
// full 12-digit Uzbek number.
//
// It also carries the two things the platform shell had nowhere to put:
// signing out, and the interface language.
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppTopbar from '@/components/app/AppTopbar.vue'
import AppCard from '@/components/app/AppCard.vue'
import AppIcon from '@/components/app/AppIcon.vue'
import CoinIcon from '@/components/app/CoinIcon.vue'
import SkeletonBlock from '@/components/app/SkeletonBlock.vue'
import { useAuthStore } from '@/stores/auth'
import { useBalanceStore } from '@/stores/balance'
import { setLocale } from '@/i18n'

defineProps({
  user: { type: Object, required: true },
})
defineEmits(['openMenu'])

const router = useRouter()
const authStore = useAuthStore()
const balanceStore = useBalanceStore()
const { locale, t } = useI18n()

const info = computed(() => authStore.userInfo || null)
const tangaBalance = computed(() => balanceStore.available)

// An error is either the server's own message, shown as sent, or one of ours,
// kept as a message key so that switching the language on this very page
// re-renders it: { text } | { key } | null.
const fromError = (error, key) => (error instanceof Error ? { text: error.message } : { key })
const errorText = (value) => (value?.key ? t(value.key) : value?.text || '')

const isLoading = ref(false)
const loadError = ref(null)

async function loadProfile() {
  if (!authStore.isAuthenticated) return
  isLoading.value = true
  loadError.value = null
  try {
    await authStore.getUserInfo()
    balanceStore.refresh().catch(() => {})
  } catch (error) {
    loadError.value = fromError(error, 'settingsPage.loadFailed')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  void loadProfile()
})

// ——— Editing ————————————————————————————————————————————————————————————
const isEditing = ref(false)
const isSaving = ref(false)
const saveError = ref(null)
const saveSuccess = ref(false)
const form = reactive({ firstName: '', lastName: '', fatherName: '', phoneNumber: '' })

// The backend stores the phone as bare digits ("998770343363") but it is shown
// and edited in the familiar "+998…" form.
function formatPhone(digits) {
  const clean = String(digits || '').replace(/\D/g, '').slice(0, 12)
  return clean ? `+${clean}` : ''
}

// Re-assigning the DOM value keeps the field in sync even when the formatted
// result is unchanged — e.g. the user typed a character that was rejected.
function onPhoneInput(event) {
  const formatted = formatPhone(event.target.value)
  form.phoneNumber = formatted
  event.target.value = formatted
}

function startEdit() {
  form.firstName = info.value?.firstName || ''
  form.lastName = info.value?.lastName || ''
  form.fatherName = info.value?.fatherName || ''
  // Default to the country code so only the operator + subscriber digits are typed.
  form.phoneNumber = formatPhone(info.value?.phoneNumber) || '+998'
  saveError.value = null
  saveSuccess.value = false
  isEditing.value = true
}

function cancelEdit() {
  if (isSaving.value) return
  isEditing.value = false
  saveError.value = null
}

async function saveProfile() {
  const firstName = form.firstName.trim()
  const lastName = form.lastName.trim()
  const fatherName = form.fatherName.trim()
  const phoneDigits = form.phoneNumber.replace(/\D/g, '')

  // All three print on the certificate — required, so saving here cannot blank
  // out a name the way a partial update would.
  if (!firstName || !lastName || !fatherName) {
    saveError.value = { key: 'testPage.profileValidation' }
    return
  }

  // Uzbek numbers are 12 digits: 998 + 9 subscriber digits.
  if (!/^998\d{9}$/.test(phoneDigits)) {
    saveError.value = { key: 'settingsPage.phoneInvalid' }
    return
  }

  isSaving.value = true
  saveError.value = null
  saveSuccess.value = false

  try {
    await authStore.updateProfile({ firstName, lastName, fatherName, phoneNumber: phoneDigits })
    isEditing.value = false
    saveSuccess.value = true
  } catch (error) {
    saveError.value = fromError(error, 'testPage.profileSaveError')
  } finally {
    isSaving.value = false
  }
}

const displayValue = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? t('settingsPage.yes') : t('settingsPage.no')
  return String(value)
}

// The name labels are the same words ProfileGateModal uses (testPage.*).
const profileFields = computed(() => [
  { key: 'firstName', label: t('testPage.firstName'), value: info.value?.firstName, editable: true },
  { key: 'lastName', label: t('testPage.lastName'), value: info.value?.lastName, editable: true },
  {
    key: 'fatherName',
    label: t('testPage.fatherName'),
    value: info.value?.fatherName,
    editable: true,
  },
  {
    key: 'phoneNumber',
    label: t('settingsPage.phone'),
    value: info.value?.phoneNumber ? formatPhone(info.value.phoneNumber) : null,
    editable: true,
    type: 'phone',
  },
  { key: 'email', label: t('settingsPage.email'), value: info.value?.email, editable: false },
])

// The API does not always return fullName — for this account it comes back
// empty, which rendered the profile heading as a bare "—". Compose it from the
// parts we do have before falling back.
const displayName = computed(() => {
  const full = info.value?.fullName?.trim()
  if (full) return full
  const composed = [info.value?.firstName, info.value?.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ')
  return composed || '—'
})

const initials = computed(() => {
  const first = info.value?.firstName?.trim()?.[0] || ''
  const last = info.value?.lastName?.trim()?.[0] || ''
  return `${first}${last}` || info.value?.fullName?.trim()?.[0] || 'U'
})

// ——— Language ————————————————————————————————————————————————————————————
// Each language is named in itself, not translated: someone who can't read the
// current interface still has to be able to find their own.
const LANGUAGES = [
  { value: 'uz', label: 'O‘zbekcha' },
  { value: 'ru', label: 'Русский' },
]
const changeLanguage = (value) => setLocale(value)

// ——— Sign out ————————————————————————————————————————————————————————————
// Confirmed, because the shell offers no undo and an accidental sign-out costs
// the student an unfinished attempt's worth of context.
const isSignOutOpen = ref(false)

// Leave the platform first, then clear the token — see the note on AppTopbar's
// signOut for why that order matters.
async function signOut() {
  isSignOutOpen.value = false
  await router.push({ name: 'home' })
  authStore.logout()
  balanceStore.reset()
}
</script>

<template>
  <AppTopbar
    :title="t('appShell.topbar.settings')"
    :subtitle="t('settingsPage.subtitle')"
    :user="user"
    @open-menu="$emit('openMenu')"
  />

  <main class="grid gap-4 lg:grid-cols-[320px_1fr] lg:items-start">
    <!-- ═══ Identity + balance ═══ -->
    <AppCard>
      <div class="flex flex-col items-center text-center">
        <span
          class="flex h-20 w-20 items-center justify-center rounded-2xl bg-app-ink text-[26px] font-bold uppercase text-app-surface"
        >
          {{ initials }}
        </span>

        <template v-if="isLoading && !info">
          <SkeletonBlock class="mt-4 h-5 w-40" />
          <SkeletonBlock class="mt-2 h-4 w-32" />
        </template>
        <template v-else>
          <h2 class="mt-4 text-[18px] font-bold tracking-[-0.01em] text-app-ink">
            {{ displayName }}
          </h2>
          <p class="mt-1 break-all text-[13px] text-app-muted">{{ displayValue(info?.email) }}</p>
          <span
            class="mt-3 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold"
            :class="info?.emailConfirmed ? 'bg-app-good-bg text-app-good' : 'bg-app-tile text-app-muted'"
          >
            {{
              info?.emailConfirmed
                ? t('settingsPage.emailConfirmed')
                : t('settingsPage.emailNotConfirmed')
            }}
          </span>
        </template>

        <div class="mt-5 w-full rounded-xl border border-app-border bg-app-sunken p-4">
          <p class="text-[12px] text-app-muted">{{ t('settingsPage.balance') }}</p>
          <p class="mt-1.5 flex items-center justify-center gap-2">
            <CoinIcon :size="18" class="text-app-coin" />
            <span class="text-[24px] font-bold leading-none tabular-nums text-app-ink">
              {{ tangaBalance }}
            </span>
            <span class="text-[13px] font-semibold text-app-muted">
              {{ t('settingsPage.tangaUnit', Number(tangaBalance) || 0) }}
            </span>
          </p>
          <RouterLink
            to="/tanga"
            class="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-app-border bg-app-surface px-4 py-2 text-[13px] font-semibold text-app-ink transition-colors hover:bg-app-tile focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
          >
            {{ t('appShell.topbar.topUp') }}
            <AppIcon name="arrowRight" :size="14" />
          </RouterLink>
        </div>
      </div>
    </AppCard>

    <div class="space-y-4">
      <!-- ═══ Profile fields ═══ -->
      <AppCard>
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-[16px] font-bold tracking-[-0.01em] text-app-ink">
              {{ t('settingsPage.profileHeading') }}
            </h2>
            <p class="mt-0.5 text-[13px] text-app-muted">
              {{ t('settingsPage.profileHint') }}
            </p>
          </div>
          <button
            v-if="!isEditing"
            type="button"
            class="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-app-border bg-app-surface px-3.5 py-2 text-[13px] font-semibold text-app-ink transition-colors hover:bg-app-tile focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
            @click="startEdit"
          >
            {{ t('settingsPage.edit') }}
          </button>
        </div>

        <p
          v-if="loadError"
          class="mb-4 rounded-xl bg-app-bad-bg px-4 py-3 text-[13px] font-medium text-app-bad"
        >
          {{ errorText(loadError) }}
        </p>
        <p
          v-if="saveSuccess && !isEditing"
          class="mb-4 rounded-xl bg-app-good-bg px-4 py-3 text-[13px] font-medium text-app-good"
        >
          {{ t('settingsPage.saved') }}
        </p>

        <form @submit.prevent="saveProfile">
          <dl class="divide-y divide-app-border">
            <div
              v-for="field in profileFields"
              :key="field.key"
              class="grid gap-1.5 py-3 first:pt-0 sm:grid-cols-[180px_1fr] sm:items-center sm:gap-4"
            >
              <dt class="text-[13px] text-app-muted">{{ field.label }}</dt>
              <dd class="min-w-0 text-[14px] font-semibold text-app-ink">
                <input
                  v-if="isEditing && field.editable && field.type === 'phone'"
                  :value="form.phoneNumber"
                  type="tel"
                  inputmode="numeric"
                  autocomplete="tel"
                  placeholder="+998 90 123 45 67"
                  class="w-full rounded-lg border border-app-border bg-app-surface px-3 py-2 text-[14px] font-semibold text-app-ink outline-none transition-colors focus:border-app-ink"
                  @input="onPhoneInput"
                />
                <input
                  v-else-if="isEditing && field.editable"
                  v-model="form[field.key]"
                  type="text"
                  :placeholder="field.label"
                  class="w-full rounded-lg border border-app-border bg-app-surface px-3 py-2 text-[14px] font-semibold text-app-ink outline-none transition-colors focus:border-app-ink"
                />
                <span v-else class="break-words">{{ displayValue(field.value) }}</span>
              </dd>
            </div>
          </dl>

          <p v-if="saveError" class="mt-4 text-[13px] font-medium text-app-bad">
            {{ errorText(saveError) }}
          </p>

          <div v-if="isEditing" class="mt-5 flex flex-col gap-2.5 sm:flex-row sm:justify-end">
            <button
              type="button"
              :disabled="isSaving"
              class="rounded-lg border border-app-border bg-app-surface px-5 py-2.5 text-[13px] font-semibold text-app-ink transition-colors hover:bg-app-tile disabled:cursor-not-allowed disabled:opacity-60"
              @click="cancelEdit"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="isSaving"
              class="rounded-lg bg-app-ink px-5 py-2.5 text-[13px] font-semibold text-app-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {{ isSaving ? t('settingsPage.saving') : t('settingsPage.save') }}
            </button>
          </div>
        </form>
      </AppCard>

      <!-- ═══ Language ═══ -->
      <AppCard>
        <h2 class="text-[16px] font-bold tracking-[-0.01em] text-app-ink">
          {{ t('common.language') }}
        </h2>
        <p class="mt-0.5 text-[13px] text-app-muted">{{ t('settingsPage.languageHint') }}</p>
        <div class="mt-4 flex flex-wrap gap-2">
          <button
            v-for="language in LANGUAGES"
            :key="language.value"
            type="button"
            class="rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
            :class="
              locale === language.value
                ? 'border-app-ink bg-app-ink text-app-surface'
                : 'border-app-border bg-app-surface text-app-ink hover:bg-app-tile'
            "
            :aria-pressed="locale === language.value"
            @click="changeLanguage(language.value)"
          >
            {{ language.label }}
          </button>
        </div>
      </AppCard>

      <!-- ═══ Sign out ═══ -->
      <!-- The button sits under the text, not opposite it: this is the last card
           on the page, and the floating support button owns the bottom-right
           corner — right-aligned, it was rendered unclickable behind it. -->
      <AppCard>
        <h2 class="text-[16px] font-bold tracking-[-0.01em] text-app-ink">
          {{ t('settingsPage.signOutHeading') }}
        </h2>
        <p class="mt-0.5 text-[13px] text-app-muted">{{ t('settingsPage.signOutHint') }}</p>
        <button
          type="button"
          class="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-app-border bg-app-surface px-3.5 py-2 text-[13px] font-semibold text-app-bad transition-colors hover:bg-app-bad-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
          @click="isSignOutOpen = true"
        >
          <AppIcon name="logout" :size="15" />
          {{ t('appShell.topbar.signOut') }}
        </button>
      </AppCard>
    </div>

    <Teleport to="body">
      <div v-if="isSignOutOpen" class="fixed inset-0 z-[300] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="isSignOutOpen = false"></div>
        <div
          class="relative w-full max-w-[380px] rounded-2xl border border-app-border bg-app-surface p-6 shadow-app-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="signout-title"
        >
          <h2 id="signout-title" class="text-[17px] font-bold tracking-[-0.01em] text-app-ink">
            {{ t('settingsPage.signOutConfirmTitle') }}
          </h2>
          <p class="mt-2 text-[14px] leading-[1.6] text-app-muted">
            {{ t('settingsPage.signOutConfirmText') }}
          </p>
          <div class="mt-5 flex flex-col gap-2.5 sm:flex-row sm:justify-end">
            <button
              type="button"
              class="rounded-lg border border-app-border bg-app-surface px-5 py-2.5 text-[13px] font-semibold text-app-ink transition-colors hover:bg-app-tile"
              @click="isSignOutOpen = false"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="button"
              class="rounded-lg bg-app-ink px-5 py-2.5 text-[13px] font-semibold text-app-surface transition-opacity hover:opacity-90"
              @click="signOut"
            >
              {{ t('appShell.topbar.signOut') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </main>
</template>

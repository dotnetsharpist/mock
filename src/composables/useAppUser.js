import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useBalanceStore } from '@/stores/balance'
import { t } from '@/i18n'

// The identity the platform shell renders (sidebar user card, top bar avatar
// and tanga pill). Reads the existing stores — it does not fetch or mutate auth
// state itself. Falls back to the approved mockup's placeholder identity so the
// shell never renders blank while /api/user is still in flight.
export function useAppUser() {
  const authStore = useAuthStore()
  const balanceStore = useBalanceStore()

  return computed(() => {
    const info = authStore.userInfo
    return {
      name: info?.firstName || info?.fullName || t('appUi.studentFallback'),
      email: info?.email || 'student@mail.com',
      tanga: balanceStore.available ?? 0,
    }
  })
}

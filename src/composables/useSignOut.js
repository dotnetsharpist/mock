import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useBalanceStore } from '@/stores/balance'

// Leave first, then clear the session — never the other way round. Dropping the token
// while still standing on a `requiresAuth` route wakes every guard that watches for it
// (AppShell's watcher, router.beforeEach) and one of them wins the race, which is how
// "Chiqish" ended up on an auth screen instead of the landing page. Once we are on `/`,
// there is nothing left for them to eject.
export function useSignOut() {
  const router = useRouter()
  const authStore = useAuthStore()
  const balanceStore = useBalanceStore()

  return async function signOut() {
    await router.push({ name: 'home' })
    authStore.logout()
    balanceStore.reset()
  }
}

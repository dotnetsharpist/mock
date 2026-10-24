import { createRouter, createWebHistory, START_LOCATION } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { applySeo } from '@/utils/seo'
import { hasStoredSession } from '@/utils/authToken'
import { PLATFORM_HOME } from '@/composables/usePlatformEntry'
// Import your page components
import LandingPage from '@/views/marketing/LandingPage.vue'
import MarketingLayout from '@/layouts/MarketingLayout.vue'
import PublicLayout from '@/layouts/PublicLayout.vue'
import PlatformLayout from '@/layouts/PlatformLayout.vue'
import AppShell from '@/layouts/AppShell.vue'
import BareLayout from '@/layouts/BareLayout.vue'

// The route table is split into four layout groups — the wall between the
// public "shop window" and the registered-users-only "workshop":
//
//   MarketingLayout  the new landing shell. Auth-free: no auth store, no
//                    session request on a logged-out visitor's page load.
//   PublicLayout     the existing public pages (subject pages, narxlar, the
//                    standalone demos). Public and indexed, but they keep the
//                    chrome and auth-aware behaviour they have today.
//   PlatformLayout   everything behind registration. Owns the guard.
//   BareLayout       the auth pages themselves.
//
// `meta.chrome: false` and `meta.support: false` replace the `layoutlessRoutes`
// / `supportlessRoutes` path arrays that used to live in App.vue.
const routes = [
  // ── (marketing) ──────────────────────────────────────────────────────────
  {
    path: '/',
    component: MarketingLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: LandingPage,
        meta: {
          seo: {
            descriptionKey: 'seo.home.description',
          },
        },
      },
      {
        path: 'natijalar',
        name: 'natijalar',
        // Public student success stories — proof for visitors who have never
        // registered. A signed-in student asking for "natijalar" means their
        // own results, so the guard below sends them to /natijalarim; this page
        // stays the indexed marketing one for everybody else.
        component: () => import('@/views/marketing/NatijalarPage.vue'),
        meta: {
          seo: {
            titleKey: 'seo.natijalar.title',
            descriptionKey: 'seo.natijalar.description',
          },
        },
      },
      {
        path: 'fikrlar',
        name: 'fikrlar',
        component: () => import('@/views/marketing/FikrlarPage.vue'),
        meta: {
          seo: {
            titleKey: 'seo.fikrlar.title',
            descriptionKey: 'seo.fikrlar.description',
          },
        },
      },
      {
        path: 'platforma',
        name: 'platforma',
        component: () => import('@/views/marketing/PlatformaPage.vue'),
        meta: {
          seo: {
            titleKey: 'seo.platforma.title',
            descriptionKey: 'seo.platforma.description',
          },
        },
      },
      {
        // Courses are not built yet; the page says so rather than the nav item
        // pointing at a four-word feature column that implies they exist.
        path: 'kurslar',
        name: 'marketing-kurslar',
        component: () => import('@/views/marketing/KurslarPage.vue'),
        meta: {
          seo: {
            titleKey: 'seo.kurslar.title',
            descriptionKey: 'seo.kurslar.description',
          },
        },
      },
      {
        // The essay analysis screen, which used to be a tab inside /platforma.
        path: 'essay-tekshirish',
        name: 'essay-tekshirish',
        component: () => import('@/views/marketing/EssayTekshirishPage.vue'),
        meta: {
          seo: {
            titleKey: 'seo.essayTekshirish.title',
            descriptionKey: 'seo.essayTekshirish.description',
          },
        },
      },
      // The old placeholder address for the same subject.
      { path: 'ai-tekshiruv', redirect: { name: 'essay-tekshirish' } },
      // The documents the payment checkbox links to — the backend's
      // GET /payment/offer returns exactly these two URLs.
      {
        path: 'oferta',
        name: 'oferta',
        component: () => import('@/views/marketing/LegalPage.vue'),
        props: { doc: 'oferta' },
        meta: {
          seo: {
            titleKey: 'seo.oferta.title',
            descriptionKey: 'seo.oferta.description',
          },
        },
      },
      {
        path: 'maxfiylik',
        name: 'maxfiylik',
        component: () => import('@/views/marketing/LegalPage.vue'),
        props: { doc: 'maxfiylik' },
        meta: {
          seo: {
            titleKey: 'seo.maxfiylik.title',
            descriptionKey: 'seo.maxfiylik.description',
          },
        },
      },
    ],
  },

  // ── (marketing) — existing public pages, unchanged chrome ────────────────
  {
    path: '/',
    component: PublicLayout,
    children: [
      {
        path: 'narxlar',
        name: 'narxlar',
        component: () => import('@/views/PricingPage.vue'), // Lazy load the pricing page
        meta: {
          seo: {
            titleKey: 'seo.narxlar.title',
            descriptionKey: 'seo.narxlar.description',
          },
        },
      },
      {
        // Old pricing URL. The client-side redirect keeps in-app links and
        // bookmarks working; the real 301 for crawlers is in public/serve.json.
        path: 'pricing',
        redirect: { name: 'narxlar' },
      },
      {
        path: 'math',
        name: 'math',
        component: () => import('@/views/SubjectPage.vue'),
        meta: {
          subjectKey: 'math',
          seo: {
            titleKey: 'seo.math.title',
            descriptionKey: 'seo.math.description',
          },
        },
      },
      {
        path: 'mashq',
        // Dev-only while the practice backend is built: visible on localhost,
        // production keeps redirecting home until /api/practice/* is live.
        ...(import.meta.env.DEV
          ? { name: 'mashq', component: () => import('@/views/MashqPage.vue') }
          : { redirect: '/' }),
      },
      {
        path: 'tarix',
        name: 'tarix',
        component: () => import('@/views/SubjectPage.vue'),
        meta: {
          subjectKey: 'history',
          seo: {
            titleKey: 'seo.tarix.title',
            descriptionKey: 'seo.tarix.description',
          },
        },
      },
      {
        path: 'fizika',
        name: 'fizika',
        component: () => import('@/views/SubjectPage.vue'),
        meta: {
          subjectKey: 'physics',
          seo: {
            titleKey: 'seo.fizika.title',
            descriptionKey: 'seo.fizika.description',
          },
        },
      },
      {
        path: 'biologiya',
        name: 'biologiya',
        component: () => import('@/views/SubjectPage.vue'),
        meta: {
          subjectKey: 'biology',
          seo: {
            titleKey: 'seo.biologiya.title',
            descriptionKey: 'seo.biologiya.description',
          },
        },
      },
      {
        // The Biology sample graduated into the real /test flow (backend test +
        // AI-checked questions), so old links land on the subject page. Kept in
        // DEV as the offline design reference for the AI question UI.
        path: 'biologiya/test',
        ...(import.meta.env.DEV
          ? {
              name: 'biologiya-test',
              component: () => import('@/views/BiologyDemoPage.vue'),
              meta: {
                chrome: false,
                support: false,
                seo: { titleKey: 'seo.biologiyaTest.title', robots: 'noindex, nofollow' },
              },
            }
          : { redirect: '/biologiya' }),
      },
      {
        path: 'ona-tili',
        name: 'ona-tili',
        component: () => import('@/views/OnaTiliPage.vue'),
        meta: {
          subjectKey: 'motherTongue',
          seo: {
            titleKey: 'seo.onaTili.title',
            descriptionKey: 'seo.onaTili.description',
          },
        },
      },
      {
        // The Ona tili exam preview graduated into the real /test flow (essay UI
        // included); old links land on the subject page.
        path: 'ona-tili-demo',
        redirect: '/ona-tili',
      },
      {
        path: 'ona-tili-demo-natija',
        // Results/analysis preview for the Ona tili demo (incl. the AI essay
        // analysis design). DEV-only, mirroring /ona-tili-demo.
        ...(import.meta.env.DEV
          ? {
              name: 'ona-tili-demo-natija',
              component: () => import('@/views/OnaTiliDemoResultPage.vue'),
              meta: { chrome: false, support: false },
            }
          : { redirect: '/ona-tili' }),
      },
    ],
  },

  // ── (app) — redesigned platform, behind registration ─────────────────────
  // The new shell (docs/DESIGN.md). Pre-existing platform pages stay on
  // PlatformLayout below with their current chrome until each one's screen is
  // designed and approved, so nothing that works today changes look early.
  {
    path: '/',
    component: AppShell,
    beforeEnter: (to) => {
      const authStore = useAuthStore()
      if (authStore.isAuthenticated) return true
      return { name: to.meta?.authEntry || 'register', query: { redirect: to.fullPath } }
    },
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/app/DashboardPage.vue'),
        meta: { requiresAuth: true, appTitle: 'Bosh sahifa', seo: { titleKey: 'seo.app.dashboard', robots: 'noindex, nofollow' } },
      },
      {
        path: 'testlar',
        name: 'testlar',
        component: () => import('@/views/app/TestlarPage.vue'),
        meta: { requiresAuth: true, appTitle: 'Testlar', appIcon: 'tests', seo: { titleKey: 'seo.app.tests', robots: 'noindex, nofollow' } },
      },
      {
        // One subject's mock list — where a card in the Fanlar grid leads.
        path: 'testlar/:subject',
        name: 'testlar-subject',
        component: () => import('@/views/app/SubjectTestsPage.vue'),
        meta: { requiresAuth: true, appTitle: 'Testlar', appIcon: 'tests', seo: { titleKey: 'seo.app.tests', robots: 'noindex, nofollow' } },
      },
      {
        // Savollar banki — topic-by-topic practice questions, separate from
        // the mock tests. The two players (one question, a session) are
        // full-screen and live in the PlatformLayout group below.
        path: 'savollar-banki',
        name: 'savollar-banki',
        component: () => import('@/views/app/questionBank/BankHomePage.vue'),
        meta: { requiresAuth: true, appTitle: 'Savollar banki', appIcon: 'layers', seo: { titleKey: 'seo.app.questionBank', robots: 'noindex, nofollow' } },
      },
      {
        path: 'savollar-banki/:subject',
        name: 'savollar-banki-subject',
        component: () => import('@/views/app/questionBank/BankSubjectPage.vue'),
        meta: { requiresAuth: true, appTitle: 'Savollar banki', appIcon: 'layers', seo: { titleKey: 'seo.app.questionBank', robots: 'noindex, nofollow' } },
      },
      {
        path: 'savollar-banki/:subject/statistika',
        name: 'savollar-banki-stats',
        component: () => import('@/views/app/questionBank/BankStatsPage.vue'),
        meta: { requiresAuth: true, appTitle: 'Savollar banki', appIcon: 'layers', seo: { titleKey: 'seo.app.questionBankStats', robots: 'noindex, nofollow' } },
      },
      {
        // The platform's own pricing screen: balance, plans, tanga history.
        // `/narxlar` stays the public, SEO-indexed marketing page for logged-out
        // visitors — the global guard below sends signed-in users here instead,
        // so the same nav item works for both without two competing designs.
        path: 'tanga',
        name: 'tanga',
        component: () => import('@/views/app/NarxlarPage.vue'),
        meta: { requiresAuth: true, appTitle: 'Narxlar', appIcon: 'coins', seo: { titleKey: 'seo.app.pricing', robots: 'noindex, nofollow' } },
      },
      {
        // Where Click sends the student back after paying: ?paymentId=…. The
        // page polls the payment until it settles (utils/payment.js). The path
        // is the backend's — it is the return URL Click was given. Someone
        // landing here has an account (the checkout needed one), so a lost
        // session goes to /login, not /register.
        path: 'payment/result',
        name: 'payment-result',
        component: () => import('@/views/app/PaymentResultPage.vue'),
        meta: { requiresAuth: true, authEntry: 'login', appTitle: 'To‘lov', appIcon: 'coins', seo: { titleKey: 'seo.app.payment', robots: 'noindex, nofollow' } },
      },
      {
        path: 'essay',
        name: 'essay',
        component: () => import('@/views/app/EssayPage.vue'),
        meta: { requiresAuth: true, appTitle: 'Essay tekshirish', appIcon: 'essay', seo: { titleKey: 'seo.app.essay', robots: 'noindex, nofollow' } },
      },
      {
        // The student's own results — mock attempts and saved essay checkings.
        // `/natijalar` is the public marketing page of the same name, so this
        // one is "natijalarim", mirroring how /narxlar and /tanga split.
        path: 'natijalarim',
        name: 'natijalarim',
        component: () => import('@/views/app/NatijalarPage.vue'),
        meta: { requiresAuth: true, appTitle: 'Natijalar', appIcon: 'results', seo: { titleKey: 'seo.app.results', robots: 'noindex, nofollow' } },
      },
      {
        // One saved essay checking's analysis. Persisted client-side — see
        // utils/essayCheckingStorage.js.
        path: 'natijalarim/insho/:id',
        name: 'essay-analysis',
        component: () => import('@/views/app/EssayAnalysisPage.vue'),
        meta: { requiresAuth: true, appTitle: 'Insho natijasi', appIcon: 'essay', seo: { titleKey: 'seo.app.essayResult', robots: 'noindex, nofollow' } },
      },
      {
        // Not designed yet. Bosh sahifa's "Davom etayotgan kurslar" rows do not
        // point here — they lead to the subject's own test list, which is the
        // thing a student can actually continue today.
        //
        // `kurslarim`, not `kurslar`: the public /kurslar page is the marketing
        // one, exactly as /natijalar is public and /natijalarim is the student's
        // own. Both layouts mount at '/', so the marketing child would otherwise
        // shadow this one.
        path: 'kurslarim',
        name: 'kurslar',
        component: () => import('@/views/app/AppPlaceholderPage.vue'),
        meta: { requiresAuth: true, appTitle: 'Kurslar', appIcon: 'cap', seo: { titleKey: 'seo.app.courses', robots: 'noindex, nofollow' } },
      },
      {
        path: 'statistika',
        name: 'statistika',
        component: () => import('@/views/app/AppPlaceholderPage.vue'),
        meta: { requiresAuth: true, appTitle: 'Statistika', appIcon: 'stats', seo: { titleKey: 'seo.app.stats', robots: 'noindex, nofollow' } },
      },
      {
        path: 'yordam',
        name: 'yordam',
        component: () => import('@/views/app/AppPlaceholderPage.vue'),
        meta: { requiresAuth: true, appTitle: 'Yordam', appIcon: 'help', seo: { titleKey: 'seo.app.help', robots: 'noindex, nofollow' } },
      },
      {
        // Account settings *and* profile: one destination, not the three
        // competing ones (sidebar card, topbar menu, /profile) there used to be.
        path: 'sozlamalar',
        name: 'sozlamalar',
        component: () => import('@/views/app/SozlamalarPage.vue'),
        meta: { requiresAuth: true, appTitle: 'Sozlamalar', appIcon: 'settings', seo: { titleKey: 'seo.app.settings', robots: 'noindex, nofollow' } },
      },
      {
        path: 'community',
        name: 'community',
        component: () => import('@/views/app/AppPlaceholderPage.vue'),
        meta: { requiresAuth: true, appTitle: 'Community', appIcon: 'community', seo: { titleKey: 'seo.app.community', robots: 'noindex, nofollow' } },
      },
    ],
  },

  // ── (app) — existing platform pages, unchanged chrome ────────────────────
  {
    path: '/',
    component: PlatformLayout,
    // First of the two enforcement points. The global `beforeEach` below is the
    // other; the layout itself re-checks on mount and on auth-state changes.
    beforeEnter: (to) => {
      const authStore = useAuthStore()
      if (authStore.isAuthenticated) return true
      return { name: 'register', query: { redirect: to.fullPath } }
    },
    children: [
      {
        path: 'test',
        name: 'test',
        component: () => import('@/views/TestPage.vue'),
        meta: { requiresAuth: true, chrome: false, support: false, seo: { robots: 'noindex, nofollow' } },
      },
      {
        path: 'explanation',
        name: 'explanation',
        component: () => import('@/views/ExplanationPage.vue'),
        meta: { requiresAuth: true, chrome: false, support: false, seo: { robots: 'noindex, nofollow' } },
      },
      {
        // One question opened from the bank list.
        path: 'savollar-banki/:subject/savol/:id',
        name: 'savollar-banki-question',
        component: () => import('@/views/app/questionBank/BankQuestionPage.vue'),
        meta: { requiresAuth: true, chrome: false, support: false, seo: { titleKey: 'seo.app.questionBank', robots: 'noindex, nofollow' } },
      },
      {
        // A practice / timed session and, once finished, its results.
        path: 'savollar-banki/sessiya/:id',
        name: 'savollar-banki-session',
        component: () => import('@/views/app/questionBank/BankSessionPage.vue'),
        meta: { requiresAuth: true, chrome: false, support: false, seo: { titleKey: 'seo.app.practice', robots: 'noindex, nofollow' } },
      },
    ],
  },

  // ── (auth) — the door in the wall ────────────────────────────────────────
  {
    path: '/',
    component: BareLayout,
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('@/views/Login.vue'),
        meta: { seo: { robots: 'noindex, nofollow' } },
      },
      {
        path: 'register',
        name: 'register',
        component: () => import('@/views/Register.vue'),
        meta: { seo: { robots: 'noindex, nofollow' } },
      },
      {
        // Name + phone confirmation for a session that has neither — mainly Google
        // and Telegram sign-ins. start-test is the only thing actually gated on
        // this (403 from UserTestAttemptService), so the page is a redirect target
        // rather than a wall: browsing stays open.
        path: 'complete-profile',
        name: 'complete-profile',
        component: () => import('@/views/CompleteProfilePage.vue'),
        meta: { requiresAuth: true, seo: { robots: 'noindex, nofollow' } },
      },
      {
        // Forgot password + unconfirmed-phone verification (?reason=unverified),
        // both via the resend-otp → verify-otp drill.
        path: 'verify-phone',
        name: 'verify-phone',
        component: () => import('@/views/VerifyPhonePage.vue'),
        meta: { seo: { robots: 'noindex, nofollow' } },
      },
    ],
  },

  // ── retired paths ────────────────────────────────────────────────────────
  // These screens moved into the platform shell. Kept as redirects rather than
  // deleted: they are in browser history, and in links students send each
  // other. Outside any layout group, so only the target's own guard runs.
  { path: '/result-exam', redirect: (to) => ({ name: 'natijalarim', query: to.query }) },
  {
    path: '/result-exam/essay/:id',
    redirect: (to) => ({ name: 'essay-analysis', params: { id: to.params.id } }),
  },
  // Profile and settings were two screens for one thing; settings is now both.
  { path: '/profile', redirect: { name: 'sozlamalar' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  // Without this, SPA navigations inherit the previous page's scroll offset — e.g.
  // tapping "Hisobni to‘ldirish" while scrolled down a test page landed the pricing
  // page mid-list (on an expensive plan) instead of at the top (the cheapest plan).
  // Reset to the top on every fresh navigation, while still honouring back/forward
  // restoration and in-page #anchors, and leaving same-path query updates (e.g. the
  // test page syncing testId/attemptId into the URL) exactly where they are.
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, top: 80, behavior: 'smooth' }
    if (to.path === from.path) return false
    return { top: 0 }
  },
})

router.beforeEach((to, from) => {
  // Opening milliymock.uz with a session goes straight into the platform — the
  // landing page would only offer "Platformaga kirish" again. Only on a page
  // load's first navigation: sign-out leaves for `/` *before* it drops the
  // token (see AppTopbar's signOut), so an in-app trip to `/` must still reach
  // the landing page. A localStorage peek, not the auth store, to keep the
  // marketing shell free of session requests (utils/authToken.js).
  if (from === START_LOCATION && to.name === 'home' && hasStoredSession()) {
    return PLATFORM_HOME
  }

  // A signed-in student asking for pricing wants their balance and history, not
  // the marketing page — and the marketing page carries the public navbar,
  // which would drop them out of the platform shell. Logged-out visitors still
  // get /narxlar, which stays indexed.
  if (to.path === '/narxlar' && useAuthStore().isAuthenticated) {
    return { name: 'tanga', query: to.query }
  }

  // Same split for results: /natijalar is the public success-stories page, but
  // a signed-in student typing it means their own results. Without this they
  // would land on the marketing page — carrying the marketing navbar, which
  // drops them out of the platform shell.
  if (to.path === '/natijalar' && useAuthStore().isAuthenticated) {
    return { name: 'natijalarim', query: to.query }
  }

  if (!to.meta?.requiresAuth) {
    return true
  }

  const authStore = useAuthStore()

  if (authStore.isAuthenticated) {
    return true
  }

  // `meta.authEntry` picks the door for a route only account holders reach.
  return {
    name: to.meta?.authEntry || 'register',
    query: { redirect: to.fullPath },
  }
})

// Keep the document <head> in sync with the active route (title, description,
// canonical, Open Graph / Twitter). See src/utils/seo.js.
router.afterEach((to) => {
  applySeo(to.meta?.seo, to)
})

export default router

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { applySeo } from '@/utils/seo'
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
            description:
              "Milliy Mock — testlar, essay tekshirish va kurslar orqali o'qish jarayoningizni samarali va qiziqarli qiling.",
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
            title: 'Natijalar',
            description:
              'MilliyMock o‘quvchilarining milliy sertifikat imtihonlaridagi natijalari va muvaffaqiyat hikoyalari.',
          },
        },
      },
      {
        path: 'fikrlar',
        name: 'fikrlar',
        component: () => import('@/views/marketing/FikrlarPage.vue'),
        meta: {
          seo: {
            title: 'Fikrlar',
            description:
              'MilliyMock bilan milliy sertifikatga tayyorlangan o‘quvchilarning fikrlari va tajribalari.',
          },
        },
      },
      {
        path: 'platforma',
        name: 'platforma',
        component: () => import('@/views/marketing/PlatformaPage.vue'),
        meta: {
          seo: {
            title: 'Platforma',
            description:
              'MilliyMock platformasi: real test formati, batafsil natijalar va tayyorgarlikni kuzatib borish imkoniyati.',
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
            title: 'Kurslar',
            description:
              'MilliyMock kurslari tayyorlanmoqda: video darslar, mavzu bo‘yicha mashqlar va kurs ichida natija kuzatuvi.',
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
            title: 'Essay tekshirish',
            description:
              'Insho va yozma ishlaringizni sun’iy intellekt tekshiradi: xatolar, baho va aniq tavsiyalar.',
          },
        },
      },
      // The old placeholder address for the same subject.
      { path: 'ai-tekshiruv', redirect: { name: 'essay-tekshirish' } },
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
            title: 'Narxlar',
            description:
              'MilliyMock tariflari va narxlari. O‘zingizga mos rejani tanlang va milliy sertifikat testlariga tayyorgarlikni boshlang.',
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
            title: 'Matematika testlari',
            description:
              'Matematikadan milliy sertifikat testlarini real test formatida ishlang. O‘zingizga mos testni tanlang va darhol boshlang.',
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
            title: 'Tarix testlari',
            description:
              'O‘zbekiston va jahon tarixi bo‘yicha milliy sertifikat testlarini ishlang va bilimingizni sinab ko‘ring.',
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
            title: 'Fizika testlari',
            description:
              'Fizikadan milliy sertifikat testlarini real test formatida ishlang. O‘zingizga mos testni tanlang va darhol boshlang.',
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
            title: 'Biologiya testlari',
            description:
              'Biologiyadan milliy sertifikat namunaviy testlarini real test formatida ishlang. O‘zingizga mos testni tanlang va darhol boshlang.',
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
                seo: { title: 'Biologiya testi', robots: 'noindex, nofollow' },
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
            title: 'Ona tili testlari',
            description:
              'Ona tilidan milliy sertifikat testlarini real test formatida ishlang. O‘zingizga mos testni tanlang va darhol boshlang.',
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
      return { name: 'register', query: { redirect: to.fullPath } }
    },
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/app/DashboardPage.vue'),
        meta: { requiresAuth: true, appTitle: 'Bosh sahifa', seo: { title: 'Bosh sahifa', robots: 'noindex, nofollow' } },
      },
      {
        path: 'testlar',
        name: 'testlar',
        component: () => import('@/views/app/TestlarPage.vue'),
        meta: { requiresAuth: true, appTitle: 'Testlar', appIcon: 'tests', seo: { title: 'Testlar', robots: 'noindex, nofollow' } },
      },
      {
        // One subject's mock list — where a card in the Fanlar grid leads.
        path: 'testlar/:subject',
        name: 'testlar-subject',
        component: () => import('@/views/app/SubjectTestsPage.vue'),
        meta: { requiresAuth: true, appTitle: 'Testlar', appIcon: 'tests', seo: { title: 'Testlar', robots: 'noindex, nofollow' } },
      },
      {
        // Savollar banki — topic-by-topic practice questions, separate from
        // the mock tests. The two players (one question, a session) are
        // full-screen and live in the PlatformLayout group below.
        path: 'savollar-banki',
        name: 'savollar-banki',
        component: () => import('@/views/app/questionBank/BankHomePage.vue'),
        meta: { requiresAuth: true, appTitle: 'Savollar banki', appIcon: 'layers', seo: { title: 'Savollar banki', robots: 'noindex, nofollow' } },
      },
      {
        path: 'savollar-banki/:subject',
        name: 'savollar-banki-subject',
        component: () => import('@/views/app/questionBank/BankSubjectPage.vue'),
        meta: { requiresAuth: true, appTitle: 'Savollar banki', appIcon: 'layers', seo: { title: 'Savollar banki', robots: 'noindex, nofollow' } },
      },
      {
        path: 'savollar-banki/:subject/statistika',
        name: 'savollar-banki-stats',
        component: () => import('@/views/app/questionBank/BankStatsPage.vue'),
        meta: { requiresAuth: true, appTitle: 'Savollar banki', appIcon: 'layers', seo: { title: 'Savollar banki — statistika', robots: 'noindex, nofollow' } },
      },
      {
        // The platform's own pricing screen: balance, plans, tanga history.
        // `/narxlar` stays the public, SEO-indexed marketing page for logged-out
        // visitors — the global guard below sends signed-in users here instead,
        // so the same nav item works for both without two competing designs.
        path: 'tanga',
        name: 'tanga',
        component: () => import('@/views/app/NarxlarPage.vue'),
        meta: { requiresAuth: true, appTitle: 'Narxlar', appIcon: 'coins', seo: { title: 'Narxlar', robots: 'noindex, nofollow' } },
      },
      {
        path: 'essay',
        name: 'essay',
        component: () => import('@/views/app/EssayPage.vue'),
        meta: { requiresAuth: true, appTitle: 'Essay tekshirish', appIcon: 'essay', seo: { title: 'Essay tekshirish', robots: 'noindex, nofollow' } },
      },
      {
        // The student's own results — mock attempts and saved essay checkings.
        // `/natijalar` is the public marketing page of the same name, so this
        // one is "natijalarim", mirroring how /narxlar and /tanga split.
        path: 'natijalarim',
        name: 'natijalarim',
        component: () => import('@/views/app/NatijalarPage.vue'),
        meta: { requiresAuth: true, appTitle: 'Natijalar', appIcon: 'results', seo: { title: 'Natijalar', robots: 'noindex, nofollow' } },
      },
      {
        // One saved essay checking's analysis. Persisted client-side — see
        // utils/essayCheckingStorage.js.
        path: 'natijalarim/insho/:id',
        name: 'essay-analysis',
        component: () => import('@/views/app/EssayAnalysisPage.vue'),
        meta: { requiresAuth: true, appTitle: 'Insho natijasi', appIcon: 'essay', seo: { title: 'Insho natijasi', robots: 'noindex, nofollow' } },
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
        meta: { requiresAuth: true, appTitle: 'Kurslar', appIcon: 'cap', seo: { title: 'Kurslar', robots: 'noindex, nofollow' } },
      },
      {
        path: 'statistika',
        name: 'statistika',
        component: () => import('@/views/app/AppPlaceholderPage.vue'),
        meta: { requiresAuth: true, appTitle: 'Statistika', appIcon: 'stats', seo: { title: 'Statistika', robots: 'noindex, nofollow' } },
      },
      {
        path: 'yordam',
        name: 'yordam',
        component: () => import('@/views/app/AppPlaceholderPage.vue'),
        meta: { requiresAuth: true, appTitle: 'Yordam', appIcon: 'help', seo: { title: 'Yordam', robots: 'noindex, nofollow' } },
      },
      {
        // Account settings *and* profile: one destination, not the three
        // competing ones (sidebar card, topbar menu, /profile) there used to be.
        path: 'sozlamalar',
        name: 'sozlamalar',
        component: () => import('@/views/app/SozlamalarPage.vue'),
        meta: { requiresAuth: true, appTitle: 'Sozlamalar', appIcon: 'settings', seo: { title: 'Sozlamalar', robots: 'noindex, nofollow' } },
      },
      {
        path: 'community',
        name: 'community',
        component: () => import('@/views/app/AppPlaceholderPage.vue'),
        meta: { requiresAuth: true, appTitle: 'Community', appIcon: 'community', seo: { title: 'Community', robots: 'noindex, nofollow' } },
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
        meta: { requiresAuth: true, chrome: false, support: false, seo: { title: 'Savollar banki', robots: 'noindex, nofollow' } },
      },
      {
        // A practice / timed session and, once finished, its results.
        path: 'savollar-banki/sessiya/:id',
        name: 'savollar-banki-session',
        component: () => import('@/views/app/questionBank/BankSessionPage.vue'),
        meta: { requiresAuth: true, chrome: false, support: false, seo: { title: 'Mashq', robots: 'noindex, nofollow' } },
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

router.beforeEach((to) => {
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

  return {
    name: 'register',
    query: { redirect: to.fullPath },
  }
})

// Keep the document <head> in sync with the active route (title, description,
// canonical, Open Graph / Twitter). See src/utils/seo.js.
router.afterEach((to) => {
  applySeo(to.meta?.seo, to)
})

export default router

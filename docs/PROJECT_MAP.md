# MilliyMock frontend — project map

Vue 3.5 SPA (Vite 7, vue-router 4, Pinia, Tailwind 4, vue-i18n, naive-ui).
Backend is a separate .NET solution in `../backend`. Deployed via `Dockerfile`
(`serve -s dist -l 3000`) + `docker-compose.yml` — not Vercel.

## The wall: marketing vs platform

MilliyMock has two faces, and registration is the door between them.

- **Shop window** — anyone can see it. Landing page and marketing pages.
- **Workshop** — only registered users. Tests, results, essay checking.

The split is expressed as four **layout groups** in `src/router/index.js`, each
with a layout component in `src/layouts/`. (Next.js route groups have no
vue-router equivalent; nested layout routes are the idiomatic translation.)

| Group | Layout | Auth | Contains |
|---|---|---|---|
| marketing | `MarketingLayout.vue` | none — **no auth store, no session request** | `/`, `/natijalar`, `/platforma`, `/ai-tekshiruv` |
| public (legacy) | `PublicLayout.vue` | none (pages may be auth-*aware*) | `/narxlar`, subject pages, demos |
| platform | `PlatformLayout.vue` | **guarded** | `/test`, `/result-exam`, `/profile`, `/explanation` |
| auth | `BareLayout.vue` | none (`/complete-profile` requires auth) | `/login`, `/register`, `/verify-phone`, `/complete-profile` |

`App.vue` is now only global providers (`NMessageProvider`,
`NetworkStatusAlert`) + `<RouterView>`. The old `layoutlessRoutes` /
`supportlessRoutes` path arrays are gone; layouts read `meta.chrome` and
`meta.support` instead.

### Why two public groups

The subject pages stay public and indexed, but `SubjectPage.vue` /
`OnaTiliPage.vue` / `PricingPage.vue` are auth-*aware* (free vs premium state,
`AuthRequiredModal`, `PricingPaymentModal`) and keep the chrome they have today.
Only newly designed marketing pages get the new marketing shell. Moving them
into `MarketingLayout` would silently redesign them.

## Routes

### marketing — `MarketingLayout`
| Path | Component | Notes |
|---|---|---|
| `/` | `views/marketing/LandingPage.vue` | built from `MilliyMock Landing.dc.html` |
| `/natijalar` | `views/marketing/NatijalarPage.vue` | **placeholder.** Public success stories — *not* `/result-exam` |
| `/platforma` | `views/marketing/PlatformaPage.vue` | placeholder |
| `/ai-tekshiruv` | `views/marketing/AiTekshiruvPage.vue` | placeholder |

### public (legacy chrome) — `PublicLayout`
| Path | Component | Notes |
|---|---|---|
| `/narxlar` | `views/PricingPage.vue` | was `/pricing` |
| `/pricing` | → `/narxlar` | client redirect; real 301 in `public/serve.json` |
| `/math` | `views/SubjectPage.vue` | `subjectKey: 'math'` |
| `/tarix` | `views/SubjectPage.vue` | `subjectKey: 'history'` |
| `/fizika` | `views/SubjectPage.vue` | `subjectKey: 'physics'` |
| `/biologiya` | `views/SubjectPage.vue` | `subjectKey: 'biology'` |
| `/biologiya/test` | `views/BiologyDemoPage.vue` | **DEV only** (offline reference for the AI-question UI); prod → `/biologiya`. `chrome: false`, `support: false`, noindex |
| `/ona-tili` | `views/OnaTiliPage.vue` | |
| `/ona-tili-demo` | → `/ona-tili` | |
| `/ona-tili-demo-natija` | `views/OnaTiliDemoResultPage.vue` | **DEV only**; prod → `/ona-tili` |
| `/mashq` | `views/MashqPage.vue` | **DEV only**; prod → `/` |

### app — `AppShell` (guarded)

The new platform chrome: fixed 240px sidebar, top bar, `docs/DESIGN.md`. Screens
move here one at a time as each is approved; the rest still render
`AppPlaceholderPage.vue` so every sidebar destination resolves.

| Path | Component | Notes |
|---|---|---|
| `/dashboard` | `views/app/DashboardPage.vue` | approved — the reference screen. **Still placeholder data** |
| `/testlar` | `views/app/TestlarPage.vue` | the Fanlar grid — **live API** |
| `/testlar/:subject` | `views/app/SubjectTestsPage.vue` | one subject's mock list — **live API** |
| `/essay` | `views/app/EssayPage.vue` | essay checking — **live API** |
| `/tanga` | `views/app/NarxlarPage.vue` | balance, plans, tanga history — **live API** |
| `/payment/result` | `views/app/PaymentResultPage.vue` | Click's return URL (`?paymentId=`) — polls the payment — **live API** |
| `/savollar-banki` | `views/app/questionBank/BankHomePage.vue` | question bank subjects — **live API**. Not in the sidebar (direct link only) |
| `/savollar-banki/:subject` | `views/app/questionBank/BankSubjectPage.vue` | topics, filters, question list, start a session |
| `/savollar-banki/:subject/statistika` | `views/app/questionBank/BankStatsPage.vue` | accuracy, activity, weak topics, reset |
| `/community` | `AppPlaceholderPage.vue` | not designed yet |
| `/sozlamalar` | `AppPlaceholderPage.vue` | not designed yet |
| `/yordam` | `AppPlaceholderPage.vue` | not designed yet |

**Testlar is wired to the live backend** through `stores/testCatalog.js`:

| Request | Gives |
|---|---|
| `GET /test` | the catalogue — title, subject, question count, attempt count, premium flags |
| `GET /user-test-attempt/get-user-attempts` | this user's attempts, folded in as each row's `new` / `progress` / `done` state |

Both are fetched once and cached in the store, so moving between the grid and a
subject list does not re-hit the network. Rules that fall out of the real data:

- **The grid only shows subjects that have published tests.** It is derived from
  the catalogue, not a hard-coded list, so a new subject appears the moment its
  first test is published — and a student never opens a fan and finds nothing.
  At the time of writing that is Matematika (6), Tarix (4), Ona tili (3),
  Fizika (1), Biologiya (1). Kimyo, Geografiya, Ingliz tili and Informatika are
  in the registry but have no tests, so they do not render.
- **A subject the registry does not recognise is still shown**, under its raw
  backend name with a generic icon, so publishing a test under an unexpected
  subject string cannot make it vanish from the product.
- **No score percentage on a row.** `get-user-attempts` returns `totalScore`
  with no maximum, so a percentage would be invented. Rows say "Yakunlangan".
- **The token is sent on `/test`, not just on the attempts call.** `isPurchased`
  is per-user: anonymously every premium test comes back unpurchased, so
  without the header the screen would offer to sell a student a test they
  already own.
- **Drafts are filtered out client-side.** That same token means an admin
  account gets every draft back from `/test` too — 30 tests instead of 15 — so
  the store keeps only `status: Published`. The public subject pages do not
  need this because they never send a token.

**Essay tekshirish is wired too**, through `composables/useEssayCenter.js`:

| Request | Does |
|---|---|
| `GET /essay-topic` | the user's own topics plus the shared ones |
| `POST /essay-topic` — JSON `{ text }` | add one of your own |
| `DELETE /essay-topic?topicId=` | remove one of your own |
| `POST /essay-review/custom` — JSON `{ topicId, essay }` | grade a typed essay |
| `POST /essay-review/custom/images` | OCR photographed pages, then grade |
| `GET /essay-submission` | the OCR transcription, so highlights can anchor |

The review itself renders through `EssayAnalysisSection`, the shared
integration surface, so the grading UI cannot drift between the platform and
the public Ona tili tab.

`useEssayCenter` is a **separate implementation** from
`components/onatili/OnaTiliEssayCenter.vue`, not a refactor of it. That
component runs the live, paid essay flow for students today and the brief puts
the essay feature off limits, so it is untouched. Endpoints, limits and error
handling are mirrored deliberately; if the two ever disagree, that component is
the authority.

**Narxlar exists twice, on purpose.** `/narxlar` stays the public, indexed
marketing page for logged-out visitors. A signed-in user asking for it is sent
to `/tanga` by the global guard, because the marketing page carries the public
navbar and would drop them out of the platform shell. `/tanga` reads the
balance (`GET /api/balance`), the plans and the tanga history
(`GET /api/transaction`), and reuses `PricingPaymentModal` rather than
reimplementing purchase.

The plans come from `composables/usePricingPlans.js`, shared by both pages so a
price cannot be right in one place and stale in the other. Prices, tanga counts
and tariff codes are the backend's (`GET /api/payment/tariffs`, no login); the
words around a pack — localised name, features, badge — are i18n
`pricing.plans`, matched to a tariff by tanga count. If the tariffs call fails
the i18n plans are shown as they are and the code is derived as `coins<N>`.

The modal offers two ways to pay (`utils/payment.js`,
`composables/useClickCheckout.js`). Click sits behind one switch,
`CLICK_PAYMENT_ENABLED` in `utils/payment.js` (on since 2026-10-14). Off, the
dialog is the Telegram-only one, with its original copy and billing note, and
everything below stays wired.

- **Click** (primary): `POST /api/payment/checkout` `{ tariffCode, provider:
  "Click" }` → `{ paymentId, paymentUrl }`, then the tab goes to `paymentUrl`.
  A new checkout on every press — a Click URL is never reused. 400 = provider
  unavailable, 404 = unknown tariff, 401 = the usual `apiFetch` bounce to
  `/login`. Click returns the student to `/payment/result?paymentId=`, which
  polls `GET /api/payment/{id}` every 2 s for up to 60 s: `Approved` → done,
  balance refreshed; `Cancelled` → failed, "Qayta urinish" opens a new
  checkout; `AwaitingPayment` / `Processing` → waiting. Still not final at 60 s
  → stop, say the tanga arrive once Click confirms, link @Milliymocksupport.
  404 → one generic error (not yours, or no such payment). A signed-out visit
  goes to `/login`, not `/register` (`meta.authEntry`).
- **Card, via `@milliymock_bot`**: a deep link —
  `https://t.me/milliymock_bot?start=pay_coins<N>_<userId>`
  (`utils/telegramBot.js#telegramBotPayUrl`), where N is the plan's `tokens`
  (the bot keys packages by tanga count) and userId is the `nameid` claim
  decoded from the JWT. Payment, receipt and crediting all happen in the bot;
  tanga bought there are still activated by hand.

The dashboard is still placeholder — every figure there is marked `TODO(api)`,
and `?empty=1` previews its first-run state.

**Correction to an earlier note in this file:** a score percentage *is*
obtainable. `get-user-attempts` omits the maximum, but
`get-results?testAttemptId=` returns `maxScore` alongside `totalScore` (and
`correctCount` / `incorrectCount`) — one call per attempt. Test lists stay
without percentages because that would be one request per row, but the
dashboard's average and per-attempt results can use it.

### platform — `PlatformLayout` (guarded)
| Path | Component | Notes |
|---|---|---|
| `/test` | `views/TestPage.vue` | `chrome: false`, `support: false` |
| `/result-exam` | `views/ResultExamPage.vue` | |
| `/result-exam/essay/:id` | `views/EssayResultPage.vue` | client-persisted essay analysis |
| `/profile` | `views/ProfilePage.vue` | |
| `/explanation` | `views/ExplanationPage.vue` | `chrome: false`, `support: false` |
| `/savollar-banki/:subject/savol/:id` | `views/app/questionBank/BankQuestionPage.vue` | one bank question; `chrome: false` |
| `/savollar-banki/sessiya/:id` | `views/app/questionBank/BankSessionPage.vue` | a bank session + its results; `chrome: false` |

All carry `meta.requiresAuth: true` and `robots: noindex, nofollow`.

### Savollar banki (question bank)

Topic-by-topic practice questions, a **separate bank from the mock tests**
(backend: `QuestionBankController`, `/api/question-bank/*`). Free for now.
**Hidden from the sidebar for now** — the nav item is commented out in
`components/app/AppSidebar.vue`; every route still resolves by direct link.

- Every request goes through `utils/questionBankApi.js`, which also turns the
  backend's English errors into Uzbek.
- Text is Markdown + LaTeX (`$…$`, `$$…$$`) + uploaded images
  (`images/FILE_….png`, served next to `/api`), rendered by
  `utils/bankMarkdown.js` (markdown-it, `html: false`, KaTeX) through
  `components/questionBank/BankRichText.vue`. Not `TestInlineMathText` — that
  one repairs the mock tests' legacy text with heuristics.
- `stores/questionBank.js` keeps each subject's filters (so returning from a
  question lands on the same list and page) and the list a question was
  opened from, so the player's Oldingi / Keyingi walk that filtered list
  (mirrored to sessionStorage for reloads).
- Sessions: **Mashq** shows the verdict and solution after each answer;
  **Vaqtli** gives every question its own clock, sends answers without
  feedback and shows results at the end. Time per question is measured in the
  browser (`composables/useBankClock.js`) and sent with the answer.
- Backend dates are Tashkent wall-clock time serialised with a `Z`; display
  them with `formatBankDate` (reads the UTC fields), never `toLocaleString`.

**Local backend.** `utils/api.js` reads `VITE_API_BASE_URL` in `npm run dev`
only (put it in `.env.local`, e.g. `http://localhost:5227/api`); production
builds always use the live API.

### auth — `BareLayout`
`/login`, `/register`, `/verify-phone`, `/complete-profile` — all noindex.

Telegram and Google sign-in are one component, `components/auth/SocialAuthButtons.vue`
(both providers create the account on first sign-in, so they are a registration
path too). They are no longer a general option on `/login` / `/register`;
`/login` mounts the component — `providers` narrowed to one — under its
"no password yet" notice: `POST /auth/login` answers **409** for an account that
was created through Google/Telegram and never set a password (was a 500), and
the raw message names the provider (`error.noPassword` /
`error.noPasswordProvider` in `authStore.login`; rules `noPasswordGoogle` /
`noPasswordTelegram` / `noPassword` in `utils/authErrors.js`). The notice also
links to `/register`. The component emits `authenticated`; the page owns the
redirect (`redirectAfterAuth` → `resolvePostAuthRoute`).

**Phone sign-up = the Telegram bot (`@milliymock_bot`).** `/register`
(`views/Register.vue`) collects first/last/father name and a password — there
is no phone box (the API treats father name as optional; the form requires it). `authStore.registerTelegram` → `POST
/auth/register/telegram` answers `{ ticket, botUrl, expiresInMinutes }`; the
page switches to the code screen with a button (and, on desktop, a QR — the
`qrcode` package, loaded on demand) to `botUrl`, the deep link that carries the
ticket into the bot. The user shares their contact there, the bot shows a
6-digit code, and `authStore.verifyTelegramRegistration` → `POST
/auth/register/telegram/verify` turns ticket + code into a LoginResultDto (same
as login: token stored, `user` cached, redirect). There is no resend endpoint —
the bot re-shows / reissues the code on 📱. The pending ticket is mirrored in
`sessionStorage` (`milliymock_telegram_registration`) so a tab that reloads
after the Telegram round-trip resumes the code screen within the 30-minute
window; the page also keeps its own countdown and falls back to the form when
it hits zero. Five wrong codes or an expired ticket → back to the form
(`error.restartRegistration`); a 409 — the number already belongs to an
account: "This phone number is already attached to an account. Sign in with
Google | Telegram | your password (or "Forgot password") instead." (this
wording replaced the old "…is already registered." and a 500) — → back to the
form with a notice that offers that very sign-in: the Google / Telegram button
(`SocialAuthButtons` with one provider) or the forgot-password link, plus a
"Sign in" link always (`error.phoneAlreadyRegistered` + `error.signInProvider`;
rules `attachedGoogle` / `attachedTelegram` / `attachedPassword` / `attached`
with a localized `{identifier}`). The backend's English messages for this flow
have rules in `utils/authErrors.js` (`nameRequired`, `botCodeNotIssued`,
`botCodeExpired`, `tooManyAttempts`, `registrationExpired`, …). The legacy
`authStore.register` + `verifyOtp` pair is the **email** sign-up path only —
no UI calls it right now.

Existing-account codes (`forgot-password`, `resend-otp`, `verify-my-phone`)
are unchanged on the wire, but the backend now pushes the code to Telegram when
it knows the user's number there and to SMS otherwise, saying which in the
response `message`. `/verify-phone` and `/complete-profile` read it
(`utils/telegramBot.js#codeChannelFromMessage`) to word their code card, and
every screen that waits for a phone code shows
`components/auth/TelegramCodeLink.vue` → `https://t.me/milliymock_bot?start=verify`
("Kodni Telegram orqali olish"): in the bot the user taps 📱, shares their
number, and gets the pending code — the fallback for numbers the bot doesn't
know yet and for SMS outages.

**TEMP (2026-08-16) — SMS is down again.** `SMS_AVAILABLE = false` in
`utils/postAuth.js` is the one switch. It drives `PHONE_VERIFY_REDIRECTS_ENABLED`
(every redirect into phone verification described below is off: the post-auth
detour to `/complete-profile`, start-test's 403 hand-off, login's `/verify-phone`
hand-off; `/complete-profile` itself saves the name/phone and finishes without an
OTP). `/register` is off this switch: phone sign-up runs through the Telegram
bot (next section), with no SMS anywhere in that flow. Because
`/complete-profile` is out of action, the *old* first-time gate is back as its
stand-in:
`PROFILE_GATE_MODAL_ENABLED = !SMS_AVAILABLE` makes `composables/useProfileGate.js`
open `components/ProfileGateModal.vue` before start-test (in `MathTestCard`,
`TestPage` and `useTestLauncher`) whenever firstName / lastName / fatherName is
missing — saved with `PUT /user`. Since 2026-09-14 the modal no longer asks for
(or gates on) a phone number: a number saved there could never be confirmed, so
nobody is made to give one. Signed-in users keep
using the site. Flip `SMS_AVAILABLE` back to `true` when SMS works again —
nothing else needs to change (the modal goes dormant by itself).

`/complete-profile` (`views/CompleteProfilePage.vue`, `requiresAuth`) collects
the real name (printed on the certificate) and confirms the phone via
`POST /auth/verify-my-phone` → verify-otp. It is a redirect target, not a wall:
`utils/postAuth.js#resolvePostAuthRoute` sends a fresh session there after
login / register / verify-phone when `authStore.needsProfileSetup`, and every
start-test call site (`MathTestCard`, `TestPage`, `composables/useTestLauncher`)
sends the user there on the backend's 403 (`error.phoneNotConfirmed`, set in
`stores/test.js`) with `?redirect=` back to where they were. Google and
Telegram sign-ins land there every time — neither supplies a phone. The old
client-side `ProfileGateModal` / `useProfileGate` gate is gone.

## The guard

Enforced in **three** places; a router-only check is not a boundary.

1. `router.beforeEach` — global, on `meta.requiresAuth`.
2. `beforeEnter` on the platform group's parent route.
3. `PlatformLayout.vue` — re-checks on mount and watches the auth state, so a
   token cleared mid-session ejects the user.

All three redirect to `{ name: 'register', query: { redirect: to.fullPath } }`.
Registration — not login — is the existing door; that is unchanged.

Auth state is `Boolean(localStorage['milliymock_token'])`
(`stores/auth.js`) — a synchronous read, no session request on load.
`utils/authToken.js` exposes a network-free peek at the same key so the
marketing shell can swap its CTA without importing the auth store.

## Redirects

| From | To | Where |
|---|---|---|
| `/pricing` | `/narxlar` | `public/serve.json` (301, crawlers) + router (client) + `public/_redirects` |
| `/ona-tili-demo` | `/ona-tili` | router |
| `/mashq` (prod) | `/` | router |
| `/ona-tili-demo-natija` (prod) | `/ona-tili` | router |

## SEO

`utils/seo.js` (`applySeo`, wired to `router.afterEach`) rewrites title,
description, robots, canonical and OG/Twitter tags from each route's `meta.seo`.
Static defaults live in `index.html`. `public/sitemap.xml` lists the public URLs.

Known limitation: meta is client-rendered, so non-JS crawlers see only the
static `index.html` tags.

## "Home" for signed-in users

Signed in, every "Bosh sahifa" link and the logo lead to `PLATFORM_HOME`
(`/dashboard`, from `composables/usePlatformEntry.js`), not to `/`. The landing
page would only offer "Platformaga kirish" again. Signed out, they lead to `/`.
The exception is "Chiqish" (sign out), which lands on `/` on purpose.

Opening the site at `/` with a token in localStorage (typing milliymock.uz, a
fresh tab, a bookmark) redirects to `PLATFORM_HOME` too — `router.beforeEach`,
first navigation of the page load only. In-app trips to `/` are left alone,
because sign-out navigates to `/` before it clears the token.

## Activity pings

`utils/presence.js` (started in `main.js`) tells the API that a signed-in user
still has the site open, for the backend's `LastSeenAt` and `UserSessions`.

- Sends `POST /api/user/ping` with `{ tabId, section, visible }` every 30 s, background
  tabs included, and at once on a section change or a tab visibility change.
  `tabId` is made once per page load, so the API can combine several tabs.
  Time counts as on screen if any tab is.
- Section comes from the route name via `SECTION_BY_ROUTE`; unlisted routes
  are `Other`. **Add new routes there**, or their time counts as Other.
- Guests make no request.
- A failed ping is dropped silently: it never goes through `apiFetch`, so it can't
  sign anyone out or redirect. A token about to expire is renewed first,
  because an idle open tab still counts as online.

## The landing page

Built from the Claude Design file `MilliyMock Landing.dc.html` (project
`332e13cf-38f5-4341-9eb7-7282d0d51c3a`), read via the DesignSync tool. The
design-tool runtimes `support.js` and `image-slot.js` are not carried over.

- `views/marketing/LandingPage.vue` composes four section SFCs from
  `components/marketing/`: `LandingHero`, `LandingStats`, `LandingFeatures`,
  `LandingCta`. Chrome (`LandingNavbar`, `LandingFooter`) lives in
  `MarketingLayout` so it also wraps the other marketing routes.
- Design tokens (colors, the Inter/Playfair font stacks) are in the `@theme`
  block of `src/assets/main.css`. Do not hardcode the design's hex values in
  components.
- Fonts load the way the rest of the repo loads them — a Google Fonts `@import`
  in `main.css`. Inter and Playfair are applied per-element via `font-inter` /
  `font-display`; the platform stays on DM Sans.
- Images live in `src/assets/landing/` and are imported by the components, the
  repo's existing convention.
- **Containers use `box-content`.** The design was authored without a CSS reset,
  so its `max-width: 1280px; padding: 0 48px` means 1280px of *content*.
  Tailwind's preflight sets `border-box`, which would render 1184px instead.
  `box-content` restores the design's real proportions. Same for the CTA
  banner's inner `max-width: 520px; padding: 64px`.
- The four nav links are the design's own in-page anchors, written as `/#id`
  so they work from any marketing route via the router's `scrollBehavior`.

### How the landing images were prepared

The design project's `assets/` cannot be pulled through the DesignSync tool in
usable form — it returns base64, which is fine to read but not to reproduce
byte-for-byte. Both images were therefore derived from the sources in
`Desktop/Milliymock/newaspects/`, with the scripts kept out of the repo:

- `logo-lockup.png` — cropped out of `Artboard 3 (3).png`. The artwork's
  bounding box there is 820×195 at (130, 442); the design's asset is 836×211,
  i.e. that box with 8px padding, so those exact bounds were used. White was
  converted to alpha over a black fill, which preserves the antialiased edges.
- `dashboard-figure.png` — the raw render carries dead backdrop around the plate
  and that backdrop sits *behind* the design's `drop-shadow(...)`, so the shadow
  would trace a rectangle instead of the plate. Cropped to content and the flat
  backdrop keyed to transparent. **Replaced 2026-08-08** with a render of the
  rebuilt Bosh sahifa (stats → chart → kurslar → So'nggi testlar); now 1532×925,
  backdrop `#F6F3F0`.
  The key marches in from each row's ends and stops at the first sustained run
  of plate-bright pixels — a plain threshold combs the near-white sidebar, and
  a flood fill leaks through the plate's dark border. Row boundaries are then
  median-smoothed so the rotated rectangle's edges stay straight, and the
  plate's own shadow fades in by depth rather than being cut, so no outline
  appears where it ends.

### Known deviations from the design

- **Hero avatars.** The design's three avatars are design-tool placeholders
  pointing at randomuser.me. Rendered as empty circles by request, so real
  photos can drop in without any layout change.
- **Responsive.** The design defines no breakpoints. Chosen behaviour: hero
  collapses to one column below `lg`; stats and features go 4 → 2 → 1 columns;
  nav links wrap to a second row below `lg`; the CTA staircase becomes a
  bottom band below `sm` so it stops running under the text.
- **No SupportButton** on marketing routes — it is not in the design.
- **Footer year** reads 2026, not the design's 2025 (confirmed).

# MilliyMock — platform design system

The platform is the logged-in product: a working tool, not a brochure. It is
deliberately a different visual world from the public landing (see
`PROJECT_MAP.md` → "The landing page"), which stays cream/black and expressive.

**Authority.** The approved Bosh sahifa mockup, `design-ref/dashboard-approved.png`.
It is a raster render, so values below are measured from it where geometry is
readable, and normalised where the render is noisy (an AI render's antialiasing
produces subpixel extremes like `#FF0001` that are not real values). Where this
file and the mockup disagree, the mockup wins — report the conflict.

Mode: **Operate**. Scanability, consistency and the real usage scene outrank
expression. Brand lives in precise details, not decoration.

## Measured from the mockup (1536×1024)

| Thing | Measurement |
|---|---|
| Sidebar width | 245px → **240px** implemented |
| Content padding | 40px left, 38px right → **40px** |
| Stat card row | 4 cards, ~292px wide, **16px** gaps, **186px** tall |
| Content column | 285 → 1498 = 1213px |
| Sidebar nav rhythm | ~61px per item |
| Active nav pill | 62px tall, fully rounded |

## Colour

The interface is neutral. Colour appears **only where it carries meaning**.
Never for decoration.

| Token | Value | Use |
|---|---|---|
| `app-bg` | `#FCFBFA` | page background, warm off-white |
| `app-surface` | `#FFFFFF` | cards |
| `app-sunken` | `#F8F6F3` | a card inside a card (weekly goal) |
| `app-tile` | `#F7F4F1` | circular icon tiles, nav hover |
| `app-warm` | `#F4EFEB` | the one warm accent surface (quote band) |
| `app-ink` | `#0A0A0A` | primary text, active pill, primary button |
| `app-muted` | `#8A857F` | secondary text, labels, axis ticks |
| `app-border` | `#EFEBE6` | hairlines, card borders, sidebar divider |

Semantic — measured backgrounds, normalised foregrounds:

| Token | Value | Meaning |
|---|---|---|
| `app-good` / `app-good-bg` | `#15803D` / `#E9F7EC` | improvement, strong score |
| `app-bad` / `app-bad-bg` | `#DC2626` / `#FEE3E2` | weak score |
| `app-info` / `app-info-bg` | `#5B4BD6` / `#EFEAFC` | in progress, being checked |
| `app-coin` | `#F5C23B` | **the coin icon only** |

Score thresholds: ≥70% good, <70% bad. In-progress states are info, never green.

## Type

Same family as the rest of the app (DM Sans). The platform does **not** use the
landing's Playfair — serif is the marketing voice.

| Role | Size / weight |
|---|---|
| Page greeting | 30px / 700 |
| Page subtitle | 15px / 400, muted |
| Card metric | 34px / 700 |
| Card label | 15px / 500 |
| Section heading | 20px / 700 |
| Body | 15px / 400 |
| Secondary / meta | 13px / 400, muted |

## Components

- **Card** — `app-surface`, radius 20px, `0 1px 2px rgba(16,15,14,.04), 0 8px 24px -12px rgba(16,15,14,.10)`, 24px padding. One shadow depth exists. Do not add a second.
- **Icon tile** — 48px circle, `app-tile`, thin (1.7) dark stroke icon inside. This is the only icon treatment.
- **Nav item** — 12px radius, icon + label; active is a solid `app-ink` pill with white text; hover is `app-tile`.
- **Pill button** — fully rounded; primary is `app-ink` on white text, secondary is `app-surface` with an `app-border` hairline.
- **Status badge** — fully rounded, semantic background + foreground pair, 13px/600.
- **Trend** — arrow glyph + percentage in `app-good`/`app-bad`, followed by muted context text.
- **Progress bar** — 6px, `app-border` track, `app-ink` fill.
- **Line chart** — inline SVG, `app-ink` 2px stroke, round joins, dots at each point, muted axis labels, faint area wash. No gridline chrome beyond horizontal ticks.
- **Subject mark** — 44px rounded-square (12px radius) on `app-tile` holding the subject's icon. Deliberately square, so it never reads as the circular icon tile: a circle is a *category* of thing, a square is a *specific subject*. *(Revised for Testlar — it previously held a single letter glyph, π/Δ/T. Once every subject had a real icon, a letter beside a calculator icon for the same subject read as two different systems.)*
- **Subject card** (`SubjectCard.vue`) — the Fanlar grid tile: 56px circular icon tile, name, what the subject covers, and the mock count on the card's baseline. The whole card is the link, never a card with a button inside it. Hover moves the card to `app-sunken` and the tile to white — no lift, because one shadow depth exists.
- **Skeleton** (`SkeletonBlock.vue`) — a pulsing `app-tile` block. Loading states are built by arranging these in the shape of the content that is coming, so nothing shifts when the data lands.
- **Test row** (`TestRow.vue`) — the long horizontal form of a mock: subject mark, the test's real title, `N savol • N ishlagan`, an optional PREMIUM badge, a status badge, and the primary action. **The action always starts a test**, because Testlar is where a student takes one — the same rule the public subject pages follow, where every card reads "Testni boshlash" whatever the student has done before. A finished test is offered again, not swapped for its result; results are Natijalar's job. The only exception is `progress`, which reads "Davom etish" and resumes the existing attempt so answers are not thrown away. Since every action is primary, every button is the ink one — none is the quiet secondary. State still drives the badge: `progress` → "Yechilmoqda", `done` → "Yakunlangan". The done badge is **neutral, not green** — the attempts endpoint returns a raw score with no maximum, so the row can say a test was finished but never how well; a coloured badge would imply a pass mark nothing measured. Below `sm` the status/action group takes its own full-width line. The row emits `action` rather than navigating, because starting a test can mean a confirm, a purchase or a top-up — the screen owns that. Shared by the dashboard and Testlar so a test looks identical wherever it appears.
- **Test card** (`TestCard.vue`) — the same mock in grid form, used inside a single subject where the tests differ only by date and the eye should scan them as a block. Subject mark, title, a corner state mark, the two figures that matter (savollar soni, ishtirokchilar), and the action across the foot. Rules that keep a grid tidy: the title has a **floor of two lines and a ceiling of three** — the floor lines the cards up, the ceiling stops "5-variant" being clipped off the only thing telling two mocks apart; the subject prefix is stripped from the title because the page heading already says it; a non-breaking hyphen keeps "1-smena" whole; and the badge line is reserved only when some test in that grid is premium, so one paid test cannot make its row taller. The corner mark is **only ever on a test the student has taken** — a green check for finished, an info clock for half-done, nothing at all otherwise. That is what makes it useful: it marks what you have already done.
- **Launch dialogs** (`TestLaunchDialogs.vue`) — the three confirmations between the row's button and the test: start, buy, top up. One component so every screen that lists tests asks the same questions in the same words. Built from the platform's own card/pill parts, not the naive-ui modal the public pages use.
- **Active attempt banner** (`ActiveAttemptBanner.vue`) — the way back into the student's one unfinished test, from `GET /user`'s `activeAttempt`. Built from existing parts: a card, the icon tile (clock while the time runs, pause when paused), an **info** badge ("Vaqt ketmoqda" / "Pauzada" — both are in-progress states, so neither is a warning), the test's title, `N ta javob berildi, N ta qoldi`, the time left, and the primary pill "Davom etish". A paused attempt's time is a static value; a running one counts down, and the banner hides itself when that reaches zero (nothing is left to continue). An untimed test shows no time. Rendered by `AppTopbar`, under the header, so it is on every platform screen.
- **Active attempt dialog** (`ActiveAttemptDialog.vue`, driven by `composables/useActiveAttemptGate.js`) — stops a start button from opening a second attempt while one is still open. The launch dialogs' surface, with a close ×, the same icon tile and info badge as the banner, and the open test's title and `N ta javob berildi, N ta qoldi` in a sunken box so the choice is made knowing how far along it is. Two actions: the primary pill "Testga o‘tish" (the safe one — resume it) and the secondary "Testni yakunlash" (submit it; a note above says it cannot be continued after and its result goes to Natijalar). Finishing toasts where the result will be, then the start confirmation that was interrupted carries on. The app tokens are global, so the public subject pages' `MathTestCard` uses it too.

### Question bank (`components/questionBank/`)

Built from the parts above; no new colours, shadows or icon style.

- **Difficulty badge** (`BankDifficultyBadge.vue`) — a neutral pill with a three-step signal (Oson / O‘rta / Qiyin). Never green/amber/red: colour here means how the *student* did, and a hard question is not a bad one.
- **Status mark** (`BankStatusMark.vue`) — the student's latest answer to a question: `checkCircle` good, `xCircle` bad, an empty hairline ring for not tried.
- **Answer option** (in `BankQuestionView.vue`) — letter circle + text in a 12px-radius row. Selected is an ink outline with a filled ink letter; after checking, the right option is `good`, a wrong pick `bad`, the rest fade. A square button beside each row crosses the option out (the exam's answer eliminator) and disappears once the answer is sent.
- **Player** (`BankPlayerLayout.vue`) — full-screen like the test page: slim header (back, where you are, clock, save, report), the question, a fixed footer for navigation. A question with a passage goes two-column from `lg`, the passage sticky on the left.
- **Palette** (`BankPalette.vue`) — the session's question map; same tones as the status mark, and plain ink for "answered" while a timed run hides results.
- **Dialog** (`BankDialog.vue`) — the launch dialogs' surface with a body slot (start a session, report a question, reset progress). The destructive confirm is the only `bad`-filled button.
- **Activity grid** (stats page) — a year of days as squares in ink at four strengths; still the neutral scale, not a new colour.

## Rules

- No new colours, card shapes, shadow depths, fonts, or a second icon style.
  Subject icons live in `AppIcon.vue` with everything else, on the same 24 grid
  at the same 1.7 stroke, and are referenced by name from `subjects.js` — never
  inlined at a call site, or the set drifts.
- Colour never decorates. A card is not green because it is nice.
- Every list ships an empty state and a skeleton loading state in the shape of
  its content. Empty states use `EmptyState.vue` — name what is missing, say
  what will appear here, offer the one action that fills it. Distinguish *the
  student has none* ("Siz hali test yechmagansiz") from *the system has none*
  ("Hozircha test qo'shilmagan"); they are different facts and need different
  copy.
- Two empty states on one screen must not say the same sentence. Each names its
  own subject — the activity card covers tests, essays and courses, so it reads
  "Hozircha faoliyat yo'q", not "Siz hali test yechmagansiz".
- An empty screen must not carry invented figures. With no history the stat
  cards read 0 or em dash with no trend, and per-user state (a score, an
  in-progress flag) is stripped from test rows rather than shown against a test
  the student never opened.
- Uzbek (Latin) throughout: Bosh sahifa, Testlar, Essay tekshirish, Natijalar,
  Narxlar, Yordam, Sozlamalar, Community, tanga, savol, smena, Testni boshlash,
  Premium.
- If a screen needs a component this system lacks, build it from existing parts
  and record the addition here.

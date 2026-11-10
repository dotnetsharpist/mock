# MilliyMock — platform design system

The platform is the logged-in product: a working tool, not a brochure. Since
2026-11-10 it speaks the **landing page's** visual language (see `PROJECT_MAP.md`
→ "The landing page"): Inter Tight, a soft neutral grey page, white sheets with
the landing's wide soft shadow, medium-weight headings, glossy black pill
buttons, and the landing's pastel light for the one thing on a screen worth
noticing.

**Landing parts, as platform utilities (`main.css`).**
- `.app-iris` — the pastel pink/lilac/blue surface. Black text on it. For the
  card that sells or celebrates (tanga banner, sidebar promo, Narxlar help card,
  the popular pack's mark). One per screen.
- `.app-glow` — the same light blurred behind a card.
- `.app-btn-ink` — the glossy black button. Every `a`/`button` with
  `bg-app-ink` inside the shell gets the same gloss automatically.
- Headings with `font-bold` render at 500 inside the shell (landing voice).
- **PageHero** (`components/app/PageHero.vue`) is Bosh sahifa's greeting only — not
  a header for other screens. Other screens keep their own structure and take
  the look through their parts (see subject tints below).
- **Subject tints** (`subjectTint()` in `components/app/subjects.js`): one pastel
  gradient per subject from the landing palette. Subject cards are filled with it;
  a result card's subject mark uses it. Colour says which subject, never how well.
- **Scores** are ink with a pastel gradient bar; "no certificate" is a soft pink
  pill, not red text.
- **Mascot** (`composables/useMascot.js`): 15 poses per gender in
  `src/assets/mascots/{boy,girl}/NN.webp`, cut from the user's sticker sheets.
  Gender is read from patronymic/surname (`utils/mascot.js`), boy when unclear.
  Each screen names the poses that fit; one is drawn per visit. `bored` (12) is
  never used in greetings. Full-size **EmptyState** shows a calm pose (errors: surprised).
- **Narxlar** is the reference screen for the new look: centred heading, packs on
  a grey tray with the popular pack lifted out in white, an `.app-iris` help card.

**Authority.** The current `views/app/DashboardPage.vue`. The warm mockup,
`design-ref/dashboard-approved.png`, is superseded. The full-screen `/test` and
`/explanation` pages have not moved yet and still use warm hexes.

Mode: **Operate**. Scanability, consistency and the real usage scene outrank
expression. Brand lives in precise details, not decoration.

## Measured from the mockup (1536×1024)

| Thing | Measurement |
|---|---|
| Sidebar width | **224px**, flush to the page edge |
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
| `app-bg` | `#E6E5E8` | page background |
| `app-surface` | `#FFFFFF` | cards, sidebar, pills |
| `app-sunken` | `#F5F5F6` | a card inside a card, row hover |
| `app-tile` | `#EFEEF1` | icon tiles, round icon buttons, active nav |
| `app-warm` | `#EBEAED` | hover on a tile |
| `app-ink` | `#1A1A1B` | primary text, primary button |
| `app-muted` | `#1A1A1B` | secondary text, labels, axis ticks. Equal to `app-ink` on purpose |
| `app-border` | `#E6E5E8` | hairlines, table rules |

Semantic — measured backgrounds, normalised foregrounds:

| Token | Value | Meaning |
|---|---|---|
| `app-good` / `app-good-bg` | `#15803D` / `#E9F7EC` | improvement, strong score |
| `app-bad` / `app-bad-bg` | `#DC2626` / `#FEE3E2` | weak score |
| `app-info` / `app-info-bg` | `#5B4BD6` / `#EFEAFC` | in progress, being checked |
| `app-coin` | `#0B0B0B` | the coin icon; ink since 2026-11-10 (gold clashed with the pastel) |

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

- **Card** — `app-surface`, radius 22px, 20px padding, flat: the grey page draws its edge. `main.css` rounds `rounded-xl`/`rounded-2xl` inside the shell, so screens need no per-card classes.
- **Textured block** (`.app-texture`) — near-black with broad diagonal bands of light. The first figure on Bosh sahifa and the sidebar's promoted card. `.app-texture-fine` is the same material at a score bar's scale.
- **Score bars** (Bosh sahifa) — one rounded bar per recent test, `.app-texture-fine`, the best solid `app-ink` with its figure inside.
- **Exam calendar** (Bosh sahifa) — a Monday-first month, always six rows, opening on the next exam's month. Exam days are filled `app-ink` tiles, today is an `app-ink` outline, days outside the month stay blank, and the "next exam" line below repeats the black tile as the legend. Dates live in `EXAM_DATES` in `DashboardPage.vue`. Names come from the messages: Chrome has no Uzbek calendar data, so never use `Intl` for them.
- **Recent tests table** (Bosh sahifa) — hairline rules, subject mark, grade as an `app-ink` pill. Subject and date fold under the title below md.
- **Icons** — Solar Line Duotone (open source, via Streamline) in `AppIcon.vue`: rounded joins and soft corners to match the edgeless UI; main stroke ink, secondary stroke ink at 70%, 1.9 stroke on a 24 grid, following `currentColor`. Check, plus and close are Phosphor glyphs. The only icon style.
- **Icon tile** — 48px circle, `app-tile`, duotone icon inside.
- **Nav item** — rounded, icon + label in `app-ink`; active is filled `app-ink` with white semibold text; hover is `app-tile`.
- **Pill button** — fully rounded; primary is `app-ink` on white text, secondary is `app-surface` with an `app-border` hairline.
- **Status badge** — fully rounded, semantic background + foreground pair, 13px/600.
- **Trend** — arrow glyph + percentage in `app-good`/`app-bad`, followed by muted context text.
- **Progress bar** — 6px, `app-border` track, `app-ink` fill.
- **Line chart** — inline SVG, `app-ink` 2px stroke, round joins, dots at each point, muted axis labels, faint area wash. No gridline chrome beyond horizontal ticks.
- **Subject mark** — 44px rounded-square (12px radius) on `app-tile` holding the subject's icon. Deliberately square, so it never reads as the circular icon tile: a circle is a *category* of thing, a square is a *specific subject*. *(Revised for Testlar — it previously held a single letter glyph, π/Δ/T. Once every subject had a real icon, a letter beside a calculator icon for the same subject read as two different systems.)*
- **Subject card** (`SubjectCard.vue`) — the Fanlar grid tile: 56px circular icon tile, name, what the subject covers, and the mock count on the card's baseline. The whole card is the link, never a card with a button inside it. Hover moves the card to `app-sunken` and the tile to white — no lift, because one shadow depth exists.
- **Skeleton** (`SkeletonBlock.vue`) — a pulsing `app-tile` block. Loading states are built by arranging these in the shape of the content that is coming, so nothing shifts when the data lands.
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

- No new colours (beyond the landing palette above), card shapes, shadow depths, fonts, or a second icon style.
  Subject icons live in `AppIcon.vue` with everything else, all Solar Line Duotone, and are referenced by name from `subjects.js` — never
  inlined at a call site, or the set drifts.
- Colour never decorates, except the landing's pastel light (`.app-iris`), once per screen. A card is not green because it is nice.
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

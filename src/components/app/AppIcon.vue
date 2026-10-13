<script setup>
// The platform's only icon style: thin (1.7) dark stroke on a 24 grid, round
// caps and joins. Every platform icon comes from here so a second style cannot
// creep in — see docs/DESIGN.md.
const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 20 },
})

const paths = {
  home: ['M4 10.5 12 4l8 6.5', 'M6 9.8V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9.8'],
  tests: ['M8 4h8a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z', 'M10 9h4', 'M10 13h4', 'M10 17h2'],
  essay: ['M12 20h8', 'M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z'],
  results: ['M5 20V12', 'M12 20V5', 'M19 20v-5'],
  // Statistika, not Natijalar: bars *inside* an axis frame, so the two
  // bar-chart items in the sidebar cannot be mistaken for each other.
  stats: ['M4.5 4v14.5a1 1 0 0 0 1 1H20', 'M8.6 16v-3.4', 'M12.6 16V8.5', 'M16.6 16v-5.6'],
  // A dollar mark, not the stacked-disc "database" cylinder it used to be —
  // that read as storage rather than money.
  coins: [
    'M12 3.2v17.6',
    'M16.6 7.4c-.8-1.3-2.6-2.1-4.6-2.1-2.5 0-4.4 1.2-4.4 3s1.8 2.7 4.4 3.3c2.9.7 4.8 1.5 4.8 3.4 0 2-2.1 3.1-4.8 3.1-2.3 0-4.1-.9-4.8-2.2',
  ],
  help: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M9.4 9.3a2.7 2.7 0 0 1 5.2.9c0 1.8-2.6 2.7-2.6 2.7', 'M12 17.2h.01'],
  settings: ['M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z', 'M19.1 14.6a1.6 1.6 0 0 0 .32 1.76l.06.06a1.9 1.9 0 1 1-2.7 2.7l-.05-.06a1.6 1.6 0 0 0-2.72 1.14v.17a1.9 1.9 0 1 1-3.8 0v-.09a1.6 1.6 0 0 0-2.8-1.1l-.06.06a1.9 1.9 0 1 1-2.7-2.7l.07-.06a1.6 1.6 0 0 0-1.14-2.72h-.17a1.9 1.9 0 1 1 0-3.8h.09a1.6 1.6 0 0 0 1.1-2.8l-.06-.06a1.9 1.9 0 1 1 2.7-2.7l.05.06a1.6 1.6 0 0 0 2.72-1.14v-.17a1.9 1.9 0 1 1 3.8 0v.09a1.6 1.6 0 0 0 2.8 1.1l.05-.06a1.9 1.9 0 1 1 2.7 2.7l-.06.05a1.6 1.6 0 0 0 1.14 2.72h.17a1.9 1.9 0 1 1 0 3.8h-.09a1.6 1.6 0 0 0-1.47.98Z'],
  community: ['M16.5 20v-1.7a3.4 3.4 0 0 0-3.4-3.4H6.9a3.4 3.4 0 0 0-3.4 3.4V20', 'M10 11.6a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z', 'M20.5 20v-1.7a3.4 3.4 0 0 0-2.6-3.3', 'M15.5 4.9a3.4 3.4 0 0 1 0 6.6'],
  bell: ['M18 8.6a6 6 0 1 0-12 0c0 6-2.4 7.7-2.4 7.7h16.8S18 14.6 18 8.6', 'M13.7 20a2 2 0 0 1-3.4 0'],
  clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 7v5.2l3.2 1.9'],
  trend: ['M3 17.5 9.5 11l4 4L21 7.5', 'M15.5 7.5H21v5.5'],
  book: ['M3 4.5h5a3.5 3.5 0 0 1 3.5 3.5v11a2.6 2.6 0 0 0-2.6-2.6H3Z', 'M21 4.5h-5A3.5 3.5 0 0 0 12.5 8v11a2.6 2.6 0 0 1 2.6-2.6H21Z'],
  chevronDown: ['m6 9.5 6 6 6-6'],
  arrowRight: ['M5 12h14', 'm13 6 6 6-6 6'],
  arrowLeft: ['M19 12H5', 'm11 18-6-6 6-6'],
  play: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'm10.3 8.9 5.1 3.1-5.1 3.1V8.9Z'],
  pause: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M10 9v6', 'M14 9v6'],
  check: ['m5 12.5 4.6 4.6L19 7.5'],
  plus: ['M12 5v14', 'M5 12h14'],
  trash: [
    'M3.6 6.4h16.8',
    'M8.6 6.4V4.9A1.4 1.4 0 0 1 10 3.5h4a1.4 1.4 0 0 1 1.4 1.4v1.5',
    'M18.4 6.4V19a1.5 1.5 0 0 1-1.5 1.5H7.1A1.5 1.5 0 0 1 5.6 19V6.4',
    'M10.2 10.4v6',
    'M13.8 10.4v6',
  ],
  upload: ['M12 15.6V3.8', 'm8.2 7.6 3.8-3.8 3.8 3.8', 'M4.2 15v4a1.5 1.5 0 0 0 1.5 1.5h12.6a1.5 1.5 0 0 0 1.5-1.5v-4'],
  filter: ['M3.6 5h16.8l-6.6 7.9v6.2l-3.6 1.9v-8.1L3.6 5Z'],
  sort: ['M4 6.5h10', 'M4 12h7', 'M4 17.5h4', 'M18 6v12', 'm15.2 15.2 2.8 2.8 2.8-2.8'],
  arrowUp: ['M12 19V5', 'm6 11 6-6 6 6'],
  search: ['M11 18.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z', 'm20.5 20.5-4.2-4.2'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  close: ['M18 6 6 18', 'M6 6l12 12'],
  logout: ['M9.5 20H5.5a1.5 1.5 0 0 1-1.5-1.5v-13A1.5 1.5 0 0 1 5.5 4h4', 'M15.5 16.5 20 12l-4.5-4.5', 'M20 12H9.5'],
  refresh: ['M20 11.5a8 8 0 0 0-13.7-5.2L3 9.5', 'M3 5v4.5h4.5', 'M4 12.5a8 8 0 0 0 13.7 5.2L21 14.5', 'M21 19v-4.5h-4.5'],
  chevronRight: ['m9.5 6 6 6-6 6'],
  send: ['M20.5 3.5 11 13', 'M20.5 3.5 14.5 20.5l-3.5-7.5-7.5-3.5Z'],
  cap: ['M12 4 2.5 8.7 12 13.4l9.5-4.7L12 4Z', 'M6.5 11v4.6c0 .5.3 1 .8 1.2a10.6 10.6 0 0 0 9.4 0c.5-.2.8-.7.8-1.2V11'],
  info: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 11.2v5', 'M12 7.9h.01'],
  infinity: [
    'M7 8.5a3.5 3.5 0 1 0 0 7c1.6 0 2.7-1 3.6-2l2.8-3c.9-1 2-2 3.6-2a3.5 3.5 0 0 1 0 7c-1.6 0-2.7-1-3.6-2l-2.8-3c-.9-1-2-2-3.6-2Z',
  ],
  checkCircle: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'm8.4 12.2 2.5 2.5 4.7-4.9'],
  calendar: ['M7 3.5V6', 'M17 3.5V6', 'M4.5 9.2h15', 'M5.5 5h13a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-12A1.5 1.5 0 0 1 5.5 5Z'],
  user: ['M19 20v-1.8a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4V20', 'M12 10.6a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z'],

  // Question bank. A stack of sheets for the bank itself; the rest are its
  // per-question actions and statuses.
  layers: ['M12 3.5 2.8 8.2 12 12.9l9.2-4.7L12 3.5Z', 'm2.8 12.2 9.2 4.7 9.2-4.7', 'm2.8 16.2 9.2 4.7 9.2-4.7'],
  bookmark: ['M6.5 4.6a1.1 1.1 0 0 1 1.1-1.1h8.8a1.1 1.1 0 0 1 1.1 1.1v15.6L12 16.6l-5.5 3.6V4.6Z'],
  flag: ['M5 21V4.5', 'M5 4.5h11.2l-1.9 4.1 1.9 4.1H5'],
  xCircle: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'm9.2 9.2 5.6 5.6', 'm14.8 9.2-5.6 5.6'],
  grid: ['M4.5 4.5h5.5V10H4.5Z', 'M14 4.5h5.5V10H14Z', 'M4.5 14h5.5v5.5H4.5Z', 'M14 14h5.5v5.5H14Z'],
  flame: [
    'M12 21c-3.6 0-6.5-2.6-6.5-6.3 0-3.1 2.1-5 3.6-6.6.4 1.7 1.3 2.8 2.4 3.4C11.3 8.3 12.6 5.4 15 3c.3 3.4 3.5 5.6 3.5 10.8C18.5 18 15.6 21 12 21Z',
  ],

  // Subject icons. Same 24 grid and 1.7 stroke as everything above, so a grid of
  // mixed subjects reads as one system rather than assorted marks. One icon per
  // subject, referenced from components/app/subjects.js — never inline.
  // Keys are dashes, not dots: a `h.01` dot renders at the stroke width, which
  // is 1.4px once a 24-grid icon is drawn at 20 — visible as grey specks rather
  // than keys. The screen keeps 2.1 units of interior for the same reason; at
  // 3 units the stroke closes over it and it reads as a filled bar.
  calculator: [
    'M7.2 3.4h9.6a1.8 1.8 0 0 1 1.8 1.8v13.6a1.8 1.8 0 0 1-1.8 1.8H7.2a1.8 1.8 0 0 1-1.8-1.8V5.2a1.8 1.8 0 0 1 1.8-1.8Z',
    'M8.6 6.5h6.8v3.8H8.6Z',
    'M8.7 13.7h1.2',
    'M11.4 13.7h1.2',
    'M14.1 13.7h1.2',
    'M8.7 17.1h1.2',
    'M11.4 17.1h1.2',
    'M14.1 17.1h1.2',
  ],
  // Two orbits at ±45°, nucleus in the middle. The orbits are Béziers with the
  // rotation baked in: an `A` arc across the ellipse's own major axis is a
  // degenerate 180° case, and the large-arc flag sent it the long way round —
  // which is why this used to render as a rounded blob instead of an atom.
  atom: [
    'M12 13.7a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4Z',
    'M18.79 18.79C17.19 20.39 12.85 18.65 9.1 14.9C5.35 11.15 3.61 6.81 5.21 5.21C6.81 3.61 11.15 5.35 14.9 9.1C18.65 12.85 20.39 17.19 18.79 18.79Z',
    'M18.79 5.21C20.39 6.81 18.65 11.15 14.9 14.9C11.15 18.65 6.81 20.39 5.21 18.79C3.61 17.19 5.35 12.85 9.1 9.1C12.85 5.35 17.19 3.61 18.79 5.21Z',
  ],
  flask: [
    'M9 3h6',
    'M10 3v6.6a2 2 0 0 1-.28 1.02l-4.4 7.4A1.5 1.5 0 0 0 6.6 20.3h10.8a1.5 1.5 0 0 0 1.28-2.28l-4.4-7.4A2 2 0 0 1 14 9.6V3',
    'M7.7 15.2h8.6',
  ],
  // Three columns, not four: at four the 3.7-unit gaps close up to barely a
  // pixel at 20px and the portico turns into a smudge.
  landmark: [
    'M12 3.4 20.2 8.2H3.8Z',
    'M4.6 10.9h14.8',
    'M7.4 11.2v6.3',
    'M12 11.2v6.3',
    'M16.6 11.2v6.3',
    'M3.6 20.2h16.8',
  ],
  // Equator and one meridian. The second latitude line crowded the lower third
  // of the sphere and bought no extra meaning.
  globe: [
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
    'M3.2 12h17.6',
    'M12 3a13.5 13.5 0 0 1 3.5 9 13.5 13.5 0 0 1-3.5 9 13.5 13.5 0 0 1-3.5-9A13.5 13.5 0 0 1 12 3Z',
  ],
  languages: [
    'M2.6 6.2h10.8',
    'M8 3.4v2.8',
    'M11.2 6.2c0 4-3.1 7.7-7.4 9.6',
    'M6.1 11.4c1 2 2.9 3.6 5.1 4.4',
    'm21.4 20.8-4.2-8.8-4.2 8.8',
    'M14.3 17.6h5.8',
  ],
  monitor: [
    'M4.2 4.6h15.6a1.7 1.7 0 0 1 1.7 1.7v8.8a1.7 1.7 0 0 1-1.7 1.7H4.2a1.7 1.7 0 0 1-1.7-1.7V6.3a1.7 1.7 0 0 1 1.7-1.7Z',
    'M9 20h6',
    'M12 16.8V20',
  ],
  leaf: [
    'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z',
    'M2.5 20.6c0-2.9 1.9-5.2 5-5.8 2.4-.5 4.5-2 5.5-3.3',
  ],
}
</script>

<template>
  <svg
    :width="props.size"
    :height="props.size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path v-for="(dAttr, i) in paths[props.name] || []" :key="i" :d="dAttr" />
  </svg>
</template>

<script setup>
import { computed } from 'vue'
import gerbSvg from '@/assets/gerb.svg?raw'
// The paper itself: the guilloché sheet with its border and corner lattice.
import paperUrl from '@/assets/certificate-bg.webp'
import { urlFor } from '@/composables/useMascot'
import { guessGender } from '@/utils/mascot'

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
})

// The photo box shows the student's mascot (girl or boy, read from the names
// printed on the certificate) in the OK pose, instead of an empty silhouette.
const mascot = computed(() =>
  urlFor(guessGender({ lastName: props.data.lastName, fatherName: props.data.fatherName }) === 'female' ? 'girl' : 'boy', 'ok'),
)

// A round rubber stamp, the way a real one is struck: double ring, wording
// around the rim, a band across the middle, slightly worn ink. Built as an SVG data URI and shown through <img> so html2canvas
// (the PDF export) draws it exactly as the screen does.
// The emblem file is 1080×1080 with no viewBox, so shrunk to the 140px logo
// box it showed only its empty top-left corner. The viewBox frames just the
// emblem (the canvas has wide empty margins) so it fills the box.
const gerbMarkup = gerbSvg
  .replace(/<\?xml[^>]*>\s*/i, '')
  .replace(/<svg\b(?![^>]*viewBox)/, '<svg viewBox="130 120 820 820"')
  .trim()

// "Amal qilish muddati": the real certificate is valid three years less a day
// from issue (09.12.2025 → 08.12.2028). issuedDate arrives as dd.mm.yyyy.
const validUntil = computed(() => {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(props.data.issuedDate || ''))
  if (!match) return ''
  const date = new Date(Number(match[3]) + 3, Number(match[2]) - 1, Number(match[1]) - 1)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`
})

const STAMP_INK = '#b3372a'
const stampSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <filter id="worn" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise"/>
      <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.1 1.3" result="holes"/>
      <feComposite in="SourceGraphic" in2="holes" operator="in"/>
    </filter>
    <path id="rim-top" d="M 28 100 A 72 72 0 0 1 172 100"/>
    <path id="rim-bottom" d="M 22 100 A 78 78 0 0 0 178 100"/>
  </defs>
  <g filter="url(#worn)" fill="none" stroke="${STAMP_INK}" font-family="Arial Black, Arial, Helvetica, sans-serif" font-weight="900">
    <circle cx="100" cy="100" r="95" stroke-width="5"/>
    <circle cx="100" cy="100" r="86" stroke-width="1.6"/>
    <circle cx="100" cy="100" r="54" stroke-width="1.6"/>
    <text fill="${STAMP_INK}" stroke="none" font-size="17" letter-spacing="3">
      <textPath href="#rim-top" startOffset="50%" text-anchor="middle">MILLIY MOCK</textPath>
    </text>
    <text fill="${STAMP_INK}" stroke="none" font-size="13" letter-spacing="2.5">
      <textPath href="#rim-bottom" startOffset="50%" text-anchor="middle">SINOV SERTIFIKATI</textPath>
    </text>
    <rect x="10" y="83" width="180" height="34" rx="3" fill="#f3e6c5" stroke-width="3"/>
    <text x="100" y="107" text-anchor="middle" fill="${STAMP_INK}" stroke="none" font-size="15" letter-spacing="0.6">ORIGINAL EMAS</text>
    <text x="100" y="72" text-anchor="middle" fill="${STAMP_INK}" stroke="none" font-size="12" letter-spacing="2">★ UZ ★</text>
    <text x="100" y="139" text-anchor="middle" fill="${STAMP_INK}" stroke="none" font-size="11" letter-spacing="2">${new Date().getFullYear()}</text>
  </g>
</svg>`
const stampSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(stampSvg)}`

</script>

<template>
  <div class="certificate-page" :style="{ backgroundImage: `url(${paperUrl})` }">

    <div class="content">
      <div
        class="logo"
        role="img"
        aria-label="O'zbekiston gerbi"
        v-html="gerbMarkup"
      />

      <h1 class="top-title">
        O‘ZBEKISTON RESPUBLIKASI OLIY TA’LIM, FAN VA INNOVATSIYALAR VAZIRLIGI<br />
        HUZURIDAGI BILIM VA MALAKALARNI BAHOLASH AGENTLIGI
      </h1>

      <hr class="divider-strong" />

      <h2 class="main-title">
        {{ data.subject }} BILISH DARAJASI<br />
        TO‘G‘RISIDA SERTIFIKAT
      </h2>

      <div class="certificate-number">
        <span class="label">Sertifikat raqami:</span>
        <span class="value">{{ data.certificateNumber }}</span>
      </div>

      <hr class="divider-soft" />

      <div class="info-section">
        <div class="info-grid">
          <div class="label">Talabgorning shaxsiy kodi:</div>
          <div class="value">{{ data.personalCode }}</div>

          <div class="label">Familiyasi:</div>
          <div class="value">{{ data.lastName }}</div>

          <div class="label">Ismi:</div>
          <div class="value">{{ data.firstName }}</div>

          <div class="label">Otasining ismi:</div>
          <div class="value">{{ data.fatherName }}</div>
        </div>

        <!-- Where the photo goes on the real one: the student's mascot. -->
        <div class="photo">
          <img :src="mascot" alt="" class="photo-mascot" />
        </div>
      </div>

      <hr class="divider-soft" />

      <div class="subject-grid">
        <div class="label">Umumta’lim fani:</div>
        <div class="value">{{ data.subjectLine }}</div>

        <div class="label">Umumiy to‘plagan bali:</div>
        <div class="value">{{ data.totalScore }}</div>

        <div class="label">Umumiy ballga nisbatan foiz ko‘rsatkichi:</div>
        <div class="value">{{ data.percentage }}</div>

        <div class="label">Sertifikat darajasi:</div>
        <div class="value">{{ data.grade }}</div>
      </div>

      <div class="results-title">Bo‘limlar bo‘yicha test sinovi natijalari:</div>

      <div class="results">
        <template v-for="row in data.resultRows" :key="row.name">
          <div class="name">{{ row.name }}</div>
          <div class="score">{{ row.score }}</div>
        </template>
      </div>

      <hr class="divider-soft divider-foot" />

      <div class="bottom-meta">
        <div>
          <span class="label">Berilgan sanasi:</span>
          <span class="value">{{ data.issuedDate }}</span>
        </div>
        <div v-if="validUntil">
          <span class="label">Amal qilish muddati:</span>
          <span class="value">{{ validUntil }}</span>
        </div>
      </div>

      <!-- Where the real one has the director's QR code: the "not original"
           stamp, so this can never pass for the real document. -->
      <div class="stamp-row">
        <img :src="stampSrc" alt="" class="fake-stamp" aria-hidden="true" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Laid out after the real BMBA certificate. The paper, border band and
   corner lattice all come from the background image (bound in the template so
   html2canvas sees a plain background-image); the text sits on top. */
.certificate-page {
  position: relative;
  width: 794px;
  min-height: 1123px;
  color: #1c1a16;
  background-color: #e4d6a4;
  background-size: 100% 100%;
  background-repeat: no-repeat;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  z-index: 1;
  font-family: 'DejaVu Serif', 'Noto Serif', Georgia, 'Times New Roman', serif;
}

.content {
  position: relative;
  z-index: 3;
  /* Bottom padding keeps the stamp inside the frame's bottom rule. */
  padding: 56px 76px 60px;
}

.logo {
  width: 132px;
  height: 132px;
  margin: 0 auto 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.logo :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}

.top-title {
  text-align: center;
  font-size: 14.5px;
  font-weight: 700;
  line-height: 1.45;
  text-transform: uppercase;
  margin: 0;
}

.divider-strong {
  border: none;
  border-top: 3px solid #1c1a16;
  margin: 22px 0 18px;
}

.main-title {
  text-align: center;
  font-size: 17px;
  line-height: 1.5;
  font-weight: 700;
  text-transform: uppercase;
  margin: 0 0 18px;
}

.label {
  font-weight: 400;
  color: #3b382f;
}

.value {
  font-weight: 700;
  color: #141210;
}

.certificate-number {
  display: grid;
  grid-template-columns: 58% 1fr;
  font-size: 15px;
  margin-bottom: 4px;
}

.divider-soft {
  border: none;
  border-top: 1px solid rgba(60, 55, 40, 0.25);
  margin: 10px 0 14px;
}

.info-section {
  display: grid;
  grid-template-columns: 1fr 116px;
  gap: 24px;
  align-items: start;
}

.info-grid {
  display: grid;
  grid-template-columns: 250px 1fr;
  row-gap: 10px;
  font-size: 15px;
  padding-top: 4px;
}

.photo {
  width: 116px;
  height: 148px;
  border: 1px solid rgba(60, 55, 40, 0.35);
  background: linear-gradient(180deg, #f6f1dd 0%, #e6dcb4 100%);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
}

/* The mascot stands on the frame's floor like a passport photo. */
.photo-mascot {
  width: 94%;
  height: 94%;
  object-fit: contain;
  object-position: bottom center;
  display: block;
}

.subject-grid {
  display: grid;
  grid-template-columns: 58% 1fr;
  row-gap: 10px;
  font-size: 16px;
  margin: 4px 0 0;
}

.results-title {
  margin: 28px 0 10px;
  font-size: 15px;
  font-weight: 700;
}

.results {
  display: grid;
  grid-template-columns: 1fr auto;
  row-gap: 6px;
  column-gap: 24px;
  font-size: 14px;
  min-height: 60px;
}

.results .name {
  color: #3b382f;
}

.results .score {
  text-align: right;
  color: #3b382f;
  font-variant-numeric: tabular-nums;
}

.divider-foot {
  margin: 18px 0 14px;
}

.bottom-meta {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 15px;
}

.stamp-row {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

/* Round rubber stamp (SVG in script), set straight. */
.fake-stamp {
  width: 116px;
  height: 116px;
  opacity: 0.9;
  mix-blend-mode: multiply;
  pointer-events: none;
}
</style>

import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { guessGender } from '@/utils/mascot'

// The platform's mascot: a girl or a boy (read from the profile, see
// utils/mascot.js; the boy when the name says neither), in one of 15 poses cut
// from the two sticker sheets in src/assets/mascots/{boy,girl}/NN.webp.
//
// A screen names the poses that suit it; one of them is drawn once per mount,
// so a page has a different mood on every visit but holds still while open.
export const POSES = {
  wave: '01',
  thumbsUp: '02',
  thinking: '03',
  laptop: '04',
  idea: '05',
  reading: '06',
  celebrate: '07',
  relax: '08',
  coffee: '09',
  presenting: '10',
  surprised: '11',
  bored: '12',
  headphones: '13',
  meditate: '14',
  ok: '15',
}

const FILES = import.meta.glob('@/assets/mascots/*/*.webp', { eager: true, import: 'default' })

// The URL of one pose, for places that pick it themselves (the certificate).
export function urlFor(gender, pose) {
  const entry = Object.entries(FILES).find(([path]) => path.endsWith(`/${gender}/${POSES[pose]}.webp`))
  return entry?.[1] || ''
}

// `poses`: names from POSES. Every pose except `bored` when left out.
export function useMascot(poses = Object.keys(POSES).filter((pose) => pose !== 'bored')) {
  const authStore = useAuthStore()
  const pick = poses[Math.floor(Math.random() * poses.length)]
  return computed(() =>
    urlFor(guessGender(authStore.userInfo) === 'female' ? 'girl' : 'boy', pick),
  )
}

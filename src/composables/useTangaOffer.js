import { ref } from 'vue'

// One pack picker for the whole platform, mounted once in AppShell
// (TangaOfferDialog). Any screen calls openOffer() to sell tanga where the
// student already is, instead of sending them away to /tanga and losing the
// test or essay they were about to start.
//
// Module-level so every caller drives the same dialog.
const isOpen = ref(false)
// How many more tanga the student needs for what they tried to do; 0 when the
// offer is not tied to a purchase. Picks which pack the dialog points at.
const needed = ref(0)

export function useTangaOffer() {
  function openOffer(shortBy = 0) {
    needed.value = Math.max(0, Number(shortBy) || 0)
    isOpen.value = true
  }

  function closeOffer() {
    isOpen.value = false
  }

  return { isOpen, needed, openOffer, closeOffer }
}

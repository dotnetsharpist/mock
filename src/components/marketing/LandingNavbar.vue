<script setup>
// Landing navigation, from `MilliyMock Landing.dc.html`.
//
// Below lg the links collapse into a menu button. They used to wrap onto a
// second row under the logo, which pushed the hero down and read as two
// separate bars rather than one navigation.
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePlatformEntry } from '@/composables/usePlatformEntry'
import LanguageSwitch from '@/components/LanguageSwitch.vue'
import logoLockup from '@/assets/landing/logo-lockup.png'

const navItems = [
  // Platforma is the one link that is no longer an in-page anchor: `/platforma`
  // is now a real page (the screen tour), and a four-word feature column on the
  // landing page was a weaker answer than the thing itself.
  { label: 'platform', to: '/platforma' },
  { label: 'reviews', to: '/fikrlar' },
  // The essay analysis screen has its own page — better than an anchor to a
  // four-word feature column, and it keeps /platforma about the platform.
  { label: 'essay', to: '/essay-tekshirish' },
  // Courses do not exist yet, so this leads to the page that says so — an
  // anchor to a four-word feature column implied they were already there.
  { label: 'courses', to: '/kurslar' },
]

const { t } = useI18n()
const { enter } = usePlatformEntry()

const open = ref(false)
const route = useRoute()

// Two of the links point at the same route, so navigating does not always
// change the path — close on every click as well as on a real navigation.
watch(() => route.fullPath, () => {
  open.value = false
})
</script>

<template>
  <div class="relative">
    <nav
      class="mx-auto box-content flex max-w-[1280px] items-center justify-between px-[20px] py-[18px] sm:px-[32px] lg:h-[92px] lg:px-[48px] lg:py-0"
      :aria-label="t('landingNav.label')"
    >
      <RouterLink
        to="/"
        class="flex items-center rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
      >
        <img
          :src="logoLockup"
          alt="Milliy Mock"
          width="107"
          height="27"
          class="block h-[27px] w-auto"
        />
      </RouterLink>

      <div
        class="hidden items-center text-[15px] font-medium lg:flex lg:gap-[40px]"
      >
        <RouterLink
          v-for="item in navItems"
          :key="item.label"
          :to="item.to"
          class="rounded-sm text-navlink transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
        >
          {{ t(`landingNav.${item.label}`) }}
        </RouterLink>
      </div>

      <!-- The language switch stays outside the collapsed menu: a visitor who
           doesn't read Uzbek has no reason to open a menu labelled in it. -->
      <div class="flex items-center gap-[12px] lg:gap-[20px]">
        <LanguageSwitch tone="landing" />

        <RouterLink
          :to="enter"
          class="hidden items-center gap-[9px] whitespace-nowrap rounded-full bg-ink px-[24px] py-[12px] text-[15px] font-medium text-white transition-transform duration-200 hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink motion-reduce:hover:scale-100 lg:inline-flex"
        >
          {{ t('landingNav.enter') }} <span class="text-[15px]" aria-hidden="true">→</span>
        </RouterLink>

        <button
          type="button"
          class="-mr-[8px] inline-flex h-[40px] w-[40px] items-center justify-center rounded-full text-navlink transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink lg:hidden"
          :aria-expanded="open"
          aria-controls="menyu"
          :aria-label="open ? t('landingNav.closeMenu') : t('landingNav.openMenu')"
          @click="open = !open"
        >
          <!-- Bare lines in the nav-link grey, no chrome around them: at this size
               a filled ink tile carried more weight than the logo opposite it. -->
          <svg
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <template v-if="!open">
              <path d="M3 6h16M3 11h16M3 16h16" />
            </template>
            <template v-else>
              <path d="M5.5 5.5l11 11M16.5 5.5l-11 11" />
            </template>
          </svg>
        </button>
      </div>
    </nav>

    <!-- The panel overlays the page rather than pushing it down, so opening the
         menu never scrolls the hero out from under the reader. -->
    <div
      v-show="open"
      id="menyu"
      class="absolute inset-x-0 top-full z-40 px-[20px] pb-[16px] sm:px-[32px] lg:hidden"
    >
      <div
        class="flex flex-col rounded-[16px] border border-hairline bg-white p-[8px] shadow-[0_10px_28px_rgba(17,17,17,0.06)]"
      >
        <RouterLink
          v-for="item in navItems"
          :key="item.label"
          :to="item.to"
          class="rounded-[12px] px-[14px] py-[13px] text-[16px] font-medium text-navlink transition-colors hover:bg-tile hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          @click="open = false"
        >
          {{ t(`landingNav.${item.label}`) }}
        </RouterLink>

        <RouterLink
          :to="enter"
          class="mt-[6px] inline-flex items-center justify-center gap-[9px] rounded-full bg-ink px-[24px] py-[14px] text-[16px] font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          @click="open = false"
        >
          {{ t('landingNav.enter') }} <span aria-hidden="true">→</span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

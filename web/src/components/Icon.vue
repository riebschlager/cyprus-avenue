<script setup lang="ts">
import { computed } from 'vue'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  AudioLines,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Disc3,
  Download,
  ExternalLink,
  Info,
  Link,
  ListPlus,
  LoaderCircle,
  LogOut,
  Menu,
  Pause,
  Play,
  Search,
  Shuffle,
  SkipBack,
  SkipForward,
  TriangleAlert,
  X
} from 'lucide-vue-next'

// Lucide subset, keyed by kebab-case name. Add icons here as needed.
const ICONS = {
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'arrow-up': ArrowUp,
  'audio-lines': AudioLines,
  'check': Check,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'circle-alert': CircleAlert,
  'disc-3': Disc3,
  'download': Download,
  'external-link': ExternalLink,
  'info': Info,
  'link': Link,
  'list-plus': ListPlus,
  'loader-circle': LoaderCircle,
  'log-out': LogOut,
  'menu': Menu,
  'pause': Pause,
  'play': Play,
  'search': Search,
  'shuffle': Shuffle,
  'skip-back': SkipBack,
  'skip-forward': SkipForward,
  'triangle-alert': TriangleAlert,
  'x': X
} as const

export type IconName = keyof typeof ICONS

const props = defineProps<{
  name: IconName
  label?: string
}>()

const component = computed(() => ICONS[props.name])
</script>

<template>
  <span
    class="ca-icon"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : true"
  >
    <component :is="component" :stroke-width="1.75" />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ToastNotification } from '../types/spotify'

const props = defineProps<{
  toast: ToastNotification
}>()

const emit = defineEmits<{
  close: []
}>()

const bgColor = computed(() => {
  switch (props.toast.type) {
    case 'success':
      return 'bg-green-500/20 border-green-500/50'
    case 'error':
      return 'bg-red-500/20 border-red-500/50'
    case 'warning':
      return 'bg-yellow-500/20 border-yellow-500/50'
    case 'info':
    default:
      return 'bg-blue-500/20 border-blue-500/50'
  }
})

const textColor = computed(() => {
  switch (props.toast.type) {
    case 'success':
      return 'text-green-300'
    case 'error':
      return 'text-red-300'
    case 'warning':
      return 'text-yellow-300'
    case 'info':
    default:
      return 'text-blue-300'
  }
})

const icon = computed(() => {
  switch (props.toast.type) {
    case 'success':
      return '✓'
    case 'error':
      return '✕'
    case 'warning':
      return '⚠'
    case 'info':
    default:
      return 'ℹ'
  }
})
</script>

<template>
  <div
    :class="[
      'fixed bottom-4 right-4 p-4 rounded-lg border backdrop-blur-sm transition-all duration-300',
      'flex items-center gap-3 max-w-md',
      bgColor,
      'animate-in fade-in slide-in-from-bottom-2'
    ]"
  >
    <span :class="['flex-shrink-0 text-xl font-bold', textColor]">{{ icon }}</span>
    <p :class="['flex-1 text-sm', textColor]">{{ toast.message }}</p>
    <button
      @click="emit('close')"
      :class="[
        'flex-shrink-0 text-lg font-bold transition-opacity hover:opacity-70',
        textColor
      ]"
      aria-label="Close notification"
    >
      ×
    </button>
  </div>
</template>

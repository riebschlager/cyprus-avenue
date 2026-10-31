<script setup lang="ts">
import { computed } from 'vue'
import type { ToastNotification } from '../types/toast'
import Icon, { type IconName } from './Icon.vue'

const props = defineProps<{
  toast: ToastNotification
}>()

const emit = defineEmits<{
  close: []
}>()

const variantClass = computed(() => {
  switch (props.toast.type) {
    case 'success':
      return 'ca-toast--success'
    case 'error':
      return 'ca-toast--error'
    default:
      return ''
  }
})

const icon = computed<IconName>(() => {
  switch (props.toast.type) {
    case 'success':
      return 'check'
    case 'error':
      return 'circle-alert'
    case 'warning':
      return 'triangle-alert'
    case 'info':
    default:
      return 'info'
  }
})
</script>

<template>
  <div :class="['ca-toast', variantClass]" :role="toast.type === 'error' ? 'alert' : 'status'">
    <Icon :name="icon" />
    <p class="ca-toast__msg">{{ toast.message }}</p>
    <button
      type="button"
      class="ca-iconbtn ca-iconbtn--sm"
      @click="emit('close')"
      aria-label="Dismiss notification"
    >
      <Icon name="x" />
    </button>
  </div>
</template>

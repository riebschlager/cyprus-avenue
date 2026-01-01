<script setup lang="ts">
import { useToast } from '../composables/useToast'
import Toast from './Toast.vue'

const { toasts, removeToast } = useToast()
</script>

<template>
  <div class="fixed bottom-0 right-0 z-50 pointer-events-none">
    <TransitionGroup
      name="toast"
      tag="div"
      class="flex flex-col gap-2 p-4 pointer-events-auto"
    >
      <Toast
        v-for="toast in toasts"
        :key="toast.id"
        :toast="toast"
        @close="removeToast(toast.id)"
      />
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(10px);
}
</style>

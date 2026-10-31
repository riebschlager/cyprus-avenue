<script setup lang="ts">
withDefaults(defineProps<{ currentPage: number; totalPages: number; compact?: boolean }>(), { compact: false })
const emit = defineEmits<{ change: [page: number] }>()
</script>

<template>
  <nav v-if="totalPages > 1" aria-label="Pagination" class="flex items-center justify-center gap-2 text-sm text-gray-400">
    <button type="button" @click="emit('change', currentPage - 1)" :disabled="currentPage <= 1"
      class="rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      :class="compact ? 'px-3 py-1' : 'px-4 py-2'">Previous</button>
    <span class="px-2 py-1" aria-live="polite">Page {{ currentPage }} of {{ totalPages }}</span>
    <button type="button" @click="emit('change', currentPage + 1)" :disabled="currentPage >= totalPages"
      class="rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      :class="compact ? 'px-3 py-1' : 'px-4 py-2'">Next</button>
  </nav>
</template>

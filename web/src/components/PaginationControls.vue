<script setup lang="ts">
import Icon from './Icon.vue'
withDefaults(defineProps<{ currentPage: number; totalPages: number; compact?: boolean }>(), { compact: false })
const emit = defineEmits<{ change: [page: number] }>()
</script>

<template>
  <nav v-if="totalPages > 1" aria-label="Pagination" class="flex items-center justify-center gap-3">
    <button type="button" @click="emit('change', currentPage - 1)" :disabled="currentPage <= 1"
      class="ca-btn ca-btn--secondary" :class="{ 'ca-btn--sm': compact }">
      <Icon name="arrow-left" />Previous
    </button>
    <span class="ca-label" aria-live="polite">Page {{ currentPage }} of {{ totalPages }}</span>
    <button type="button" @click="emit('change', currentPage + 1)" :disabled="currentPage >= totalPages"
      class="ca-btn ca-btn--secondary" :class="{ 'ca-btn--sm': compact }">
      Next<Icon name="arrow-right" />
    </button>
  </nav>
</template>

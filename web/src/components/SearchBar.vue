<script setup lang="ts">
import { computed } from 'vue'
import { usePlaylists, type SearchFilter } from '../composables/usePlaylists'
import Icon from './Icon.vue'

const props = defineProps<{
  modelValue: string
  filters?: SearchFilter[]
  filterOptions?: Array<{ id: SearchFilter; label: string }>
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:filters': [value: SearchFilter[]]
}>()

const { toggleSearchFilter, searchFilters } = usePlaylists()

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const defaultFilterOptions: Array<{ id: SearchFilter; label: string }> = [
  { id: 'playlist', label: 'Playlists' },
  { id: 'artist', label: 'Artists' },
  { id: 'song', label: 'Songs' }
]

const resolvedFilters = computed(() => props.filters ?? searchFilters.value)
const resolvedOptions = computed(() => props.filterOptions ?? defaultFilterOptions)
const resolvedPlaceholder = computed(() => props.placeholder ?? 'Search shows, artists or songs')

const toggleFilter = (filter: SearchFilter) => {
  if (props.filters) {
    const isActive = resolvedFilters.value.includes(filter)
    const nextFilters = isActive
      ? resolvedFilters.value.filter(active => active !== filter)
      : [...resolvedFilters.value, filter]
    if (nextFilters.length === 0) return
    emit('update:filters', nextFilters)
    return
  }

  toggleSearchFilter(filter)
}

const isFilterActive = (filter: SearchFilter) => {
  return resolvedFilters.value.includes(filter)
}
</script>

<template>
  <div class="flex flex-col lg:flex-row lg:items-center gap-3">
    <label class="ca-search flex-1">
      <Icon name="search" />
      <input
        type="text"
        :value="modelValue"
        @input="handleInput"
        :placeholder="resolvedPlaceholder"
        :aria-label="resolvedPlaceholder"
      />
    </label>

    <div class="flex flex-wrap items-center gap-2" role="group" aria-label="Search in">
      <span class="ca-label ca-label--sm mr-1">Search in</span>
      <button
        v-for="filter in resolvedOptions"
        :key="filter.id"
        type="button"
        @click="toggleFilter(filter.id)"
        class="ca-tag"
        :class="{ 'ca-tag--active': isFilterActive(filter.id) }"
        :aria-pressed="isFilterActive(filter.id)"
      >
        <Icon v-if="isFilterActive(filter.id)" name="check" />
        {{ filter.label }}
      </button>
    </div>
  </div>
</template>

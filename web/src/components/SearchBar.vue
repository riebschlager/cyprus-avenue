<script setup lang="ts">
import { usePlaylists, type SearchFilter } from '../composables/usePlaylists'

defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { toggleSearchFilter, isFilterActive } = usePlaylists()

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const filters: Array<{ id: SearchFilter; label: string }> = [
  { id: 'playlist', label: 'Playlists' },
  { id: 'artist', label: 'Artists' },
  { id: 'song', label: 'Songs' }
]
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
    <!-- Search Input (spans 2 columns on large screens) -->
    <div class="lg:col-span-2 relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        :value="modelValue"
        @input="handleInput"
        class="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-lg leading-5 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        placeholder="Search playlists, artists, or songs..."
      />
    </div>

    <!-- Filter Buttons (1 column on large screens) -->
    <div class="flex items-center gap-2">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="filter in filters"
          :key="filter.id"
          @click="toggleSearchFilter(filter.id)"
          :class="[
            'px-3 py-2 rounded text-sm font-medium transition-colors flex-1 sm:flex-none flex items-center gap-2',
            isFilterActive(filter.id)
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500'
              : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-600'
          ]"
        >
          <svg v-if="isFilterActive(filter.id)" class="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          <svg v-else class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ filter.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, useId, watch } from 'vue'
import { useDropdownState } from '../composables/useDropdownState'
import { DOWNLOAD_FORMATS, type DownloadFormat } from '../utils/downloadFormats'
withDefaults(defineProps<{ label?: string }>(), { label: 'Download' })
const emit = defineEmits<{ download: [format: DownloadFormat] }>()
const id = useId()
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const { isOpen, toggle, close, currentOpenDropdownId, checkIfShouldClose } = useDropdownState(id)
watch(currentOpenDropdownId, checkIfShouldClose)
const dismiss = (event: PointerEvent) => {
  if (event.target instanceof Node && !root.value?.contains(event.target)) close()
}
const escape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isOpen.value) { close(); trigger.value?.focus() }
}
const download = (format: DownloadFormat) => { close(); emit('download', format) }
onMounted(() => { document.addEventListener('pointerdown', dismiss); document.addEventListener('keydown', escape) })
onUnmounted(() => { close(); document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', escape) })
</script>

<template>
  <div ref="root" class="relative inline-block">
    <button ref="trigger" type="button" @click="toggle" :aria-expanded="isOpen" :aria-controls="id"
      class="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/50 font-semibold py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      {{ label }}
    </button>
    <div v-if="isOpen" :id="id" class="absolute right-0 mt-2 w-40 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-10">
      <button v-for="format in DOWNLOAD_FORMATS" :key="format.value" type="button" @click="download(format.value)"
        class="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors first:rounded-t-lg last:rounded-b-lg">{{ format.label }}</button>
    </div>
  </div>
</template>

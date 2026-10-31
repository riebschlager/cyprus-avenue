<script setup lang="ts">
import { onMounted, onUnmounted, ref, useId, watch } from 'vue'
import { useDropdownState } from '../composables/useDropdownState'
import { DOWNLOAD_FORMATS, type DownloadFormat } from '../utils/downloadFormats'
import Icon from './Icon.vue'
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
      class="ca-btn ca-btn--ghost w-full">
      <Icon name="download" />
      {{ label }}
      <Icon name="chevron-down" />
    </button>
    <div v-if="isOpen" :id="id" class="ca-menu download-menu">
      <div class="ca-menu__label"><span class="ca-label ca-label--sm">Download as</span></div>
      <button v-for="format in DOWNLOAD_FORMATS" :key="format.value" type="button" @click="download(format.value)"
        class="ca-menu__item">
        {{ format.label }}
        <span class="ca-menu__hint">.{{ format.value }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.download-menu { position: absolute; top: calc(100% + 4px); right: 0; }
</style>

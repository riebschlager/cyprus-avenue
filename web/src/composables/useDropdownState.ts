import { ref } from 'vue'

// Singleton state to track which dropdown is currently open
const currentOpenDropdownId = ref<string | null>(null)

export function useDropdownState(dropdownId: string) {
  const isOpen = ref(false)

  const open = () => {
    // Close any previously open dropdown
    if (currentOpenDropdownId.value && currentOpenDropdownId.value !== dropdownId) {
      // The previous dropdown will close itself via the watcher
    }
    currentOpenDropdownId.value = dropdownId
    isOpen.value = true
  }

  const close = () => {
    if (currentOpenDropdownId.value === dropdownId) {
      currentOpenDropdownId.value = null
    }
    isOpen.value = false
  }

  const toggle = () => {
    if (isOpen.value) {
      close()
    } else {
      open()
    }
  }

  // Watch for changes to currentOpenDropdownId and close this dropdown if another opens
  const checkIfShouldClose = () => {
    if (currentOpenDropdownId.value !== dropdownId && isOpen.value) {
      isOpen.value = false
    }
  }

  return {
    isOpen,
    open,
    close,
    toggle,
    checkIfShouldClose,
    currentOpenDropdownId
  }
}

import { ref, computed, onMounted, onUnmounted, watch, type Ref } from 'vue'

export interface KeyboardNavigationOptions {
  /** Total number of items in the list */
  itemCount: Ref<number>
  /** Current page (1-indexed) */
  currentPage: Ref<number>
  /** Items per page */
  itemsPerPage: number
  /** Callback when page changes */
  onPageChange: (page: number) => void
  /** Callback when item is selected (Enter key) */
  onSelect?: (index: number) => void
  /** Whether navigation is enabled */
  enabled?: Ref<boolean>
}

export function useKeyboardNavigation(options: KeyboardNavigationOptions) {
  const {
    itemCount,
    currentPage,
    itemsPerPage,
    onPageChange,
    onSelect,
    enabled = ref(true)
  } = options

  // Focused index within the current page (0 to itemsPerPage-1)
  const focusedIndex = ref<number | null>(null)

  // Total pages
  const totalPages = computed(() => Math.ceil(itemCount.value / itemsPerPage))

  // Items on current page
  const itemsOnCurrentPage = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    const remaining = itemCount.value - start
    return Math.min(remaining, itemsPerPage)
  })

  // Global index (across all pages)
  const globalFocusedIndex = computed(() => {
    if (focusedIndex.value === null) return null
    return (currentPage.value - 1) * itemsPerPage + focusedIndex.value
  })

  // Check if an element is an input/textarea/etc that should capture keyboard events
  function isInputElement(element: Element | null): boolean {
    if (!element) return false
    const tagName = element.tagName.toLowerCase()
    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      element.getAttribute('contenteditable') === 'true'
    )
  }

  // Move focus down (j key)
  function focusNext() {
    if (!enabled.value) return

    if (focusedIndex.value === null) {
      // Start at first item
      focusedIndex.value = 0
    } else if (focusedIndex.value < itemsOnCurrentPage.value - 1) {
      // Move within current page
      focusedIndex.value++
    } else if (currentPage.value < totalPages.value) {
      // Move to next page
      onPageChange(currentPage.value + 1)
      focusedIndex.value = 0
    }
    // At last item of last page - do nothing
  }

  // Move focus up (k key)
  function focusPrevious() {
    if (!enabled.value) return

    if (focusedIndex.value === null) {
      // Start at last item on current page
      focusedIndex.value = itemsOnCurrentPage.value - 1
    } else if (focusedIndex.value > 0) {
      // Move within current page
      focusedIndex.value--
    } else if (currentPage.value > 1) {
      // Move to previous page
      onPageChange(currentPage.value - 1)
      // Will be set to last item after page change via watcher
      focusedIndex.value = itemsPerPage - 1
    }
    // At first item of first page - do nothing
  }

  // Clear focus (Escape key)
  function clearFocus() {
    focusedIndex.value = null
  }

  // Select focused item (Enter key)
  function selectFocused() {
    if (!enabled.value) return
    if (focusedIndex.value !== null && onSelect) {
      onSelect(focusedIndex.value)
    }
  }

  // Jump to first item (g then g, or Home)
  function focusFirst() {
    if (!enabled.value) return
    if (currentPage.value !== 1) {
      onPageChange(1)
    }
    focusedIndex.value = 0
  }

  // Jump to last item (G or End)
  function focusLast() {
    if (!enabled.value) return
    if (currentPage.value !== totalPages.value) {
      onPageChange(totalPages.value)
    }
    // Calculate items on last page
    const itemsOnLastPage = itemCount.value - (totalPages.value - 1) * itemsPerPage
    focusedIndex.value = itemsOnLastPage - 1
  }

  // Keyboard event handler
  function handleKeyDown(event: KeyboardEvent) {
    // Don't handle if disabled
    if (!enabled.value) return

    // Don't handle if focus is in an input element
    if (isInputElement(document.activeElement)) return

    // Don't handle if modifier keys are pressed (except shift for G)
    if (event.ctrlKey || event.altKey || event.metaKey) return

    switch (event.key) {
      case 'j':
        event.preventDefault()
        focusNext()
        break
      case 'k':
        event.preventDefault()
        focusPrevious()
        break
      case 'Enter':
        if (focusedIndex.value !== null) {
          event.preventDefault()
          selectFocused()
        }
        break
      case 'Escape':
        event.preventDefault()
        clearFocus()
        break
      case 'g':
        // Simple g for first item (not vim-style gg)
        if (!event.shiftKey) {
          event.preventDefault()
          focusFirst()
        }
        break
      case 'G':
        // Shift+G for last item
        event.preventDefault()
        focusLast()
        break
      case 'Home':
        event.preventDefault()
        focusFirst()
        break
      case 'End':
        event.preventDefault()
        focusLast()
        break
    }
  }

  // Reset focus when page changes
  watch(currentPage, () => {
    // Keep focus valid if it exceeds items on new page
    if (focusedIndex.value !== null && focusedIndex.value >= itemsOnCurrentPage.value) {
      focusedIndex.value = Math.max(0, itemsOnCurrentPage.value - 1)
    }
  })

  // Reset focus when item count changes significantly
  watch(itemCount, (newCount, oldCount) => {
    if (focusedIndex.value !== null && newCount < oldCount) {
      // If items were removed, ensure focus is still valid
      if (focusedIndex.value >= itemsOnCurrentPage.value) {
        focusedIndex.value = Math.max(0, itemsOnCurrentPage.value - 1)
      }
    }
  })

  // Set up and tear down event listener
  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })

  return {
    /** Index of focused item within current page (0-indexed), null if none focused */
    focusedIndex,
    /** Global index across all pages, null if none focused */
    globalFocusedIndex,
    /** Move focus to next item */
    focusNext,
    /** Move focus to previous item */
    focusPrevious,
    /** Clear current focus */
    clearFocus,
    /** Select (toggle/activate) the focused item */
    selectFocused,
    /** Jump to first item */
    focusFirst,
    /** Jump to last item */
    focusLast,
    /** Set focus to specific index on current page */
    setFocus: (index: number | null) => { focusedIndex.value = index }
  }
}

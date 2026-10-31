import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'

export function usePagination<T>(items: MaybeRefOrGetter<T[]>, itemsPerPage = 20) {
  const currentPage = ref(1)
  const totalItems = computed(() => toValue(items).length)
  const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage))
  const paginatedItems = computed(() => toValue(items).slice(
    (currentPage.value - 1) * itemsPerPage, currentPage.value * itemsPerPage))
  const displayedRange = computed(() => totalItems.value === 0 ? '0' :
    `${(currentPage.value - 1) * itemsPerPage + 1}-${Math.min(currentPage.value * itemsPerPage, totalItems.value)}`)
  watch(totalPages, pages => { currentPage.value = Math.min(currentPage.value, Math.max(1, pages)) }, { flush: 'sync' })
  const changePage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
  return { currentPage, itemsPerPage, totalItems, totalPages, paginatedItems, displayedRange, changePage }
}

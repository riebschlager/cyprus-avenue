import { ref } from 'vue'

const isMenuOpen = ref(false)

export function useMobileMenu() {
  const toggleMenu = () => {
    isMenuOpen.value = !isMenuOpen.value
  }

  const closeMenu = () => {
    isMenuOpen.value = false
  }

  return {
    isMenuOpen,
    toggleMenu,
    closeMenu
  }
}

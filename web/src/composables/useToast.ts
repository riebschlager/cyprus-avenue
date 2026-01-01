import { ref, computed } from 'vue'
import type { ToastNotification } from '../types/spotify'
import { TOAST_DURATION } from '../utils/spotifyConstants'

const toasts = ref<ToastNotification[]>([])

export function useToast() {
  const addToast = (
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    duration: number = TOAST_DURATION
  ): string => {
    const id = Math.random().toString(36).substr(2, 9)
    const notification: ToastNotification = {
      id,
      type,
      message,
      duration
    }

    toasts.value.push(notification)

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }

  const removeToast = (id: string) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  const success = (message: string, duration?: number) => {
    return addToast(message, 'success', duration)
  }

  const error = (message: string, duration?: number) => {
    return addToast(message, 'error', duration)
  }

  const warning = (message: string, duration?: number) => {
    return addToast(message, 'warning', duration)
  }

  const info = (message: string, duration?: number) => {
    return addToast(message, 'info', duration)
  }

  return {
    toasts: computed(() => toasts.value),
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  }
}

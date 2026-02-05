/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified wait time has elapsed since the last invocation.
 *
 * @param fn - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns A debounced function with cancel() and flush() methods
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  wait: number
): {
  (...args: Parameters<T>): void
  cancel: () => void
  flush: () => void
} {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<T> | null = null

  const cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    lastArgs = null
  }

  const flush = () => {
    if (timeoutId !== null && lastArgs !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
      fn(...lastArgs)
      lastArgs = null
    }
  }

  const debounced = (...args: Parameters<T>) => {
    lastArgs = args

    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      timeoutId = null
      if (lastArgs !== null) {
        fn(...lastArgs)
        lastArgs = null
      }
    }, wait)
  }

  debounced.cancel = cancel
  debounced.flush = flush

  return debounced
}

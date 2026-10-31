/** Archive dates are calendar dates, independent of the reader's timezone. */
export function parseArchiveDate(value: string): Date {
  const date = new Date(`${value}T00:00:00Z`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value) {
    throw new Error(`Invalid archive date: ${value}`)
  }
  return date
}

export function formatArchiveDate(value: string, month: 'long' | 'short' = 'long'): string {
  return parseArchiveDate(value).toLocaleDateString('en-US', {
    year: 'numeric', month, day: 'numeric', timeZone: 'UTC'
  })
}

/** Compare anniversaries using UTC arithmetic, including leap days and year wraparound.
 * Today uses the visitor's local calendar; archive dates never use local parsing.
 */
export function isWithinArchiveWeek(value: string, today = new Date()): boolean {
  const date = parseArchiveDate(value)
  const target = Date.UTC(2000, today.getMonth(), today.getDate())
  const check = Date.UTC(2000, date.getUTCMonth(), date.getUTCDate())
  const days = Math.abs(target - check) / 86_400_000
  return Math.min(days, 366 - days) <= 3
}

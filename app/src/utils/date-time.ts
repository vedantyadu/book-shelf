export function formatDateFromSecondsTimestamp(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Helpers around the bundled demo dataset (`/sample_expenses.csv`, mirrored
 * from the project root `sample_data/` folder by `sample_data/generate.py`).
 *
 * - `downloadSampleCsv()` — triggers a browser download of the CSV.
 * - `loadDemoData(importCsv)` — fetches the CSV and pushes it through the
 *   existing `useExpenses().importCsv` API so the dashboard, AI insights and
 *   reports all light up exactly as if a user had uploaded the file.
 */
const SAMPLE_URL = '/sample_expenses.csv'
const SAMPLE_FILENAME = 'fundsight_sample_expenses.csv'

export async function fetchSampleCsv() {
  const res = await fetch(SAMPLE_URL, { cache: 'no-cache' })
  if (!res.ok) throw new Error(`Failed to load sample CSV (${res.status})`)
  const text = await res.text()
  return text
}

export async function downloadSampleCsv() {
  const text = await fetchSampleCsv()
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = SAMPLE_FILENAME
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/**
 * Fetch the bundled CSV and pipe it through the supplied `importCsv` function
 * (typically `useExpenses().importCsv`). Returns the import summary.
 */
export async function loadDemoData(importCsv) {
  const text = await fetchSampleCsv()
  const file = new File([text], SAMPLE_FILENAME, { type: 'text/csv' })
  return importCsv(file)
}

import { useRef, useState } from 'react'
import { Upload, FileText, Download } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { downloadSampleCsv } from '@/lib/demoData'

export function CsvImportModal({ open, onClose, onImport, importing }) {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const reset = () => { setFile(null); setResult(null); setError('') }

  const handleFile = (f) => {
    setError('')
    if (!f) return
    if (!f.name.endsWith('.csv')) { setError('Please choose a .csv file'); return }
    setFile(f); setResult(null)
  }

  const submit = async () => {
    if (!file) return
    setError('')
    try {
      const r = await onImport(file)
      setResult(r)
    } catch (e) {
      setError(e?.message || 'Import failed')
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose() }}
      title="Import expenses from CSV"
      description="Required: Amount, Category. Optional: Date, Description, PaymentMethod, UserType, location, beneficiary, project_id."
      footer={
        <>
          <Button variant="ghost" type="button" onClick={() => downloadSampleCsv().catch(() => {})}>
            <Download size={14} /> Download sample
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={() => { reset(); onClose() }} type="button">Close</Button>
          <Button onClick={submit} disabled={!file || importing}>{importing ? 'Importing…' : 'Upload'}</Button>
        </>
      }
    >
      <label
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]) }}
        className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border hover:border-primary/40 p-8 cursor-pointer transition"
      >
        <Upload className="text-muted-foreground" />
        <div className="text-sm">
          {file
            ? <span className="inline-flex items-center gap-1.5"><FileText size={14} className="text-primary" />{file.name}</span>
            : <>Drop a CSV here or <span className="text-primary">click to browse</span></>}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={e => handleFile(e.target.files?.[0])}
        />
      </label>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      {result && (
        <div className="mt-4 rounded-xl border border-border p-4 text-sm space-y-2">
          <div><span className="font-medium text-emerald-500">{result.inserted}</span> inserted of {result.total}.</div>
          {result.errors?.length > 0 && (
            <details>
              <summary className="cursor-pointer text-red-500">{result.errors.length} row error{result.errors.length === 1 ? '' : 's'}</summary>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground max-h-40 overflow-y-auto">
                {result.errors.slice(0, 50).map((e, i) => (
                  <li key={i}>Row {e.row}: {JSON.stringify(e.fields || e.error)}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </Modal>
  )
}

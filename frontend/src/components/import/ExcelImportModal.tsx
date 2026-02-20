import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  X, Upload, ChevronRight, ChevronLeft, Check, AlertCircle,
  FileSpreadsheet, FileText, FileJson, File, AlertTriangle,
} from 'lucide-react';
import { importApi, type ImportPayload, type ImportCompany } from '../../api/import';
import type { ImportPreview } from '../../types';

const ORG_ID = 'demo-org-123';

interface Props {
  groupId: string;
  groupName: string;
  onClose: () => void;
  onSuccess: () => void;
}

type FileType = 'csv' | 'xlsx' | 'pdf';
type Step = 'upload' | 'single_mapping' | 'mapping' | 'preview' | 'confirm' | 'pdf_failed';

// ── Status normalisation ───────────────────────────────────────
const STATUS_MAP: Record<string, string> = {
  // Turkish
  'uyumlu': 'compliant',
  'kısmi': 'partial',
  'kısmi uyumlu': 'partial',
  'uyumsuz': 'non_compliant',
  'değerlendirilmedi': 'not_assessed',
  'evet': 'compliant',
  'hayır': 'non_compliant',
  // English
  'compliant': 'compliant',
  'fully compliant': 'compliant',
  'met': 'compliant',
  'yes': 'compliant',
  'pass': 'compliant',
  '1': 'compliant',
  'partial': 'partial',
  'partially compliant': 'partial',
  'partially met': 'partial',
  'partly': 'partial',
  'in progress': 'partial',
  'non_compliant': 'non_compliant',
  'non-compliant': 'non_compliant',
  'noncompliant': 'non_compliant',
  'not compliant': 'non_compliant',
  'not met': 'non_compliant',
  'fail': 'non_compliant',
  'no': 'non_compliant',
  '0': 'non_compliant',
  'not_assessed': 'not_assessed',
  'not assessed': 'not_assessed',
  'n/a': 'not_assessed',
  'na': 'not_assessed',
  'not applicable': 'not_assessed',
  '': 'not_assessed',
};

function normalizeStatus(raw: string): string {
  return STATUS_MAP[raw.toLowerCase().trim()] ?? 'not_assessed';
}

// ── Fuzzy column header detection ─────────────────────────────
function detectColumn(headers: string[], keywords: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].toLowerCase();
    if (keywords.some(k => h.includes(k))) return i;
  }
  return -1;
}

// ── Helpers ───────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Component ─────────────────────────────────────────────────
export default function ExcelImportModal({ groupId: _groupId, groupName, onClose, onSuccess }: Props) {
  const [step, setStep]             = useState<Step>('upload');
  const [fileType, setFileType]     = useState<FileType>('csv');
  const [fileName, setFileName]     = useState('');
  const [fileSize, setFileSize]     = useState(0);
  const [parsing, setParsing]       = useState(false);

  // Parsed data (all modes)
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows,    setRows]    = useState<string[][]>([]);

  // Single-company mode (xlsx / pdf)
  const [singleMode,        setSingleMode]        = useState(false);
  const [singleCompanyName, setSingleCompanyName] = useState('');
  const [singleMapping,     setSingleMapping]     = useState({ control_col: 0, status_col: 2, notes_col: 3 });

  // Multi-company CSV mode (existing)
  const [format,  setFormat]  = useState<'wide' | 'long'>('wide');
  const [mapping, setMapping] = useState({
    company_col: 0, subcategory_col: 1, status_col: 2,
    subcategory_row_col: 0, first_company_col: 1,
  });

  // Common
  const [assessmentName, setAssessmentName] = useState('Import');
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [preview,        setPreview]        = useState<ImportPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [confirming,     setConfirming]     = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [pdfFailMsg,     setPdfFailMsg]     = useState('');

  const fileRef = useRef<HTMLInputElement>(null);

  // ── File dispatch ──────────────────────────────────────────
  const handleFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) { setError('File exceeds the 10 MB limit.'); return; }
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    setFileName(file.name);
    setFileSize(file.size);
    setError(null);
    if (ext === 'xlsx' || ext === 'xls') handleXlsx(file);
    else if (ext === 'pdf')              handlePdf(file);
    else                                 handleCsv(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  // ── CSV handler (unchanged behaviour) ─────────────────────
  const parseCSV = (text: string): string[][] => {
    const delimiter = text.includes('\t') ? '\t' : ',';
    return text.trim().split('\n').map(line =>
      line.split(delimiter).map(cell => cell.replace(/^"|"$/g, '').trim())
    );
  };

  const handleCsv = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length < 2) { setError('File must have at least a header row and one data row.'); return; }
      setFileType('csv');
      setSingleMode(false);
      setHeaders(parsed[0]);
      setRows(parsed.slice(1));
      setStep('mapping');
    };
    reader.readAsText(file);
  };

  // ── XLSX handler ───────────────────────────────────────────
  const handleXlsx = (file: File) => {
    setParsing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb   = XLSX.read(data, { type: 'array' });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const aoa  = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' }) as string[][];

        if (aoa.length < 2) { setError('XLSX file appears to be empty.'); setParsing(false); return; }

        const hdrs     = aoa[0].map(String);
        const dataRows = aoa.slice(1).map(r => r.map(String));

        // Auto-detect columns with fuzzy matching
        const cIdx = detectColumn(hdrs, ['control', 'id', 'subcategory', 'code', 'ref']);
        const sIdx = detectColumn(hdrs, ['status', 'compliance', 'result', 'rating', 'uyum']);
        const nIdx = detectColumn(hdrs, ['notes', 'evidence', 'comment', 'description', 'not']);

        setFileType('xlsx');
        setSingleMode(true);
        setHeaders(hdrs.length ? hdrs : ['Col 1', 'Col 2', 'Col 3', 'Col 4']);
        setRows(dataRows);
        setSingleMapping({
          control_col: cIdx >= 0 ? cIdx : 0,
          status_col:  sIdx >= 0 ? sIdx : Math.min(2, hdrs.length - 1),
          notes_col:   nIdx >= 0 ? nIdx : Math.min(3, hdrs.length - 1),
        });
        setStep('single_mapping');
      } catch {
        setError('Failed to parse XLSX. Please make sure it is a valid Excel file.');
      } finally {
        setParsing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // ── PDF handler ────────────────────────────────────────────
  const handlePdf = async (file: File) => {
    setParsing(true);
    try {
      // Dynamic import keeps pdfjs-dist out of the initial bundle
      const pdfjsLib = await import('pdfjs-dist');
      (pdfjsLib.GlobalWorkerOptions as { workerSrc: string }).workerSrc =
        `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const tc   = await page.getTextContent();
        fullText  += tc.items.map((item: unknown) => ((item as { str?: string }).str ?? '')).join(' ') + '\n';
      }

      // Match CSF control IDs: e.g. GV.OC-01, ID.AM-02
      const csfRegex = /\b([A-Z]{2,3}\.[A-Z]{2,3}-\d{2})\b/g;
      const statusKw = {
        compliant:     ['compliant', 'fully compliant', 'met', 'yes', 'pass', 'uyumlu'],
        partial:       ['partial', 'partially', 'partly', 'kısmi'],
        non_compliant: ['non-compliant', 'non_compliant', 'not met', 'not compliant', 'fail', 'uyumsuz'],
      };

      const matches: string[][] = [];
      let m: RegExpExecArray | null;
      while ((m = csfRegex.exec(fullText)) !== null) {
        const id  = m[1];
        const ctx = fullText.slice(Math.max(0, m.index - 20), m.index + id.length + 120).toLowerCase();

        let status = 'not_assessed';
        for (const [s, kws] of Object.entries(statusKw)) {
          if (kws.some(k => ctx.includes(k))) { status = s; break; }
        }
        matches.push([id, '', status, '']);
      }

      // De-duplicate (same ID may appear multiple times in PDF)
      const seen = new Set<string>();
      const unique = matches.filter(r => { if (seen.has(r[0])) return false; seen.add(r[0]); return true; });

      if (unique.length < 3) {
        setPdfFailMsg(
          unique.length === 0
            ? 'No NIST CSF control IDs (e.g. GV.OC-01) were found in this PDF.'
            : `Only ${unique.length} control IDs were found. The PDF may not be in a recognized format.`
        );
        setStep('pdf_failed');
      } else {
        setFileType('pdf');
        setSingleMode(true);
        setHeaders(['Control ID', 'Name', 'Status', 'Notes']);
        setRows(unique);
        setSingleMapping({ control_col: 0, status_col: 2, notes_col: 3 });
        setStep('single_mapping');
      }
    } catch (err) {
      setPdfFailMsg('Could not read the PDF: ' + (err instanceof Error ? err.message : 'unknown error'));
      setStep('pdf_failed');
    } finally {
      setParsing(false);
    }
  };

  // ── Payload builders ───────────────────────────────────────
  const buildSingleCompanyPayload = (): ImportPayload => {
    const items = rows
      .filter(r => r[singleMapping.control_col]?.trim())
      .map(r => ({
        subcategory_id: r[singleMapping.control_col].trim().toUpperCase(),
        status: normalizeStatus(r[singleMapping.status_col] ?? ''),
        notes: r[singleMapping.notes_col]?.trim() || undefined,
      }));
    return {
      organization_id: ORG_ID,
      group_name: groupName,
      companies: [{ name: singleCompanyName.trim() || 'Imported Company', items }],
      assessment_name: assessmentName,
      assessment_date: assessmentDate,
    };
  };

  const buildCsvPayload = (): ImportPayload => {
    const companies: ImportCompany[] = [];
    if (format === 'wide') {
      const companyNames = headers.slice(mapping.first_company_col);
      for (let ci = 0; ci < companyNames.length; ci++) {
        const items = rows
          .filter(r => r[mapping.subcategory_row_col])
          .map(r => ({
            subcategory_id: r[mapping.subcategory_row_col].trim(),
            status: normalizeStatus(r[mapping.first_company_col + ci] || ''),
          }));
        companies.push({ name: companyNames[ci], items });
      }
    } else {
      const map: Record<string, ImportCompany> = {};
      for (const r of rows) {
        const cName  = r[mapping.company_col]?.trim();
        const subId  = r[mapping.subcategory_col]?.trim();
        const rawSt  = r[mapping.status_col]?.trim() || '';
        if (!cName || !subId) continue;
        if (!map[cName]) map[cName] = { name: cName, items: [] };
        map[cName].items.push({ subcategory_id: subId, status: normalizeStatus(rawSt) });
      }
      companies.push(...Object.values(map));
    }
    return {
      organization_id: ORG_ID,
      group_name: groupName,
      companies,
      assessment_name: assessmentName,
      assessment_date: assessmentDate,
    };
  };

  // ── Preview / Confirm ──────────────────────────────────────
  const handlePreview = async () => {
    try {
      setLoadingPreview(true);
      setError(null);
      const payload = singleMode ? buildSingleCompanyPayload() : buildCsvPayload();
      const res = await importApi.preview(payload);
      setPreview(res.data);
      setStep('preview');
    } catch {
      setError('Failed to generate preview. Check your column mapping.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setConfirming(true);
      setError(null);
      const payload = singleMode ? buildSingleCompanyPayload() : buildCsvPayload();
      await importApi.confirm(payload);
      onSuccess();
    } catch {
      setError('Import failed. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  const resetToUpload = () => {
    setStep('upload');
    setError(null);
    setPdfFailMsg('');
    setFileName('');
    setFileSize(0);
    setRows([]);
    setHeaders([]);
    setSingleCompanyName('');
    if (fileRef.current) fileRef.current.value = '';
  };

  // ── Styles ────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8, padding: '8px 12px',
    fontFamily: 'Manrope, sans-serif', fontSize: 13, color: '#F8FAFC', outline: 'none',
  };
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700,
    color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
  };

  // ── Step sequence ──────────────────────────────────────────
  const STEP_ORDER: Step[] = singleMode
    ? ['upload', 'single_mapping', 'preview', 'confirm']
    : ['upload', 'mapping', 'preview', 'confirm'];

  const stepIdx  = STEP_ORDER.indexOf(step);
  const showProg = step !== 'pdf_failed';

  // ── Render ─────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div style={{
        background: '#1E293B', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, padding: 32, width: 620, maxWidth: '95vw',
        maxHeight: '90vh', overflowY: 'auto',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 18, fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
              Import Assessment
            </h2>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, color: '#64748B', marginTop: 3 }}>
              into <span style={{ color: '#94A3B8' }}>{groupName}</span>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={18} />
          </button>
        </div>

        {/* Progress bar */}
        {showProg && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
            {STEP_ORDER.map((s, idx) => (
              <div key={s} style={{
                flex: 1, height: 3, borderRadius: 2,
                background: stepIdx >= idx ? '#6366F1' : 'rgba(255,255,255,0.08)',
              }} />
            ))}
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div style={{
            display: 'flex', gap: 8, alignItems: 'flex-start',
            background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 20,
            color: '#FCA5A5', fontFamily: 'Manrope, sans-serif', fontSize: 12,
          }}>
            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            {error}
          </div>
        )}

        {/* ── STEP: Upload ─────────────────────────────────── */}
        {step === 'upload' && (
          <div>
            {/* Format chips */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {[
                { ext: 'XLSX', icon: <FileSpreadsheet size={12} />, color: '#34D399' },
                { ext: 'CSV',  icon: <FileText size={12} />,        color: '#60A5FA' },
                { ext: 'PDF',  icon: <FileText size={12} />,        color: '#F87171' },
                { ext: 'JSON', icon: <FileJson size={12} />,        color: '#FBBF24' },
              ].map(f => (
                <span key={f.ext} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '4px 10px', borderRadius: 6,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700,
                  color: f.color,
                }}>
                  {f.icon} {f.ext}
                </span>
              ))}
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: '#475569', alignSelf: 'center' }}>
                · Max 10 MB
              </span>
            </div>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => !parsing && fileRef.current?.click()}
              style={{
                border: '2px dashed rgba(99,102,241,0.35)', borderRadius: 12,
                padding: parsing ? 36 : 52, textAlign: 'center',
                cursor: parsing ? 'default' : 'pointer',
                transition: 'border-color 0.14s, background 0.14s',
              }}
              onMouseEnter={e => { if (!parsing) (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(99,102,241,0.65)'; }}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(99,102,241,0.35)'}
            >
              {parsing ? (
                <div>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    border: '3px solid rgba(99,102,241,0.2)',
                    borderTop: '3px solid #6366F1',
                    animation: 'ei-spin 0.8s linear infinite',
                    margin: '0 auto 14px',
                  }} />
                  <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: '#94A3B8' }}>
                    Parsing {fileType === 'pdf' ? 'PDF' : 'file'}…
                  </div>
                  {fileName && (
                    <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: '#475569', marginTop: 4 }}>
                      {fileName}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Upload size={32} style={{ color: '#4F46E5', margin: '0 auto 12px' }} />
                  <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 14, fontWeight: 600, color: '#E2E8F0', marginBottom: 6 }}>
                    Drop your file here
                  </div>
                  <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, color: '#64748B', marginBottom: 4 }}>
                    or click to browse
                  </div>
                  <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: '#334155' }}>
                    Supported: XLSX, CSV, PDF, JSON
                  </div>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.tsv,.txt,.xlsx,.xls,.pdf,.json"
                style={{ display: 'none' }}
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>

            {/* File selected indicator */}
            {fileName && !parsing && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginTop: 14,
                background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 8, padding: '10px 14px',
              }}>
                <File size={14} style={{ color: '#818CF8', flexShrink: 0 }} />
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, color: '#A5B4FC', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {fileName}
                </span>
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: '#475569', flexShrink: 0 }}>
                  {formatBytes(fileSize)}
                </span>
              </div>
            )}

            {/* Format hints */}
            <div style={{
              background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
              borderRadius: 8, padding: '12px 16px', marginTop: 16,
              fontFamily: 'Manrope, sans-serif', fontSize: 12, color: '#64748B', lineHeight: 1.7,
            }}>
              <div style={{ color: '#A5B4FC', fontWeight: 700, marginBottom: 6 }}>Format Guide</div>
              <div><span style={{ color: '#34D399', fontWeight: 600 }}>XLSX</span> — Columns: Control ID · Name · Status · Notes</div>
              <div><span style={{ color: '#60A5FA', fontWeight: 600 }}>CSV/TSV</span> — Wide (subcategories × companies) or Long (one row per control)</div>
              <div><span style={{ color: '#F87171', fontWeight: 600 }}>PDF</span> — Control IDs + compliance keywords auto-extracted</div>
            </div>
          </div>
        )}

        {/* ── STEP: Single Mapping (XLSX / PDF) ────────────── */}
        {step === 'single_mapping' && (
          <div>
            {/* File info */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 8, padding: '10px 14px',
            }}>
              {fileType === 'xlsx'
                ? <FileSpreadsheet size={16} style={{ color: '#34D399', flexShrink: 0 }} />
                : <FileText size={16} style={{ color: '#F87171', flexShrink: 0 }} />
              }
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, color: '#94A3B8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {fileName}
              </span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: '#475569', flexShrink: 0 }}>
                {rows.length} rows detected
              </span>
            </div>

            {/* Company name */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Company / Subsidiary Name <span style={{ color: '#F87171' }}>*</span></label>
              <input
                autoFocus
                type="text"
                value={singleCompanyName}
                onChange={e => setSingleCompanyName(e.target.value)}
                placeholder="e.g. XYZ Teknoloji A.Ş."
                style={inputStyle}
              />
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: '#475569', marginTop: 4 }}>
                This assessment will be created for this company inside {groupName}.
              </p>
            </div>

            {/* Column mapping */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ ...labelStyle, marginBottom: 12 }}>Column Mapping</label>
              <div style={{ display: 'grid', gap: 12 }}>
                {([
                  { key: 'control_col', label: 'Control ID Column', hint: 'e.g. GV.OC-01, ID.AM-02' },
                  { key: 'status_col',  label: 'Status Column',     hint: 'Compliant / Partial / Non-Compliant' },
                  { key: 'notes_col',   label: 'Notes Column',      hint: 'Optional — evidence or comments' },
                ] as const).map(field => (
                  <div key={field.key}>
                    <label style={{ display: 'flex', justifyContent: 'space-between', ...labelStyle }}>
                      <span>{field.label}</span>
                      <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#334155' }}>{field.hint}</span>
                    </label>
                    <select
                      value={singleMapping[field.key]}
                      onChange={e => setSingleMapping(m => ({ ...m, [field.key]: +e.target.value }))}
                      style={selectStyle}
                    >
                      {headers.map((h, i) => (
                        <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Row preview */}
            {rows.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Preview (first 5 rows)</label>
                <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Manrope, sans-serif', fontSize: 11 }}>
                    <thead>
                      <tr style={{ background: 'rgba(99,102,241,0.08)' }}>
                        {headers.map((h, i) => (
                          <th key={i} style={{ padding: '6px 10px', textAlign: 'left', color: '#818CF8', fontWeight: 700, whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            {h || `Col ${i + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 5).map((row, ri) => (
                        <tr key={ri} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          {row.map((cell, ci) => (
                            <td key={ci} style={{ padding: '5px 10px', color: ci === singleMapping.control_col ? '#A5B4FC' : '#94A3B8', whiteSpace: 'nowrap', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Assessment metadata */}
            <div style={{ paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Assessment Name</label>
                  <input value={assessmentName} onChange={e => setAssessmentName(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Assessment Date</label>
                  <input type="date" value={assessmentDate} onChange={e => setAssessmentDate(e.target.value)} style={inputStyle} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: CSV Mapping (existing) ─────────────────── */}
        {step === 'mapping' && (
          <div>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: '#94A3B8', marginBottom: 20 }}>
              Detected <strong style={{ color: '#E2E8F0' }}>{headers.length}</strong> columns and <strong style={{ color: '#E2E8F0' }}>{rows.length}</strong> data rows. Map the columns to their data types.
            </p>

            {/* Format selector */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Table Format</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { value: 'wide', label: 'Wide (Matrix)', desc: 'Rows = subcategories, Columns = companies' },
                  { value: 'long', label: 'Long (List)',   desc: 'Each row = company + subcategory + status' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setFormat(opt.value as 'wide' | 'long')}
                    style={{
                      padding: 12, borderRadius: 8, textAlign: 'left', cursor: 'pointer',
                      border: format === opt.value ? '1px solid rgba(99,102,241,0.6)' : '1px solid rgba(255,255,255,0.08)',
                      background: format === opt.value ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 600, color: format === opt.value ? '#A5B4FC' : '#E2E8F0', marginBottom: 3 }}>{opt.label}</div>
                    <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: '#64748B' }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {format === 'wide' ? (
              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Subcategory ID Column</label>
                  <select value={mapping.subcategory_row_col} onChange={e => setMapping(m => ({ ...m, subcategory_row_col: +e.target.value }))} style={selectStyle}>
                    {headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>First Company Column</label>
                  <select value={mapping.first_company_col} onChange={e => setMapping(m => ({ ...m, first_company_col: +e.target.value }))} style={selectStyle}>
                    {headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
                  </select>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: '#475569', marginTop: 4 }}>
                    Companies: {headers.slice(mapping.first_company_col).join(', ')}
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 14 }}>
                {[
                  { key: 'company_col',     label: 'Company Name Column'  },
                  { key: 'subcategory_col', label: 'Subcategory ID Column' },
                  { key: 'status_col',      label: 'Status Column'         },
                ].map(field => (
                  <div key={field.key}>
                    <label style={labelStyle}>{field.label}</label>
                    <select
                      value={mapping[field.key as keyof typeof mapping]}
                      onChange={e => setMapping(m => ({ ...m, [field.key]: +e.target.value }))}
                      style={selectStyle}
                    >
                      {headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Assessment Name</label>
                  <input value={assessmentName} onChange={e => setAssessmentName(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Assessment Date</label>
                  <input type="date" value={assessmentDate} onChange={e => setAssessmentDate(e.target.value)} style={inputStyle} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: Preview ─────────────────────────────────── */}
        {step === 'preview' && preview && (
          <div>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: '#94A3B8', marginBottom: 20 }}>
              Review the data before importing.{' '}
              <strong style={{ color: '#E2E8F0' }}>{preview.company_count}</strong>{' '}
              {preview.company_count === 1 ? 'company' : 'companies'} will be created.
            </p>

            <div style={{ display: 'grid', gap: 10 }}>
              {preview.companies.map((company, idx) => {
                const total = company.status_counts.compliant + company.status_counts.partial +
                              company.status_counts.non_compliant + company.status_counts.not_assessed;
                return (
                  <div key={idx} style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 10, padding: 16,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 14, fontWeight: 700, color: '#F1F5F9' }}>
                        {company.name}
                      </div>
                      <div style={{
                        fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700,
                        color: company.estimated_score >= 70 ? '#34D399' : company.estimated_score >= 40 ? '#FBBF24' : '#F87171',
                      }}>
                        ~{company.estimated_score}%
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      {(Object.entries(company.status_counts) as [string, number][]).map(([status, count]) => count > 0 && (
                        <div key={status} style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: '#64748B' }}>
                          <span style={{ color: status === 'compliant' ? '#34D399' : status === 'partial' ? '#FBBF24' : status === 'non_compliant' ? '#F87171' : '#475569' }}>
                            {count}
                          </span>{' '}
                          {status.replace('_', ' ')}
                        </div>
                      ))}
                      <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: '#64748B' }}>
                        {company.valid_items} / {total} valid controls
                      </div>
                    </div>
                    {company.invalid_subcategory_ids.length > 0 && (
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Manrope, sans-serif', fontSize: 11, color: '#FBBF24' }}>
                        <AlertTriangle size={11} />
                        {company.invalid_subcategory_ids.length} unmatched control IDs will be skipped
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {preview.warnings?.length > 0 && (
              <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 8 }}>
                {preview.warnings.map((w, i) => (
                  <div key={i} style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: '#FCD34D' }}>{w}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP: Confirm ─────────────────────────────────── */}
        {step === 'confirm' && preview && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <Check size={24} style={{ color: '#818CF8' }} />
            </div>
            <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 16, fontWeight: 700, color: '#F8FAFC', marginBottom: 8 }}>
              Ready to Import
            </h3>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 20 }}>
              This will create{' '}
              <strong style={{ color: '#E2E8F0' }}>{preview.company_count}</strong>{' '}
              {preview.company_count === 1 ? 'company' : 'companies'} in{' '}
              <strong style={{ color: '#E2E8F0' }}>{groupName}</strong> with an assessment named{' '}
              <strong style={{ color: '#E2E8F0' }}>{assessmentName}</strong>.
            </p>

            {/* Score summary */}
            {preview.companies.length === 1 && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 10, padding: '12px 20px',
              }}>
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, color: '#64748B' }}>Estimated score after import</span>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 700,
                  color: preview.companies[0].estimated_score >= 70 ? '#34D399' : preview.companies[0].estimated_score >= 40 ? '#FBBF24' : '#F87171',
                }}>
                  0% → ~{preview.companies[0].estimated_score}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── STEP: PDF Failed ──────────────────────────────── */}
        {step === 'pdf_failed' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <AlertTriangle size={24} style={{ color: '#FBBF24' }} />
            </div>
            <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 16, fontWeight: 700, color: '#F8FAFC', marginBottom: 10 }}>
              Couldn't Parse PDF
            </h3>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: '#64748B', lineHeight: 1.7, maxWidth: 400, margin: '0 auto 20px' }}>
              {pdfFailMsg}
            </p>
            <div style={{
              background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)',
              borderRadius: 10, padding: '14px 20px', maxWidth: 380, margin: '0 auto 24px',
              fontFamily: 'Manrope, sans-serif', fontSize: 12, color: '#94A3B8', lineHeight: 1.7, textAlign: 'left',
            }}>
              <div style={{ color: '#A5B4FC', fontWeight: 700, marginBottom: 6 }}>For reliable imports, use:</div>
              <div><span style={{ color: '#34D399' }}>XLSX</span> — Export from Excel with Control ID + Status columns</div>
              <div><span style={{ color: '#60A5FA' }}>CSV</span> — Save As CSV from any spreadsheet tool</div>
            </div>
            <button
              onClick={resetToUpload}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '9px 20px', borderRadius: 8,
                background: '#6366F1', border: 'none', color: '#fff',
                fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Upload size={14} /> Try Another File
            </button>
          </div>
        )}

        {/* ── Navigation ──────────────────────────────────── */}
        {step !== 'pdf_failed' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              onClick={() => {
                const idx = STEP_ORDER.indexOf(step);
                if (idx > 0) setStep(STEP_ORDER[idx - 1]);
                else onClose();
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                color: '#94A3B8', fontFamily: 'Manrope, sans-serif', fontSize: 13, cursor: 'pointer',
              }}
            >
              <ChevronLeft size={14} />
              {step === 'upload' ? 'Cancel' : 'Back'}
            </button>

            {step === 'upload' && (
              <div style={{ color: '#334155', fontFamily: 'Manrope, sans-serif', fontSize: 12, alignSelf: 'center' }}>
                Upload a file to continue
              </div>
            )}

            {(step === 'single_mapping' || step === 'mapping') && (
              <button
                onClick={handlePreview}
                disabled={loadingPreview || (step === 'single_mapping' && !singleCompanyName.trim())}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', background: '#6366F1', border: 'none', borderRadius: 8,
                  color: '#fff', fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 600,
                  cursor: loadingPreview ? 'default' : 'pointer',
                  opacity: (loadingPreview || (step === 'single_mapping' && !singleCompanyName.trim())) ? 0.5 : 1,
                }}
              >
                {loadingPreview ? 'Generating…' : 'Preview'} <ChevronRight size={14} />
              </button>
            )}

            {step === 'preview' && (
              <button
                onClick={() => setStep('confirm')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', background: '#6366F1', border: 'none', borderRadius: 8,
                  color: '#fff', fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Confirm <ChevronRight size={14} />
              </button>
            )}

            {step === 'confirm' && (
              <button
                onClick={handleConfirm}
                disabled={confirming}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', background: '#6366F1', border: 'none', borderRadius: 8,
                  color: '#fff', fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 600,
                  cursor: confirming ? 'default' : 'pointer',
                  opacity: confirming ? 0.7 : 1,
                }}
              >
                <Check size={14} />
                {confirming ? 'Importing…' : 'Import Now'}
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes ei-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

import { useState, useRef } from 'react';
import { X, Upload, ChevronRight, ChevronLeft, Check, AlertCircle } from 'lucide-react';
import { importApi, type ImportPayload, type ImportCompany } from '../../api/import';
import type { ImportPreview } from '../../types';

const ORG_ID = 'demo-org-123';

interface Props {
  groupId: string;
  groupName: string;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'upload' | 'mapping' | 'preview' | 'confirm';

const STATUS_MAP: Record<string, string> = {
  'uyumlu': 'compliant',
  'compliant': 'compliant',
  'yes': 'compliant',
  'evet': 'compliant',
  '1': 'compliant',
  'kısmi': 'partial',
  'partial': 'partial',
  'kısmi uyumlu': 'partial',
  'partially met': 'partial',
  'uyumsuz': 'non_compliant',
  'non_compliant': 'non_compliant',
  'no': 'non_compliant',
  'hayır': 'non_compliant',
  '0': 'non_compliant',
  'not_assessed': 'not_assessed',
  'değerlendirilmedi': 'not_assessed',
  '': 'not_assessed',
};

function normalizeStatus(raw: string): string {
  return STATUS_MAP[raw.toLowerCase().trim()] || 'not_assessed';
}

export default function ExcelImportModal({ groupId: _groupId, groupName, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('upload');
  const [_csvText, setCsvText] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [format, setFormat] = useState<'wide' | 'long'>('wide');
  const [mapping, setMapping] = useState({
    company_col: 0,
    subcategory_col: 1,
    status_col: 2,
    subcategory_row_col: 0,
    first_company_col: 1,
  });
  const [assessmentName, setAssessmentName] = useState('Excel Import');
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): string[][] => {
    const delimiter = text.includes('\t') ? '\t' : ',';
    return text.trim().split('\n').map(line =>
      line.split(delimiter).map(cell => cell.replace(/^"|"$/g, '').trim())
    );
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length < 2) { setError('File must have at least a header row and one data row.'); return; }
      setCsvText(text);
      setHeaders(parsed[0]);
      setRows(parsed.slice(1));
      setError(null);
      setStep('mapping');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const buildPayload = (): ImportPayload => {
    const companies: ImportCompany[] = [];

    if (format === 'wide') {
      const companyNames = headers.slice(mapping.first_company_col);

      for (let ci = 0; ci < companyNames.length; ci++) {
        const items = rows
          .filter(row => row[mapping.subcategory_row_col])
          .map(row => ({
            subcategory_id: row[mapping.subcategory_row_col].trim(),
            status: normalizeStatus(row[mapping.first_company_col + ci] || ''),
          }));
        companies.push({ name: companyNames[ci], items });
      }
    } else {
      const companyMap: Record<string, ImportCompany> = {};
      for (const row of rows) {
        const cName = row[mapping.company_col]?.trim();
        const subId = row[mapping.subcategory_col]?.trim();
        const rawStatus = row[mapping.status_col]?.trim() || '';
        if (!cName || !subId) continue;
        if (!companyMap[cName]) companyMap[cName] = { name: cName, items: [] };
        companyMap[cName].items.push({ subcategory_id: subId, status: normalizeStatus(rawStatus) });
      }
      companies.push(...Object.values(companyMap));
    }

    return {
      organization_id: ORG_ID,
      group_name: groupName,
      companies,
      assessment_name: assessmentName,
      assessment_date: assessmentDate,
    };
  };

  const handlePreview = async () => {
    try {
      setLoadingPreview(true);
      setError(null);
      const payload = buildPayload();
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
      const payload = buildPayload();
      await importApi.confirm(payload);
      onSuccess();
    } catch {
      setError('Import failed. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  const inputStyle = {
    width: '100%', boxSizing: 'border-box' as const,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8, padding: '8px 12px',
    fontFamily: 'Manrope, sans-serif', fontSize: 13, color: '#F8FAFC', outline: 'none',
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div style={{
        background: '#1E293B', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, padding: 32, width: 600, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 18, fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
              Import from Excel
            </h2>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, color: '#64748B', marginTop: 3 }}>
              into {groupName}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={18} />
          </button>
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {(['upload', 'mapping', 'preview', 'confirm'] as Step[]).map((s, idx) => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: ['upload', 'mapping', 'preview', 'confirm'].indexOf(step) >= idx ? '#6366F1' : 'rgba(255,255,255,0.08)' }} />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ display: 'flex', gap: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, color: '#FCA5A5', fontFamily: 'Manrope, sans-serif', fontSize: 12 }}>
            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            {error}
          </div>
        )}

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div>
            <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontFamily: 'Manrope, sans-serif', fontSize: 12, color: '#94A3B8', lineHeight: 1.6 }}>
              <strong style={{ color: '#A5B4FC' }}>Supported format:</strong> CSV or TSV file (Tab-Separated Values).<br />
              To export from Excel: <strong style={{ color: '#E2E8F0' }}>File &rarr; Save As &rarr; CSV (Comma delimited)</strong> or <strong style={{ color: '#E2E8F0' }}>Text (Tab delimited)</strong>
            </div>
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              style={{
                border: '2px dashed rgba(99,102,241,0.3)', borderRadius: 12,
                padding: 48, textAlign: 'center', cursor: 'pointer',
                transition: 'border-color 0.14s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(99,102,241,0.6)'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(99,102,241,0.3)'}
            >
              <Upload size={32} style={{ color: '#4F46E5', margin: '0 auto 12px' }} />
              <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 14, fontWeight: 600, color: '#E2E8F0', marginBottom: 6 }}>
                Drop your CSV/TSV file here
              </div>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, color: '#64748B' }}>
                or click to browse
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.tsv,.txt"
                style={{ display: 'none' }}
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
          </div>
        )}

        {/* Step 2: Mapping */}
        {step === 'mapping' && (
          <div>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: '#94A3B8', marginBottom: 20 }}>
              Detected <strong style={{ color: '#E2E8F0' }}>{headers.length}</strong> columns and <strong style={{ color: '#E2E8F0' }}>{rows.length}</strong> data rows. Map the columns to their data types.
            </p>

            {/* Format selector */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Table Format
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { value: 'wide', label: 'Wide (Matrix)', desc: 'Rows = subcategories, Columns = companies' },
                  { value: 'long', label: 'Long (List)', desc: 'Each row = company + subcategory + status' },
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

            {/* Column mapping */}
            {format === 'wide' ? (
              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                    Subcategory ID Column
                  </label>
                  <select value={mapping.subcategory_row_col} onChange={e => setMapping(m => ({ ...m, subcategory_row_col: +e.target.value }))} style={selectStyle}>
                    {headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i+1}`}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                    First Company Column
                  </label>
                  <select value={mapping.first_company_col} onChange={e => setMapping(m => ({ ...m, first_company_col: +e.target.value }))} style={selectStyle}>
                    {headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i+1}`}</option>)}
                  </select>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: '#475569', marginTop: 4 }}>
                    Company names are the column headers from this column onwards: {headers.slice(mapping.first_company_col).join(', ')}
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 14 }}>
                {[
                  { key: 'company_col', label: 'Company Name Column' },
                  { key: 'subcategory_col', label: 'Subcategory ID Column' },
                  { key: 'status_col', label: 'Status Column' },
                ].map(field => (
                  <div key={field.key}>
                    <label style={{ display: 'block', fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                      {field.label}
                    </label>
                    <select
                      value={mapping[field.key as keyof typeof mapping]}
                      onChange={e => setMapping(m => ({ ...m, [field.key]: +e.target.value }))}
                      style={selectStyle}
                    >
                      {headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i+1}`}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {/* Assessment metadata */}
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Assessment Name</label>
                  <input value={assessmentName} onChange={e => setAssessmentName(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Assessment Date</label>
                  <input type="date" value={assessmentDate} onChange={e => setAssessmentDate(e.target.value)} style={inputStyle} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 'preview' && preview && (
          <div>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: '#94A3B8', marginBottom: 20 }}>
              Review the data before importing. <strong style={{ color: '#E2E8F0' }}>{preview.company_count}</strong> companies will be created.
            </p>
            <div style={{ display: 'grid', gap: 10 }}>
              {preview.companies.map((company, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 14, fontWeight: 700, color: '#F1F5F9' }}>{company.name}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: company.estimated_score >= 70 ? '#34D399' : company.estimated_score >= 40 ? '#FBBF24' : '#F87171' }}>
                      ~{company.estimated_score}%
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {Object.entries(company.status_counts).map(([status, count]) => count > 0 && (
                      <div key={status} style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: '#64748B' }}>
                        <span style={{ color: status === 'compliant' ? '#34D399' : status === 'partial' ? '#FBBF24' : status === 'non_compliant' ? '#F87171' : '#475569' }}>{count}</span> {status.replace('_', ' ')}
                      </div>
                    ))}
                    <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: '#64748B' }}>{company.valid_items} valid items</div>
                  </div>
                  {company.invalid_subcategory_ids.length > 0 && (
                    <div style={{ marginTop: 8, fontFamily: 'Manrope, sans-serif', fontSize: 11, color: '#FBBF24' }}>
                      {company.invalid_subcategory_ids.length} unknown subcategory IDs skipped
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 'confirm' && preview && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Check size={24} style={{ color: '#818CF8' }} />
            </div>
            <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 16, fontWeight: 700, color: '#F8FAFC', marginBottom: 8 }}>Ready to Import</h3>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>
              This will create <strong style={{ color: '#E2E8F0' }}>{preview.company_count}</strong> companies in <strong style={{ color: '#E2E8F0' }}>{groupName}</strong>, each with an assessment named <strong style={{ color: '#E2E8F0' }}>{assessmentName}</strong>.
            </p>
          </div>
        )}

        {/* Navigation buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => {
              const stepOrder: Step[] = ['upload', 'mapping', 'preview', 'confirm'];
              const idx = stepOrder.indexOf(step);
              if (idx > 0) setStep(stepOrder[idx - 1]);
              else onClose();
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#94A3B8', fontFamily: 'Manrope, sans-serif', fontSize: 13, cursor: 'pointer' }}
          >
            <ChevronLeft size={14} />
            {step === 'upload' ? 'Cancel' : 'Back'}
          </button>

          {step === 'upload' && (
            <div style={{ color: '#475569', fontFamily: 'Manrope, sans-serif', fontSize: 12, alignSelf: 'center' }}>
              Upload a file to continue
            </div>
          )}

          {step === 'mapping' && (
            <button
              onClick={handlePreview}
              disabled={loadingPreview}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#6366F1', border: 'none', borderRadius: 8, color: '#fff', fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: loadingPreview ? 0.7 : 1 }}
            >
              {loadingPreview ? 'Generating...' : 'Preview'} <ChevronRight size={14} />
            </button>
          )}

          {step === 'preview' && (
            <button
              onClick={() => setStep('confirm')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#6366F1', border: 'none', borderRadius: 8, color: '#fff', fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Confirm <ChevronRight size={14} />
            </button>
          )}

          {step === 'confirm' && (
            <button
              onClick={handleConfirm}
              disabled={confirming}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#6366F1', border: 'none', borderRadius: 8, color: '#fff', fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: confirming ? 0.7 : 1 }}
            >
              <Check size={14} />
              {confirming ? 'Importing...' : 'Import Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

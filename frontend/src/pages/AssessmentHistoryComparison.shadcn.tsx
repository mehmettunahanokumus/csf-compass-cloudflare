import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import axios from 'axios';
import type { AssessmentComparison, Assessment } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const ORG_ID = 'demo-org-123';

const STATUS_COLORS: Record<string, string> = {
  compliant: '#34D399',
  partial: '#FBBF24',
  non_compliant: '#F87171',
  not_assessed: '#475569',
  not_applicable: '#334155',
};

const STATUS_LABELS: Record<string, string> = {
  compliant: 'Compliant',
  partial: 'Partial',
  non_compliant: 'Non-Compliant',
  not_assessed: 'Not Assessed',
  not_applicable: 'N/A',
};

export default function AssessmentHistoryComparison() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const a1Id = searchParams.get('assessment1');
  const a2Id = searchParams.get('assessment2');

  const [comparison, setComparison] = useState<AssessmentComparison | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [sel1, setSel1] = useState(a1Id || '');
  const [sel2, setSel2] = useState(a2Id || '');
  const [loading, setLoading] = useState(false);
  const [filterChanged, setFilterChanged] = useState(false);

  useEffect(() => {
    loadAssessments();
  }, [vendorId]);

  useEffect(() => {
    if (sel1 && sel2 && sel1 !== sel2) {
      loadComparison();
    }
  }, [sel1, sel2]);

  const loadAssessments = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/assessments`, {
        params: { organization_id: ORG_ID, vendor_id: vendorId }
      });
      setAssessments(res.data);
    } catch {}
  };

  const loadComparison = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/assessments/compare`, {
        params: { ids: `${sel1},${sel2}` }
      });
      setComparison(res.data);
    } catch {
      setComparison(null);
    } finally {
      setLoading(false);
    }
  };

  const displayedItems = filterChanged && comparison
    ? comparison.items.filter(i => i.changed)
    : comparison?.items ?? [];

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <button
        onClick={() => navigate(-1)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontFamily: 'Manrope, sans-serif', fontSize: 13, padding: 0, marginBottom: 20 }}
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 22, fontWeight: 800, color: '#F8FAFC', marginBottom: 6 }}>
        Historical Comparison
      </h1>
      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: '#64748B', marginBottom: 28 }}>
        Compare two assessment snapshots to track progress over time
      </p>

      {/* Assessment selectors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center', marginBottom: 28 }}>
        <div>
          <label style={{ display: 'block', fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            Baseline Assessment
          </label>
          <select
            value={sel1}
            onChange={e => setSel1(e.target.value)}
            style={{ width: '100%', background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: '#F8FAFC', fontFamily: 'Manrope, sans-serif', fontSize: 13, cursor: 'pointer' }}
          >
            <option value="">Select assessment...</option>
            {assessments.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.status})</option>
            ))}
          </select>
        </div>
        <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: '#475569', textAlign: 'center', paddingTop: 20 }}>vs</div>
        <div>
          <label style={{ display: 'block', fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            Comparison Assessment
          </label>
          <select
            value={sel2}
            onChange={e => setSel2(e.target.value)}
            style={{ width: '100%', background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: '#F8FAFC', fontFamily: 'Manrope, sans-serif', fontSize: 13, cursor: 'pointer' }}
          >
            <option value="">Select assessment...</option>
            {assessments.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.status})</option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748B', fontFamily: 'Manrope, sans-serif' }}>
          Loading comparison...
        </div>
      )}

      {comparison && !loading && (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
            {[
              { label: 'Score Change', value: `${comparison.score_delta > 0 ? '+' : ''}${Math.round(comparison.score_delta)}%`, color: comparison.score_delta > 0 ? '#34D399' : comparison.score_delta < 0 ? '#F87171' : '#94A3B8' },
              { label: 'Improved', value: comparison.summary.improved.toString(), color: '#34D399' },
              { label: 'Declined', value: comparison.summary.declined.toString(), color: '#F87171' },
              { label: 'Unchanged', value: comparison.summary.unchanged.toString(), color: '#64748B' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '16px 18px' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: '#64748B', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filter controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <button
              onClick={() => setFilterChanged(!filterChanged)}
              style={{
                padding: '6px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)',
                background: filterChanged ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                color: filterChanged ? '#A5B4FC' : '#64748B',
                fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Show changes only
            </button>
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, color: '#475569' }}>
              {filterChanged ? `${comparison.items.filter(i => i.changed).length} changes` : `${comparison.items.length} total items`}
            </span>
          </div>

          {/* Items table */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px 80px', padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              {['Subcategory', 'Baseline', 'Current', 'Change'].map(h => (
                <div key={h} style={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</div>
              ))}
            </div>
            {displayedItems.map((item, idx) => (
              <div
                key={item.subcategory_id}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 160px 160px 80px',
                  padding: '10px 20px',
                  borderBottom: idx < displayedItems.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  background: item.delta > 0 ? 'rgba(52,211,153,0.03)' : item.delta < 0 ? 'rgba(248,113,113,0.03)' : 'transparent',
                }}
              >
                <div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#818CF8', marginBottom: 2 }}>{item.subcategory_id}</div>
                  <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, color: '#94A3B8' }}>{item.subcategory_name}</div>
                </div>
                <div>
                  <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: STATUS_COLORS[item.assessment1_status] || '#64748B' }}>
                    {STATUS_LABELS[item.assessment1_status] || item.assessment1_status}
                  </span>
                </div>
                <div>
                  <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: STATUS_COLORS[item.assessment2_status] || '#64748B' }}>
                    {STATUS_LABELS[item.assessment2_status] || item.assessment2_status}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {item.delta > 0 && <TrendingUp size={13} style={{ color: '#34D399' }} />}
                  {item.delta < 0 && <TrendingDown size={13} style={{ color: '#F87171' }} />}
                  {item.delta === 0 && <Minus size={13} style={{ color: '#334155' }} />}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!comparison && !loading && sel1 && sel2 && sel1 !== sel2 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748B', fontFamily: 'Manrope, sans-serif', fontSize: 13 }}>
          Failed to load comparison. Please try again.
        </div>
      )}

      {(!sel1 || !sel2) && !loading && (
        <div style={{ textAlign: 'center', padding: 60, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 12, color: '#475569', fontFamily: 'Manrope, sans-serif', fontSize: 13 }}>
          Select two assessments above to compare them
        </div>
      )}
    </div>
  );
}

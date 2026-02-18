import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, ArrowLeft, Upload, RefreshCw } from 'lucide-react';
import { companyGroupsApi } from '../api/company-groups';
import type { GroupSummary } from '../types';
import ExcelImportModal from '../components/import/ExcelImportModal';

function ScoreCell({ score }: { score: number | null | undefined }) {
  if (score === null || score === undefined) {
    return <span style={{ color: '#334155', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>—</span>;
  }
  const color = score >= 70 ? '#34D399' : score >= 40 ? '#FBBF24' : '#F87171';
  return (
    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600, color }}>
      {score}%
    </span>
  );
}

export default function CompanyGroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<GroupSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    if (id) loadSummary();
  }, [id]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const res = await companyGroupsApi.getSummary(id!);
      setSummary(res.data);
    } catch {
      setError('Failed to load group summary');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '28px 32px', textAlign: 'center', color: '#64748B', fontFamily: 'Manrope, sans-serif' }}>
        Loading group...
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div style={{ padding: '28px 32px' }}>
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '12px 16px', color: '#FCA5A5', fontFamily: 'Manrope, sans-serif', fontSize: 13 }}>
          {error || 'Group not found'}
        </div>
      </div>
    );
  }

  const { group, csf_functions, vendors: vendorSummaries } = summary;

  // Calculate averages
  const vendorsWithAssessments = vendorSummaries.filter(v => v.latest_assessment !== null);
  const avgScore = vendorsWithAssessments.length > 0
    ? Math.round(vendorsWithAssessments.reduce((sum, v) => sum + (v.overall_score ?? 0), 0) / vendorsWithAssessments.length)
    : null;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <button
          onClick={() => navigate('/company-groups')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontFamily: 'Manrope, sans-serif', fontSize: 13, padding: 0, marginBottom: 16 }}
        >
          <ArrowLeft size={14} />
          Back to Groups
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={22} style={{ color: '#818CF8' }} />
            </div>
            <div>
              <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 22, fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
                {group.name}
              </h1>
              {group.description && (
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: '#64748B', marginTop: 3 }}>
                  {group.description}
                </p>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setShowImport(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 14px', color: '#94A3B8', fontFamily: 'Manrope, sans-serif', fontSize: 13, cursor: 'pointer' }}
            >
              <Upload size={14} />
              Import Excel
            </button>
            <button
              onClick={loadSummary}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 14px', color: '#94A3B8', fontFamily: 'Manrope, sans-serif', fontSize: 13, cursor: 'pointer' }}
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Companies', value: vendorSummaries.length.toString(), color: '#A5B4FC' },
          { label: 'Assessed', value: vendorsWithAssessments.length.toString(), color: '#34D399' },
          { label: 'Avg Score', value: avgScore !== null ? `${avgScore}%` : '—', color: avgScore !== null ? (avgScore >= 70 ? '#34D399' : avgScore >= 40 ? '#FBBF24' : '#F87171') : '#64748B' },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '14px 20px', flex: 1 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: '#64748B', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 14, fontWeight: 700, color: '#E2E8F0', margin: 0 }}>
            CSF Function Scores by Company
          </h2>
        </div>

        {vendorSummaries.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#475569', fontFamily: 'Manrope, sans-serif', fontSize: 13 }}>
            No companies in this group yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 20px', fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', minWidth: 160 }}>
                    Company
                  </th>
                  <th style={{ textAlign: 'center', padding: '10px 14px', fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Overall
                  </th>
                  {csf_functions.map(fn => (
                    <th key={fn.id} style={{ textAlign: 'center', padding: '10px 14px', fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', minWidth: 90 }}>
                      {fn.id}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vendorSummaries.map((vs, idx) => (
                  <tr
                    key={vs.vendor.id}
                    style={{ borderBottom: idx < vendorSummaries.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 600, color: '#E2E8F0' }}>
                        {vs.vendor.name}
                      </div>
                      {vs.latest_assessment && (
                        <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: '#475569', marginTop: 2 }}>
                          {vs.latest_assessment.name}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <ScoreCell score={vs.overall_score} />
                    </td>
                    {csf_functions.map(fn => (
                      <td key={fn.id} style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <ScoreCell score={vs.function_scores[fn.id]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Import Modal */}
      {showImport && (
        <ExcelImportModal
          groupId={id!}
          groupName={group.name}
          onClose={() => setShowImport(false)}
          onSuccess={() => { setShowImport(false); loadSummary(); }}
        />
      )}
    </div>
  );
}

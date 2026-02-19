import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Users, ChevronRight, X } from 'lucide-react';
import { companyGroupsApi } from '../api/company-groups';
import type { CompanyGroup } from '../types';

const ORG_ID = 'demo-org-123';

export default function CompanyGroups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<CompanyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', industry: '' });

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const res = await companyGroupsApi.list(ORG_ID);
      setGroups(res.data);
    } catch (err) {
      setError('Failed to load company groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    try {
      setCreating(true);
      await companyGroupsApi.create({
        organization_id: ORG_ID,
        name: form.name,
        description: form.description || undefined,
        industry: form.industry || undefined,
      });
      setForm({ name: '', description: '', industry: '' });
      setShowCreate(false);
      loadGroups();
    } catch {
      setError('Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 24, fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
            Group Companies
          </h1>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
            Internal subsidiaries and group entities under your organization
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#6366F1', color: '#fff',
            border: 'none', borderRadius: 8, padding: '8px 16px',
            fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Plus size={15} />
          Add Subsidiary
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
        }}>
          <div style={{
            background: '#1E293B', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, padding: 28, width: 440, maxWidth: '90vw',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 18, fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
                Add Group Company
              </h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>
            {(['name', 'description', 'industry'] as const).map(field => (
              <div key={field} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 600, color: '#94A3B8', marginBottom: 6, textTransform: 'capitalize' }}>
                  {field}{field === 'name' && ' *'}
                </label>
                <input
                  value={form[field]}
                  onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
                  placeholder={field === 'name' ? 'e.g. XYZ Holding' : field === 'industry' ? 'e.g. Financial Services' : 'Optional description'}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8, padding: '8px 12px',
                    fontFamily: 'Manrope, sans-serif', fontSize: 13, color: '#F8FAFC',
                    outline: 'none',
                  }}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={() => setShowCreate(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#94A3B8', fontFamily: 'Manrope, sans-serif', fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !form.name.trim()}
                style={{ padding: '8px 16px', background: '#6366F1', border: 'none', borderRadius: 8, color: '#fff', fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: creating || !form.name.trim() ? 0.6 : 1 }}
              >
                {creating ? 'Adding...' : 'Add Company'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#FCA5A5', fontFamily: 'Manrope, sans-serif', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-2)', fontFamily: 'Manrope, sans-serif' }}>
          Loading groups...
        </div>
      ) : groups.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60,
          background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)',
          borderRadius: 12,
        }}>
          <Building2 size={40} style={{ color: 'var(--text-3)', margin: '0 auto 16px' }} />
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 14, color: 'var(--text-2)', margin: 0 }}>
            No group companies yet. Add your first subsidiary to get started.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {groups.map(group => (
            <div
              key={group.id}
              onClick={() => navigate(`/company-groups/${group.id}`)}
              style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 12, padding: 20, cursor: 'pointer',
                boxShadow: 'var(--shadow-xs)',
                transition: 'border-color 0.14s, background 0.14s, box-shadow 0.14s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(99,102,241,0.5)';
                (e.currentTarget as HTMLDivElement).style.background = 'rgba(99,102,241,0.06)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(99,102,241,0.15)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLDivElement).style.background = 'var(--card)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-xs)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Building2 size={18} style={{ color: '#818CF8' }} />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>
                      {group.name}
                    </div>
                    {group.industry && (
                      <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>
                        {group.industry}
                      </div>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-3)', marginTop: 2 }} />
              </div>
              {group.description && (
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, color: 'var(--text-2)', marginTop: 12, marginBottom: 0, lineHeight: 1.5 }}>
                  {group.description}
                </p>
              )}
              <div style={{ display: 'flex', gap: 16, marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Users size={13} style={{ color: 'var(--text-2)' }} />
                  <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, color: 'var(--text-2)' }}>
                    {group.vendor_count ?? 0} companies
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

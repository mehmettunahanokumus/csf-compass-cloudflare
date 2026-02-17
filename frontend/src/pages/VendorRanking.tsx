/**
 * VendorRanking - Sortable ranking table with filters and CSV export
 */

import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building2,
} from 'lucide-react';
import { vendorsApi } from '../api/vendors';
import type { Vendor } from '../types';
import { getErrorMessage } from '../api/client';

type SortField = 'name' | 'industry' | 'score' | 'criticality' | 'status';
type SortDirection = 'asc' | 'desc';
type CriticalityFilter = 'all' | 'low' | 'medium' | 'high' | 'critical';

const criticalityOrder: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const statusOrder: Record<string, number> = {
  active: 0,
  under_review: 1,
  inactive: 2,
  terminated: 3,
};

function getCriticalityLabel(level: string | undefined) {
  switch (level) {
    case 'critical': return 'Critical';
    case 'high': return 'High';
    case 'medium': return 'Medium';
    case 'low': return 'Low';
    default: return 'N/A';
  }
}

function getCriticalityClass(level: string | undefined) {
  switch (level) {
    case 'critical': return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'high': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'medium': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    case 'low': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    default: return 'bg-white/[0.04] text-[#55576A] border-white/[0.07]';
  }
}

function getStatusLabel(status: string | undefined) {
  switch (status) {
    case 'active': return 'Active';
    case 'inactive': return 'Inactive';
    case 'under_review': return 'Under Review';
    case 'terminated': return 'Terminated';
    default: return 'Unknown';
  }
}

function getStatusClass(status: string | undefined) {
  switch (status) {
    case 'active': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'inactive': return 'bg-white/[0.04] text-[#55576A] border-white/[0.07]';
    case 'under_review': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'terminated': return 'bg-red-500/10 text-red-400 border-red-500/20';
    default: return 'bg-white/[0.04] text-[#55576A] border-white/[0.07]';
  }
}

export default function VendorRanking() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [activeFilter, setActiveFilter] = useState<CriticalityFilter>('all');

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const data = await vendorsApi.list();
      setVendors(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = useMemo(() => {
    let result = [...vendors];

    if (activeFilter !== 'all') {
      result = result.filter(
        (v) => (v.criticality_level || v.risk_tier || 'medium') === activeFilter
      );
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'industry':
          cmp = (a.industry || '').localeCompare(b.industry || '');
          break;
        case 'score':
          cmp = (a.latest_assessment_score ?? -1) - (b.latest_assessment_score ?? -1);
          break;
        case 'criticality': {
          const aLevel = a.criticality_level || a.risk_tier || 'medium';
          const bLevel = b.criticality_level || b.risk_tier || 'medium';
          cmp = (criticalityOrder[aLevel] ?? 99) - (criticalityOrder[bLevel] ?? 99);
          break;
        }
        case 'status': {
          const aStatus = a.vendor_status || 'active';
          const bStatus = b.vendor_status || 'active';
          cmp = (statusOrder[aStatus] ?? 99) - (statusOrder[bStatus] ?? 99);
          break;
        }
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [vendors, activeFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'score' ? 'desc' : 'asc');
    }
  };

  const exportCsv = () => {
    const header = 'Rank,Name,Industry,Score,Criticality,Status';
    const rows = filteredVendors.map((v, i) => {
      const score = v.latest_assessment_score != null ? v.latest_assessment_score.toFixed(1) : 'N/A';
      const criticality = getCriticalityLabel(v.criticality_level || v.risk_tier);
      const status = getStatusLabel(v.vendor_status);
      const name = v.name.includes(',') ? `"${v.name}"` : v.name;
      const industry = (v.industry || 'N/A').includes(',')
        ? `"${v.industry}"`
        : v.industry || 'N/A';
      return `${i + 1},${name},${industry},${score},${criticality},${status}`;
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vendor-rankings.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-[#55576A]" />;
    return sortDirection === 'asc'
      ? <ArrowUp className="w-3 h-3 text-amber-400" />
      : <ArrowDown className="w-3 h-3 text-amber-400" />;
  };

  const filterOptions: { value: CriticalityFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  if (loading) {
    return (
      <div className="animate-fade-in-up space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-white/[0.06] animate-pulse" />
            <div className="h-7 w-48 bg-white/[0.06] rounded animate-pulse" />
          </div>
          <div className="h-10 w-36 bg-white/[0.06] rounded-lg animate-pulse" />
        </div>
        <div className="h-10 w-full bg-white/[0.04] rounded-lg animate-pulse" />
        <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-white/[0.04] animate-pulse">
              <div className="w-8 h-4 bg-white/[0.06] rounded" />
              <div className="flex-1 h-4 bg-white/[0.06] rounded" />
              <div className="w-16 h-4 bg-white/[0.06] rounded" />
              <div className="w-20 h-5 bg-white/[0.06] rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
        <p className="font-sans text-sm text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/vendors"
            className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-[#55576A] hover:text-[#F0F0F5] hover:border-amber-500/30 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold text-[#F0F0F5]">Vendor Rankings</h1>
            <p className="font-sans text-sm text-[#8E8FA8] mt-0.5">Comparative security posture overview</p>
          </div>
        </div>
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-[#08090E] font-display text-sm font-semibold rounded-lg hover:bg-amber-400 transition-colors"
        >
          <FileDown className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setActiveFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg font-sans text-xs font-medium transition-colors ${
                activeFilter === opt.value
                  ? 'bg-amber-500 text-[#08090E]'
                  : 'bg-white/[0.04] text-[#8E8FA8] hover:bg-white/[0.07]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="font-sans text-xs text-[#55576A]">
          Showing{' '}
          <span className="font-mono font-semibold text-[#F0F0F5]">{filteredVendors.length}</span>
          {' '}vendor{filteredVendors.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Ranking Table */}
      {filteredVendors.length === 0 ? (
        <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-5 h-5 text-amber-500/50" />
          </div>
          <p className="font-display text-sm font-semibold text-[#F0F0F5] mb-1">No vendors found</p>
          <p className="font-sans text-xs text-[#8E8FA8]">
            {activeFilter !== 'all'
              ? 'No vendors match the selected filter'
              : 'No vendors found'}
          </p>
        </div>
      ) : (
        <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-5 py-3.5 font-display text-[10px] tracking-[0.12em] uppercase text-[#55576A] font-semibold w-12">
                    #
                  </th>
                  <th
                    className="text-left px-4 py-3.5 font-display text-[10px] tracking-[0.12em] uppercase text-[#55576A] font-semibold cursor-pointer select-none hover:text-[#8E8FA8] transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      Vendor Name <SortIcon field="name" />
                    </span>
                  </th>
                  <th
                    className="text-left px-4 py-3.5 font-display text-[10px] tracking-[0.12em] uppercase text-[#55576A] font-semibold cursor-pointer select-none hover:text-[#8E8FA8] transition-colors"
                    onClick={() => handleSort('industry')}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      Industry <SortIcon field="industry" />
                    </span>
                  </th>
                  <th
                    className="text-left px-4 py-3.5 font-display text-[10px] tracking-[0.12em] uppercase text-[#55576A] font-semibold cursor-pointer select-none hover:text-[#8E8FA8] transition-colors"
                    onClick={() => handleSort('score')}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      Score <SortIcon field="score" />
                    </span>
                  </th>
                  <th
                    className="text-left px-4 py-3.5 font-display text-[10px] tracking-[0.12em] uppercase text-[#55576A] font-semibold cursor-pointer select-none hover:text-[#8E8FA8] transition-colors"
                    onClick={() => handleSort('criticality')}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      Criticality <SortIcon field="criticality" />
                    </span>
                  </th>
                  <th
                    className="text-left px-4 py-3.5 font-display text-[10px] tracking-[0.12em] uppercase text-[#55576A] font-semibold cursor-pointer select-none hover:text-[#8E8FA8] transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      Status <SortIcon field="status" />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors.map((vendor, index) => {
                  const critLevel = vendor.criticality_level || vendor.risk_tier;
                  const score = vendor.latest_assessment_score;

                  return (
                    <tr
                      key={vendor.id}
                      className="border-b border-white/[0.04] hover:bg-amber-500/[0.03] transition-colors"
                    >
                      {/* Rank */}
                      <td className="px-5 py-4 font-mono text-sm font-semibold text-[#55576A]">
                        {index + 1}
                      </td>

                      {/* Vendor Name */}
                      <td className="px-4 py-4">
                        <Link
                          to={`/vendors/${vendor.id}`}
                          className="font-sans text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                        >
                          {vendor.name}
                        </Link>
                      </td>

                      {/* Industry */}
                      <td className="px-4 py-4">
                        <span className="font-sans text-sm text-[#8E8FA8]">
                          {vendor.industry || 'N/A'}
                        </span>
                      </td>

                      {/* Score with bar */}
                      <td className="px-4 py-4">
                        {score != null ? (
                          <div className="flex items-center gap-2.5">
                            <div className="w-20 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${score}%`,
                                  background: score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444',
                                }}
                              />
                            </div>
                            <span className={`font-mono text-sm font-bold tabular-nums ${
                              score >= 75 ? 'text-emerald-400' :
                              score >= 50 ? 'text-amber-400' : 'text-red-400'
                            }`}>
                              {score.toFixed(1)}
                            </span>
                          </div>
                        ) : (
                          <span className="font-sans text-sm text-[#55576A]">N/A</span>
                        )}
                      </td>

                      {/* Criticality */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-sans text-[11px] font-medium uppercase tracking-wide border ${getCriticalityClass(critLevel)}`}>
                          {getCriticalityLabel(critLevel)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-sans text-[11px] font-medium border ${getStatusClass(vendor.vendor_status)}`}>
                          {getStatusLabel(vendor.vendor_status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

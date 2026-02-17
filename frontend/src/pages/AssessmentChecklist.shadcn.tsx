import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Search } from 'lucide-react';
import { assessmentsApi } from '../api/assessments';
import { csfApi } from '../api/csf';
import { getErrorMessage } from '../api/client';
import type { Assessment, AssessmentItem, CsfFunction } from '../types';

const FUNCTION_TABS = ['All', 'GV', 'ID', 'PR', 'DE', 'RS', 'RC'];

function statusBadgeClass(status: string) {
  const map: Record<string, string> = {
    compliant: 'bg-emerald-500/10 text-emerald-400',
    partial: 'bg-amber-500/10 text-amber-400',
    non_compliant: 'bg-red-500/10 text-red-400',
    not_assessed: 'bg-white/[0.06] text-[#55576A]',
    not_applicable: 'bg-white/[0.06] text-[#55576A]',
  };
  return map[status] || 'bg-white/[0.06] text-[#55576A]';
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    compliant: 'Compliant',
    partial: 'Partial',
    non_compliant: 'Non-Compliant',
    not_assessed: 'Not Assessed',
    not_applicable: 'N/A',
  };
  return map[status] || status.replace('_', ' ');
}

export default function AssessmentChecklist() {
  const { id } = useParams<{ id: string }>();

  const [_assessment, setAssessment] = useState<Assessment | null>(null);
  const [functions, setFunctions] = useState<CsfFunction[]>([]);
  const [items, setItems] = useState<AssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const [assessmentData, functionsData, itemsData] = await Promise.all([
        assessmentsApi.get(id),
        csfApi.getFunctions(),
        assessmentsApi.getItems(id),
      ]);
      setAssessment(assessmentData);
      setFunctions(functionsData);
      setItems(itemsData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const distribution = useMemo(() => {
    const d = { compliant: 0, partial: 0, non_compliant: 0, not_assessed: 0, not_applicable: 0 };
    items.forEach((item) => {
      if (item.status in d) d[item.status as keyof typeof d]++;
    });
    return d;
  }, [items]);

  const complianceScore = useMemo(() => {
    const assessed = items.filter((i) => i.status !== 'not_assessed' && i.status !== 'not_applicable').length;
    if (assessed === 0) return 0;
    return (distribution.compliant / assessed) * 100;
  }, [items, distribution]);

  const filteredItems = useMemo(() => {
    let filtered = items;
    if (activeTab !== 'All') {
      filtered = filtered.filter((item) => {
        const funcName = item.function?.name || '';
        const catName = item.category?.name || '';
        return (
          funcName.startsWith(activeTab) ||
          catName.startsWith(activeTab) ||
          item.subcategory?.name?.startsWith(activeTab)
        );
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          (item.subcategory?.name || '').toLowerCase().includes(q) ||
          (item.subcategory?.description || '').toLowerCase().includes(q) ||
          (item.category?.name || '').toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [items, activeTab, searchQuery]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, { categoryId: string; categoryName: string; functionName: string; items: AssessmentItem[] }> = {};
    filteredItems.forEach((item) => {
      const catId = item.category?.id || 'unknown';
      if (!groups[catId]) {
        groups[catId] = {
          categoryId: catId,
          categoryName: item.category?.name || 'Unknown Category',
          functionName: item.function?.name || '',
          items: [],
        };
      }
      groups[catId].items.push(item);
    });
    return Object.values(groups).sort((a, b) => a.categoryName.localeCompare(b.categoryName));
  }, [filteredItems]);

  const handleStatusChange = async (itemId: string, newStatus: string) => {
    if (!id) return;
    try {
      const updated = await assessmentsApi.updateItem(id, itemId, { status: newStatus as AssessmentItem['status'] });
      setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...updated } : item)));
    } catch (err) {
      console.error('Failed to update status:', getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4 animate-pulse">
        <div className="h-5 w-32 bg-white/[0.06] rounded" />
        <div className="h-7 w-48 bg-white/[0.06] rounded" />
        <div className="h-40 w-full bg-white/[0.06] rounded-xl" />
        <div className="h-10 w-full bg-white/[0.06] rounded-lg" />
        <div className="h-64 w-full bg-white/[0.06] rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto text-center py-10">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
          <p className="font-sans text-sm text-red-400">{error}</p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-[#08090E] font-display text-sm font-semibold rounded-lg hover:bg-amber-400 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const scoreColor = complianceScore >= 80 ? '#10B981' : complianceScore >= 50 ? '#F59E0B' : '#EF4444';
  const circumference = 2 * Math.PI * 50;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <Link
          to={`/assessments/${id}`}
          className="inline-flex items-center gap-1.5 font-sans text-xs text-[#55576A] hover:text-[#8E8FA8] transition-colors mb-3"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to Assessment
        </Link>
        <h1 className="font-display text-2xl font-bold text-[#F0F0F5]">Assessment Checklist</h1>
        <p className="font-sans text-sm text-[#8E8FA8] mt-0.5">
          <span className="font-mono text-[#55576A]">{items.length}</span> subcategories across <span className="font-mono text-[#55576A]">{functions.length}</span> functions
        </p>
      </div>

      {/* Score Overview */}
      <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-6">
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          {/* Circle */}
          <div className="relative flex-shrink-0 w-32 h-32">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
              <circle
                cx="60" cy="60" r="50" fill="none"
                stroke={scoreColor}
                strokeWidth="14"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={`${circumference * (1 - complianceScore / 100)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-2xl font-bold tabular-nums text-[#F0F0F5]">{Math.round(complianceScore)}</span>
              <span className="font-sans text-[10px] text-[#55576A] uppercase tracking-wider">Score</span>
            </div>
          </div>

          {/* Distribution */}
          <div className="flex-1 w-full space-y-3">
            {[
              { label: 'Compliant', count: distribution.compliant, color: '#10B981' },
              { label: 'Partial', count: distribution.partial, color: '#F59E0B' },
              { label: 'Non-Compliant', count: distribution.non_compliant, color: '#EF4444' },
              { label: 'Not Assessed', count: distribution.not_assessed, color: '#55576A' },
              { label: 'N/A', count: distribution.not_applicable, color: '#3A3C4E' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="font-sans text-xs text-[#8E8FA8] w-28">{item.label}</span>
                <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: items.length > 0 ? `${(item.count / items.length) * 100}%` : '0%',
                      backgroundColor: item.color,
                    }}
                  />
                </div>
                <span className="font-mono text-xs font-medium text-[#F0F0F5] w-8 text-right tabular-nums">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Function Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {FUNCTION_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg font-sans text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'bg-amber-500 text-[#08090E]'
                  : 'bg-white/[0.04] text-[#8E8FA8] hover:bg-white/[0.07] hover:text-[#F0F0F5]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#55576A]" />
          <input
            type="text"
            placeholder="Search subcategories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/[0.03] border border-white/[0.07] rounded-lg font-sans text-sm text-[#F0F0F5] placeholder:text-[#55576A] focus:outline-none focus:border-amber-500/30 transition-colors"
          />
        </div>
      </div>

      {/* Results count */}
      {searchQuery && (
        <p className="font-sans text-sm text-[#8E8FA8]">
          Showing <span className="font-mono text-amber-400">{filteredItems.length}</span> of {items.length} subcategories
        </p>
      )}

      {/* Grouped Items */}
      {groupedItems.length === 0 ? (
        <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl py-12 text-center">
          <p className="font-sans text-sm text-[#55576A]">No items found matching your filters.</p>
        </div>
      ) : (
        groupedItems.map((group) => (
          <div key={group.categoryId} className="bg-[#0E1018] border border-white/[0.07] rounded-xl overflow-hidden">
            {/* Category header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-[3px] h-4 bg-amber-500 rounded-full flex-shrink-0" />
                <h3 className="font-display text-sm font-semibold text-[#F0F0F5]">{group.categoryName}</h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] bg-white/[0.05] text-[#8E8FA8] px-2 py-0.5 rounded uppercase tracking-wide">
                  {group.functionName}
                </span>
                <span className="font-mono text-[10px] text-[#55576A]">{group.items.length} items</span>
              </div>
            </div>

            {/* Items */}
            <div className="divide-y divide-white/[0.04]">
              {group.items.map((item) => (
                <div key={item.id} className="px-5 py-3.5 flex items-start gap-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-semibold text-amber-400">
                        {item.subcategory?.id}
                      </span>
                      <span className={`font-sans text-[11px] font-medium px-2 py-0.5 rounded-full ${statusBadgeClass(item.status || 'not_assessed')}`}>
                        {statusLabel(item.status || 'not_assessed')}
                      </span>
                    </div>
                    <p className="font-sans text-xs text-[#8E8FA8] leading-relaxed">
                      {item.subcategory?.description}
                    </p>
                  </div>
                  <div className="flex-shrink-0 w-44">
                    <select
                      value={item.status || 'not_assessed'}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      className="w-full px-3 py-1.5 bg-white/[0.03] border border-white/[0.07] rounded-lg font-sans text-xs text-[#F0F0F5] focus:outline-none focus:border-amber-500/30 transition-colors appearance-none cursor-pointer"
                    >
                      <option value="not_assessed">Not Assessed</option>
                      <option value="compliant">Compliant</option>
                      <option value="partial">Partial</option>
                      <option value="non_compliant">Non-Compliant</option>
                      <option value="not_applicable">N/A</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

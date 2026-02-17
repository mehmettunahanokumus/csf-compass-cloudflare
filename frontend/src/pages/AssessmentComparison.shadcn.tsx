import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Circle, AlertCircle, Filter } from 'lucide-react';
import { vendorInvitationsApi } from '../api/vendor-invitations';
import type { ComparisonData } from '../types';
import { getErrorMessage, formatDate } from '../api/client';

type FilterType = 'all' | 'matches' | 'differences';

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'compliant':
      return <CheckCircle className="h-4 w-4 text-emerald-400" />;
    case 'partial':
      return <AlertCircle className="h-4 w-4 text-amber-400" />;
    case 'non_compliant':
      return <XCircle className="h-4 w-4 text-red-400" />;
    default:
      return <Circle className="h-4 w-4 text-[#55576A]" />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    compliant: 'bg-emerald-500/10 text-emerald-400',
    partial: 'bg-amber-500/10 text-amber-400',
    non_compliant: 'bg-red-500/10 text-red-400',
    not_applicable: 'bg-white/[0.06] text-[#55576A]',
  };
  const labels: Record<string, string> = {
    compliant: 'Compliant',
    partial: 'Partial',
    non_compliant: 'Non-Compliant',
    not_applicable: 'N/A',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-sans font-medium ${variants[status] || 'bg-white/[0.06] text-[#55576A]'}`}>
      {labels[status] || 'Not Assessed'}
    </span>
  );
}

export default function AssessmentComparison() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ComparisonData | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadComparison();
  }, [id]);

  const loadComparison = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const comparisonData = await vendorInvitationsApi.getComparison(id);
      setData(comparisonData);
      if (comparisonData.comparison_items.length > 0) {
        const firstFunction = comparisonData.comparison_items[0]?.function?.id;
        if (firstFunction) setSelectedFunction(firstFunction);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-white/[0.04] rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-white/[0.04] rounded-xl" />
          ))}
        </div>
        <div className="h-96 bg-white/[0.04] rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="font-sans text-sm text-[#8E8FA8]">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.organization_assessment) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-sans text-sm text-[#55576A]">Comparison data not available</p>
      </div>
    );
  }

  const functions = Array.from(
    new Map(
      data.comparison_items
        .filter((item) => item.function)
        .map((item) => [item.function!.id, item.function!])
    ).values()
  );

  let filteredItems = data.comparison_items;
  if (selectedFunction) {
    filteredItems = filteredItems.filter((item) => item.function?.id === selectedFunction);
  }
  if (filter === 'matches') {
    filteredItems = filteredItems.filter((item) => item.matches && item.vendor_item);
  } else if (filter === 'differences') {
    filteredItems = filteredItems.filter((item) => !item.matches || !item.vendor_item);
  }

  const totalItems = data.comparison_items.length;
  const assessedByVendor = data.comparison_items.filter((item) => item.vendor_item).length;
  const matches = data.comparison_items.filter((item) => item.matches && item.vendor_item).length;
  const differences = data.comparison_items.filter((item) => !item.matches && item.vendor_item).length;
  const notAssessed = totalItems - assessedByVendor;

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Header */}
      <div>
        <Link
          to={`/assessments/${id}`}
          className="inline-flex items-center gap-1.5 font-sans text-sm text-[#8E8FA8] hover:text-[#F0F0F5] transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Assessment
        </Link>
        <h1 className="font-display text-2xl font-bold text-[#F0F0F5]">Assessment Comparison</h1>
        <p className="font-sans text-sm text-[#8E8FA8] mt-1">{data.organization_assessment.name}</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Items', value: totalItems, color: 'text-amber-400' },
          { label: 'Matches', value: matches, color: 'text-emerald-400' },
          { label: 'Differences', value: differences, color: 'text-amber-400' },
          { label: 'Not Assessed', value: notAssessed, color: 'text-[#55576A]' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-5 hover:border-amber-500/20 transition-all">
            <p className="font-sans text-xs text-[#8E8FA8] font-medium">{stat.label}</p>
            <p className={`font-display text-3xl font-bold tabular-nums mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Invitation Status */}
      {data.invitation && (
        <div className="relative bg-[#0E1018] border border-white/[0.07] rounded-xl p-5 overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-500 rounded-l-xl" />
          <div className="flex justify-between items-center flex-wrap gap-3 pl-3">
            <div>
              <p className="font-display text-sm font-semibold text-[#F0F0F5]">Vendor Self-Assessment Status</p>
              <p className="font-sans text-sm text-[#8E8FA8] mt-0.5">
                Invitation sent to {data.invitation.vendor_contact_email} on {formatDate(data.invitation.sent_at)}
              </p>
            </div>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-sans font-medium ${
              data.invitation.invitation_status === 'completed'
                ? 'bg-emerald-500/10 text-emerald-400'
                : data.invitation.invitation_status === 'accessed'
                ? 'bg-amber-500/10 text-amber-400'
                : 'bg-white/[0.06] text-[#8E8FA8]'
            }`}>
              {data.invitation.invitation_status === 'completed'
                ? 'Completed'
                : data.invitation.invitation_status === 'accessed'
                ? 'In Progress'
                : data.invitation.invitation_status}
            </span>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl overflow-hidden">
        {/* Filter Bar */}
        <div className="flex items-center gap-4 p-4 border-b border-white/[0.06] flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#55576A]" />
            <span className="font-display text-[10px] tracking-[0.12em] uppercase text-[#55576A] font-semibold">Filter</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'all' as FilterType, label: `All (${totalItems})` },
              { value: 'matches' as FilterType, label: `Matches (${matches})` },
              { value: 'differences' as FilterType, label: `Differences (${differences + notAssessed})` },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-3 py-1.5 rounded-lg font-sans text-xs font-medium transition-all ${
                  filter === value
                    ? 'bg-amber-500 text-[#08090E]'
                    : 'bg-white/[0.04] text-[#8E8FA8] border border-white/[0.06] hover:border-amber-500/20'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Function Tabs */}
        <div className="flex gap-0 px-4 border-b border-white/[0.06] overflow-x-auto">
          {functions.map((func) => (
            <button
              key={func.id}
              onClick={() => setSelectedFunction(func.id)}
              className={`py-3 px-4 font-display text-[11px] tracking-[0.06em] uppercase font-semibold border-b-2 transition-colors whitespace-nowrap ${
                selectedFunction === func.id
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-[#55576A] hover:text-[#8E8FA8]'
              }`}
            >
              {func.name}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-2.5 px-4 font-display text-[10px] tracking-[0.12em] uppercase text-[#55576A] font-semibold w-1/4">Subcategory</th>
                <th className="text-left py-2.5 px-4 font-display text-[10px] tracking-[0.12em] uppercase text-[#55576A] font-semibold w-1/4">Your Assessment</th>
                <th className="text-left py-2.5 px-4 font-display text-[10px] tracking-[0.12em] uppercase text-[#55576A] font-semibold w-1/4">Vendor Self-Assessment</th>
                <th className="text-left py-2.5 px-4 font-display text-[10px] tracking-[0.12em] uppercase text-[#55576A] font-semibold w-1/4">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 font-sans text-sm text-[#55576A]">
                    No items to display
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const hasWarning = item.vendor_item && !item.matches;
                  return (
                    <tr
                      key={item.subcategory_id}
                      className={`border-b border-white/[0.03] transition-colors ${
                        hasWarning ? 'bg-amber-500/[0.03]' : 'hover:bg-amber-500/[0.02]'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-mono text-[11px] font-semibold text-amber-400">{item.subcategory?.id}</div>
                        <div className="font-sans text-xs text-[#8E8FA8] mt-0.5">{item.subcategory?.name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 mb-1">
                          <StatusIcon status={item.org_item.status} />
                          <StatusBadge status={item.org_item.status} />
                        </div>
                        {item.org_item.notes && (
                          <p className="font-sans text-xs text-[#55576A] mt-1">{item.org_item.notes}</p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {item.vendor_item ? (
                          <>
                            <div className="flex items-center gap-2 mb-1">
                              <StatusIcon status={item.vendor_item.status} />
                              <StatusBadge status={item.vendor_item.status} />
                            </div>
                            {item.vendor_item.notes && (
                              <p className="font-sans text-xs text-[#55576A] mt-1">{item.vendor_item.notes}</p>
                            )}
                          </>
                        ) : (
                          <span className="font-sans text-xs text-[#55576A] italic">Not assessed</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {!item.vendor_item ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-sans font-medium bg-white/[0.06] text-[#55576A]">
                            Not Assessed
                          </span>
                        ) : item.matches ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-sans font-medium bg-emerald-500/10 text-emerald-400">
                            Match
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-sans font-medium bg-amber-500/10 text-amber-400">
                            Difference
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

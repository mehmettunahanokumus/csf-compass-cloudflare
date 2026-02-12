/**
 * AssessmentChecklist - Full checklist view for an assessment
 * Displays all subcategories grouped by function/category with status dropdowns
 */

import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { assessmentsApi } from '../api/assessments';
import { csfApi } from '../api/csf';
import { getErrorMessage } from '../api/client';
import type { Assessment, AssessmentItem, CsfFunction } from '../types';
import Skeleton from '../components/Skeleton.new';

const STATUS_OPTIONS = [
  { value: 'compliant', label: 'Compliant' },
  { value: 'partial', label: 'Partial' },
  { value: 'non_compliant', label: 'Non-Compliant' },
  { value: 'not_assessed', label: 'Not Assessed' },
  { value: 'not_applicable', label: 'N/A' },
] as const;

const STATUS_COLORS: Record<string, { dot: string; bg: string }> = {
  compliant: { dot: 'var(--green)', bg: 'var(--green-subtle)' },
  partial: { dot: 'var(--orange)', bg: 'var(--orange-subtle)' },
  non_compliant: { dot: 'var(--red)', bg: 'var(--red-subtle)' },
  not_assessed: { dot: 'var(--gray)', bg: 'var(--gray-subtle)' },
  not_applicable: { dot: 'var(--text-4)', bg: 'var(--gray-subtle)' },
};

const FUNCTION_TABS = [
  { code: 'All', label: 'All' },
  { code: 'GV', label: 'GV' },
  { code: 'ID', label: 'ID' },
  { code: 'PR', label: 'PR' },
  { code: 'DE', label: 'DE' },
  { code: 'RS', label: 'RS' },
  { code: 'RC', label: 'RC' },
];

/** Simple SVG compliance circle */
function ComplianceCircle({ score, size = 200 }: { score: number; size?: number }) {
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 75 ? 'var(--green)' : score >= 50 ? 'var(--orange)' : 'var(--red)';

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--border)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--text-1)"
        style={{
          fontSize: 32,
          fontWeight: 700,
          fontFamily: 'var(--font-sans)',
          transform: 'rotate(90deg)',
          transformOrigin: `${size / 2}px ${size / 2}px`,
        }}
      >
        {Math.round(score)}%
      </text>
    </svg>
  );
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

  // Distribution stats
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

  // Filter items by tab and search
  const filteredItems = useMemo(() => {
    let filtered = items;

    if (activeTab !== 'All') {
      filtered = filtered.filter((item) => {
        const funcName = item.function?.name || '';
        const catName = item.category?.name || '';
        // Match by function code prefix in category name or function name
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

  // Group items by category
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
      const updated = await assessmentsApi.updateItem(id, itemId, {
        status: newStatus as AssessmentItem['status'],
      });
      setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...updated } : item)));
    } catch (err) {
      console.error('Failed to update status:', getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Skeleton w="200px" h="32px" />
        <Skeleton w="100%" h="200px" />
        <Skeleton w="100%" h="48px" />
        <Skeleton w="100%" h="300px" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: 'center',
          color: 'var(--red-text)',
          fontSize: 14,
        }}
      >
        <p style={{ marginBottom: 12 }}>{error}</p>
        <button
          onClick={loadData}
          style={{
            padding: '8px 16px',
            background: 'var(--accent)',
            color: 'var(--text-on-accent)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontFamily: 'var(--font-ui)',
            fontSize: 14,
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link
          to={`/assessments/${id}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--text-3)',
            textDecoration: 'none',
            fontSize: 14,
            marginBottom: 8,
          }}
        >
          <ArrowLeft size={16} />
          Back to Assessment
        </Link>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--text-1)',
            margin: '4px 0',
          }}
        >
          Assessment Checklist
        </h1>
        <p style={{ color: 'var(--text-3)', fontSize: 14 }}>
          {items.length} subcategories across {functions.length} functions
        </p>
      </div>

      {/* Score Overview Card */}
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          padding: 24,
          marginBottom: 24,
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: 32,
          alignItems: 'center',
        }}
      >
        <ComplianceCircle score={complianceScore} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Compliant', count: distribution.compliant, color: 'var(--green)' },
            { label: 'Partially Compliant', count: distribution.partial, color: 'var(--orange)' },
            { label: 'Non-Compliant', count: distribution.non_compliant, color: 'var(--red)' },
            { label: 'Not Assessed', count: distribution.not_assessed, color: 'var(--gray)' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 14,
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: stat.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ color: 'var(--text-2)', flex: 1 }}>{stat.label}</span>
              <span style={{ fontWeight: 600, color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>
                {stat.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Function Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          overflowX: 'auto',
          borderBottom: '2px solid var(--border)',
          marginBottom: 16,
        }}
      >
        {FUNCTION_TABS.map((tab) => (
          <button
            key={tab.code}
            onClick={() => setActiveTab(tab.code)}
            style={{
              padding: '10px 18px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.code ? '2px solid var(--navy-900)' : '2px solid transparent',
              marginBottom: -2,
              fontSize: 14,
              fontWeight: activeTab === tab.code ? 700 : 500,
              color: activeTab === tab.code ? 'var(--text-1)' : 'var(--text-3)',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              whiteSpace: 'nowrap',
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div
        style={{
          position: 'relative',
          marginBottom: 20,
        }}
      >
        <Search
          size={18}
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-4)',
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          placeholder="Search by code or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px 10px 40px',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 14,
            color: 'var(--text-1)',
            outline: 'none',
            fontFamily: 'var(--font-ui)',
          }}
        />
      </div>

      {/* Category Groups */}
      {groupedItems.length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: 'center',
            color: 'var(--text-3)',
            fontSize: 14,
          }}
        >
          No items match your filter.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {groupedItems.map((group) => (
            <div
              key={group.categoryId}
              style={{
                background: 'var(--card)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-xs)',
                overflow: 'hidden',
              }}
            >
              {/* Category Header */}
              <div
                style={{
                  background: 'var(--ground)',
                  padding: '10px 16px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    fontSize: 14,
                    color: 'var(--text-1)',
                  }}
                >
                  {group.categoryName}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-3)' }}>
                  {group.items.length} items
                </span>
              </div>

              {/* Items */}
              {group.items.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    borderBottom:
                      idx < group.items.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  {/* Code badge */}
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      fontWeight: 600,
                      background: 'var(--accent-subtle)',
                      color: 'var(--accent)',
                      padding: '3px 8px',
                      borderRadius: 4,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {item.subcategory?.name || '—'}
                  </span>

                  {/* Description */}
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13,
                      color: 'var(--text-2)',
                      lineHeight: 1.4,
                      minWidth: 0,
                    }}
                  >
                    {item.subcategory?.description || ''}
                  </span>

                  {/* Status dropdown */}
                  <select
                    value={item.status}
                    onChange={(e) => handleStatusChange(item.id, e.target.value)}
                    style={{
                      padding: '5px 8px',
                      fontSize: 12,
                      fontWeight: 500,
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      background: STATUS_COLORS[item.status]?.bg || 'var(--card)',
                      color: 'var(--text-1)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-ui)',
                      flexShrink: 0,
                      outline: 'none',
                      minWidth: 120,
                    }}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

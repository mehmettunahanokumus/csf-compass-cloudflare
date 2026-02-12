/**
 * Assessments - Rebuilt from scratch
 * Uses new AssessmentCard component in grid layout
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { assessmentsApi } from '../api/assessments';
import type { Assessment } from '../types';
import { getErrorMessage } from '../api/client';
import AssessmentCard from '../components/AssessmentCard.new';
import Skeleton from '../components/Skeleton.new';

export default function AssessmentsNew() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'organization' | 'vendor'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await assessmentsApi.list();
      setAssessments(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Filter assessments by type
  const filteredAssessments = assessments.filter((assessment) => {
    const matchesSearch = assessment.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || assessment.assessment_type === filterType;
    return matchesSearch && matchesType;
  });

  // Count by type
  const orgCount = assessments.filter((a) => a.assessment_type === 'organization').length;
  const vendorCount = assessments.filter((a) => a.assessment_type === 'vendor').length;

  if (loading) {
    return (
      <div>
        {/* Header skeleton */}
        <div style={{ marginBottom: '24px' }}>
          <Skeleton w="200px" h="28px" />
          <Skeleton w="300px" h="16px" />
        </div>

        {/* Filter bar skeleton */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '12px' }}>
          <Skeleton w="250px" h="38px" />
          <Skeleton w="150px" h="38px" />
        </div>

        {/* Cards skeleton */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth < 768 ? '1fr' : window.innerWidth < 1024 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: '16px',
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                boxShadow: 'var(--shadow-xs)',
                minHeight: '180px',
              }}
            >
              <Skeleton w="80%" h="16px" />
              <Skeleton w="60px" h="20px" />
              <Skeleton w="100%" h="40px" />
              <Skeleton w="100%" h="3px" />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                <Skeleton w="60px" h="30px" />
                <Skeleton w="80px" h="30px" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          background: 'var(--red-subtle)',
          border: '1px solid var(--red)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          color: 'var(--red-text)',
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-1)', marginBottom: '4px' }}>
            Assessments
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-2)' }}>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{filteredAssessments.length}</span> total
          </p>
        </div>
        <button
          onClick={() => navigate('/assessments/new')}
          style={{
            background: 'var(--accent)',
            color: 'var(--text-on-accent)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent)'}
        >
          <Plus size={18} />
          New Assessment
        </button>
      </div>

      {/* Type Tabs */}
      <div style={{ borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '0' }}>
          {[
            { value: 'all' as const, label: 'All', count: assessments.length },
            { value: 'organization' as const, label: 'Organization', count: orgCount },
            { value: 'vendor' as const, label: 'Vendor', count: vendorCount },
          ].map(({ value, label, count }) => {
            const isActive = filterType === value;
            return (
              <button
                key={value}
                onClick={() => setFilterType(value)}
                style={{
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--accent)' : 'var(--text-3)',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                  cursor: 'pointer',
                  marginBottom: '-1px',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--text-1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--text-3)';
                  }
                }}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Search bar */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-4)',
            }}
          />
          <input
            type="text"
            placeholder="Search assessments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 14px 9px 38px',
              fontSize: '14px',
              color: 'var(--text-1)',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              outline: 'none',
              transition: 'all 150ms ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-focus)';
              e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-subtle)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      {/* Assessments grid */}
      {filteredAssessments.length === 0 ? (
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '64px 20px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <p style={{ color: 'var(--text-3)', fontSize: '14px', marginBottom: '16px' }}>
            {searchTerm || filterType !== 'all' ? 'No assessments match your filters' : 'No assessments yet'}
          </p>
          <button
            onClick={() => navigate('/assessments/new')}
            style={{
              background: 'var(--accent)',
              color: 'var(--text-on-accent)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Create Your First Assessment
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth < 768 ? '1fr' : window.innerWidth < 1024 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: '16px',
          }}
        >
          {filteredAssessments.map((assessment) => (
            <AssessmentCard
              key={assessment.id}
              title={assessment.name}
              description={assessment.description}
              status={assessment.status === 'archived' ? 'completed' : assessment.status as 'draft' | 'in_progress' | 'completed'}
              score={assessment.overall_score || 0}
              createdDate={new Date(assessment.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
              onClick={() => navigate(`/assessments/${assessment.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

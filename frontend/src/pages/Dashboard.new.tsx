/**
 * Dashboard - Rebuilt from scratch
 * Uses new StatCard and AssessmentRow components
 */

import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2,
  AlertTriangle,
  ShieldAlert,
  BarChart3,
  Compass,
} from 'lucide-react';
import { assessmentsApi } from '../api/assessments';
import { vendorsApi } from '../api/vendors';
import type { Assessment, Vendor } from '../types';
import { getErrorMessage } from '../api/client';
import StatCard from '../components/StatCard.new';
import AssessmentRow from '../components/AssessmentRow.new';
import Skeleton from '../components/Skeleton.new';

// Helper: Format relative time
function formatRelativeTime(timestamp: number | null | undefined): string {
  if (!timestamp || isNaN(timestamp) || timestamp <= 0) {
    return 'just created';
  }

  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 0 || isNaN(diff)) {
    return 'just now';
  }

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// NIST CSF 2.0 function definitions
const CSF_FUNCTIONS = [
  { code: 'GV', name: 'Govern', color: '#6366f1', borderColor: '#a5b4fc' },
  { code: 'ID', name: 'Identify', color: '#3b82f6', borderColor: '#93c5fd' },
  { code: 'PR', name: 'Protect', color: '#0ea5e9', borderColor: '#7dd3fc' },
  { code: 'DE', name: 'Detect', color: '#f59e0b', borderColor: '#fcd34d' },
  { code: 'RS', name: 'Respond', color: '#ef4444', borderColor: '#fca5a5' },
  { code: 'RC', name: 'Recover', color: '#10b981', borderColor: '#6ee7b7' },
];

export default function DashboardNew() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assessmentData, vendorData] = await Promise.all([
        assessmentsApi.list(),
        vendorsApi.list().catch(() => [] as Vendor[]),
      ]);
      setAssessments(assessmentData);
      setVendors(vendorData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const draftAssessments = assessments.filter((a) => a.status === 'draft');
  const inProgressAssessments = assessments.filter((a) => a.status === 'in_progress');
  const completedAssessments = assessments.filter((a) => a.status === 'completed');

  // Recent assessments (last 5)
  const recentAssessments = [...assessments]
    .sort((a, b) => b.updated_at - a.updated_at)
    .slice(0, 5);

  // Vendor stats
  const highRiskVendors = vendors.filter(
    (v) => (v.latest_assessment_score ?? 100) < 50
  );
  const criticalVendors = vendors.filter(
    (v) => v.criticality_level === 'critical' || v.risk_tier === 'critical'
  );
  const avgRiskScore =
    vendors.length > 0
      ? vendors.reduce((sum, v) => sum + (v.latest_assessment_score ?? 0), 0) / vendors.length
      : 0;

  if (loading) {
    return (
      <div>
        {/* Stat cards skeleton */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
            marginBottom: '28px',
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '20px 24px',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <Skeleton w="60%" h="12px" />
              <Skeleton w="40%" h="32px" rounded="4px" />
              <Skeleton w="50%" h="12px" />
            </div>
          ))}
        </div>

        {/* Rows skeleton */}
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                padding: '12px 16px',
                borderBottom: i < 5 ? '1px solid var(--border)' : 'none',
              }}
            >
              <Skeleton w="100%" h="40px" />
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
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ marginBottom: '24px' }}
      >
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-1)', marginBottom: '4px' }}>
          Dashboard
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-2)' }}>
          Overview of your assessments and vendors
        </p>
      </motion.div>

      {/* Stat cards grid */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth < 768 ? '1fr' : window.innerWidth < 1024 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <StatCard
          label="TOTAL ASSESSMENTS"
          value={assessments.length}
          trend={{
            direction: 'up',
            percentage: assessments.length > 0 ? 15.0 : 0,
            from: assessments.length - Math.floor(assessments.length * 0.15),
          }}
          sparklineColor="var(--accent)"
          onClick={() => navigate('/assessments')}
        />
        <StatCard
          label="DRAFT"
          value={draftAssessments.length}
          sparklineColor="var(--gray)"
          onClick={() => navigate('/assessments?status=draft')}
        />
        <StatCard
          label="IN PROGRESS"
          value={inProgressAssessments.length}
          trend={{
            direction: 'up',
            percentage: inProgressAssessments.length > 0 ? 20.0 : 0,
            from: inProgressAssessments.length - Math.floor(inProgressAssessments.length * 0.2),
          }}
          sparklineColor="var(--blue)"
          onClick={() => navigate('/assessments?status=in_progress')}
        />
        <StatCard
          label="COMPLETED"
          value={completedAssessments.length}
          sparklineColor="var(--green)"
          onClick={() => navigate('/assessments?status=completed')}
        />
      </motion.div>

      {/* Recent Assessments */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-1)' }}>
            Recent Assessments
          </h2>
          <button
            onClick={() => navigate('/assessments')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              fontSize: '13px',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            View all
          </button>
        </div>

        {/* Assessment rows */}
        {recentAssessments.length === 0 ? (
          <div
            style={{
              padding: '48px 20px',
              textAlign: 'center',
              color: 'var(--text-3)',
              fontSize: '14px',
            }}
          >
            No assessments yet
          </div>
        ) : (
          recentAssessments.map((assessment) => (
            <AssessmentRow
              key={assessment.id}
              title={assessment.name}
              type={assessment.assessment_type as 'vendor' | 'organization'}
              status={assessment.status === 'archived' ? 'completed' : assessment.status as 'draft' | 'in_progress' | 'completed'}
              date={new Date(assessment.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
              relativeTime={formatRelativeTime(assessment.updated_at)}
              score={assessment.overall_score ?? null}
              onClick={() => navigate(`/assessments/${assessment.id}`)}
            />
          ))
        )}
      </motion.div>

      {/* Vendor Risk Management Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        style={{ marginTop: '32px' }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '16px' }}>
          Vendor Risk Management
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth < 768 ? '1fr' : window.innerWidth < 1024 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: '16px',
          }}
        >
          {/* Total Vendors */}
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              boxShadow: 'var(--shadow-xs)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            onClick={() => navigate('/vendors')}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              e.currentTarget.style.borderColor = 'var(--border-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)', marginBottom: '8px' }}>
                  Total Vendors
                </p>
                <p style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                  {vendors.length}
                </p>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={20} style={{ color: 'var(--accent)' }} />
              </div>
            </div>
          </div>

          {/* High Risk Vendors */}
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              boxShadow: 'var(--shadow-xs)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            onClick={() => navigate('/vendors')}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              e.currentTarget.style.borderColor = 'var(--border-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)', marginBottom: '8px' }}>
                  High Risk
                </p>
                <p style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--red)' }}>
                  {highRiskVendors.length}
                </p>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--red-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={20} style={{ color: 'var(--red)' }} />
              </div>
            </div>
          </div>

          {/* Critical Vendors */}
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              boxShadow: 'var(--shadow-xs)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            onClick={() => navigate('/vendors')}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              e.currentTarget.style.borderColor = 'var(--border-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)', marginBottom: '8px' }}>
                  Critical
                </p>
                <p style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--orange)' }}>
                  {criticalVendors.length}
                </p>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--orange-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldAlert size={20} style={{ color: 'var(--orange)' }} />
              </div>
            </div>
          </div>

          {/* Average Risk Score */}
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              boxShadow: 'var(--shadow-xs)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            onClick={() => navigate('/vendors')}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              e.currentTarget.style.borderColor = 'var(--border-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)', marginBottom: '8px' }}>
                  Avg Risk Score
                </p>
                <p style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--blue)' }}>
                  {avgRiskScore > 0 ? `${avgRiskScore.toFixed(1)}%` : 'N/A'}
                </p>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--blue-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart3 size={20} style={{ color: 'var(--blue)' }} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* NIST CSF 2.0 Framework Overview */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        style={{ marginTop: '32px' }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '16px' }}>
          NIST CSF 2.0 Framework
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              window.innerWidth < 640
                ? 'repeat(2, 1fr)'
                : window.innerWidth < 1024
                ? 'repeat(3, 1fr)'
                : 'repeat(6, 1fr)',
            gap: '12px',
          }}
        >
          {CSF_FUNCTIONS.map((func) => (
            <div
              key={func.code}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderTop: `3px solid ${func.borderColor}`,
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                boxShadow: 'var(--shadow-xs)',
                transition: 'all 150ms ease',
                cursor: 'pointer',
              }}
              onClick={() => navigate('/assessments')}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  background: 'var(--navy-900, #1e293b)',
                  color: '#fff',
                  letterSpacing: '0.03em',
                  marginBottom: '8px',
                }}
              >
                {func.code}
              </span>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '4px' }}>
                {func.name}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                CSF Function
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Getting Started Section - shown only when no assessments */}
      {assessments.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          style={{
            marginTop: '32px',
            background: 'linear-gradient(135deg, var(--navy-900, #0f172a) 0%, var(--navy-800, #1e293b) 100%)',
            borderRadius: 'var(--radius-md)',
            padding: '48px 32px',
            textAlign: 'center',
          }}
        >
          <Compass size={48} style={{ color: 'rgba(255,255,255,0.8)', margin: '0 auto 16px', display: 'block' }} />
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
            Get Started with CSF Compass
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', marginBottom: '28px', maxWidth: '480px', margin: '0 auto 28px' }}>
            Create your first assessment to begin evaluating cybersecurity posture
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/assessments/new"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '14px',
                fontWeight: 600,
                background: '#fff',
                color: 'var(--navy-900, #0f172a)',
                textDecoration: 'none',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Create First Assessment
            </Link>
            <Link
              to="/vendors"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '14px',
                fontWeight: 600,
                background: 'transparent',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.4)',
                textDecoration: 'none',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)')}
            >
              Add Vendor
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/**
 * VendorDetail - Rebuilt from scratch
 * Full vendor view with information, statistics, and assessment history
 */

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, ClipboardList, Globe, Mail, User, Phone } from 'lucide-react';
import { vendorsApi } from '../api/vendors';
import { assessmentsApi } from '../api/assessments';
import type { Vendor, Assessment, VendorStats } from '../types';
import { getErrorMessage, formatDate } from '../api/client';
import Skeleton from '../components/Skeleton.new';
import RiskScoreIndicator from '../components/vendors/RiskScoreIndicator';
import CriticalityBadge from '../components/vendors/CriticalityBadge';

export default function VendorDetailNew() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    name: '',
    website: '',
    contact_email: '',
    contact_name: '',
    description: '',
    risk_level: 'medium' as 'low' | 'medium' | 'high',
    risk_tier: 'medium' as 'low' | 'medium' | 'high' | 'critical',
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [vendorData, statsData, assessmentsData] = await Promise.all([
        vendorsApi.get(id),
        vendorsApi.getStats(id),
        assessmentsApi.list('vendor'),
      ]);

      setVendor(vendorData);
      setStats(statsData);

      // Filter assessments for this vendor
      const vendorAssessments = assessmentsData.filter((a) => a.vendor_id === id);
      setAssessments(vendorAssessments);

      // Initialize edit form
      setEditForm({
        name: vendorData.name,
        website: vendorData.website || '',
        contact_email: vendorData.contact_email || '',
        contact_name: vendorData.contact_name || '',
        description: vendorData.description || '',
        risk_level: vendorData.risk_level || 'medium',
        risk_tier: vendorData.risk_tier || 'medium',
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      await vendorsApi.update(id, editForm);
      setEditing(false);
      loadData();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this vendor? This will also delete all associated assessments.')) {
      return;
    }

    try {
      await vendorsApi.delete(id);
      navigate('/vendors');
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const getRiskBadge = (tier: string | undefined) => {
    switch (tier) {
      case 'critical':
      case 'high':
        return { bg: 'var(--red-subtle)', color: 'var(--red-text)', label: tier === 'critical' ? 'Critical' : 'High' };
      case 'medium':
        return { bg: 'var(--orange-subtle)', color: 'var(--orange-text)', label: 'Medium' };
      case 'low':
        return { bg: 'var(--green-subtle)', color: 'var(--green-text)', label: 'Low' };
      default:
        return { bg: 'var(--gray-subtle)', color: 'var(--gray-text)', label: 'Medium' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: 'var(--green-subtle)', color: 'var(--green-text)', label: 'completed' };
      case 'in_progress':
        return { bg: 'var(--blue-subtle)', color: 'var(--blue-text)', label: 'in progress' };
      case 'draft':
        return { bg: 'var(--gray-subtle)', color: 'var(--gray-text)', label: 'draft' };
      default:
        return { bg: 'var(--gray-subtle)', color: 'var(--gray-text)', label: 'draft' };
    }
  };

  if (loading) {
    return (
      <div>
        {/* Header skeleton */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Skeleton w="40px" h="40px" />
            <div>
              <Skeleton w="250px" h="32px" />
              <Skeleton w="200px" h="16px" />
            </div>
          </div>
          <Skeleton w="120px" h="40px" />
        </div>

        {/* Info card skeleton */}
        <Skeleton w="100%" h="200px" />

        {/* Stats skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', margin: '24px 0' }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} w="100%" h="100px" />
          ))}
        </div>

        {/* Assessment history skeleton */}
        <Skeleton w="100%" h="300px" />
      </div>
    );
  }

  if (error || !vendor) {
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
        {error || 'Vendor not found'}
      </div>
    );
  }

  const riskBadge = getRiskBadge(vendor.risk_tier);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
          <Link
            to="/vendors"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-3)',
              textDecoration: 'none',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--raised)';
              e.currentTarget.style.color = 'var(--text-1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--card)';
              e.currentTarget.style.color = 'var(--text-3)';
            }}
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-1)', marginBottom: '4px' }}>
              {vendor.name}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>
              Added {formatDate(vendor.created_at)}
              {vendor.last_assessment_date && ` • Last assessed ${formatDate(vendor.last_assessment_date)}`}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div
            style={{
              padding: '5px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: 500,
              background: riskBadge.bg,
              color: riskBadge.color,
            }}
          >
            {riskBadge.label} risk
          </div>
          {!editing && (
            <>
              <button
                onClick={() => setEditing(true)}
                style={{
                  background: 'var(--card)',
                  color: 'var(--text-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--raised)';
                  e.currentTarget.style.color = 'var(--text-1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--card)';
                  e.currentTarget.style.color = 'var(--text-2)';
                }}
              >
                <Edit2 size={16} />
                Edit
              </button>
              <button
                onClick={handleDelete}
                style={{
                  background: 'var(--red-subtle)',
                  color: 'var(--red-text)',
                  border: '1px solid var(--red)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--red)';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--red-subtle)';
                  e.currentTarget.style.color = 'var(--red-text)';
                }}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Vendor Information */}
      {editing ? (
        <form
          onSubmit={handleEdit}
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '28px',
            marginBottom: '24px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '20px' }}>
            Edit Vendor
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(2, 1fr)', gap: '20px' }}>
            {/* Vendor Name */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-2)', marginBottom: '8px' }}>
                Vendor Name *
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '14px',
                  color: 'var(--text-1)',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  outline: 'none',
                }}
              />
            </div>

            {/* Risk Tier */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-2)', marginBottom: '8px' }}>
                Risk Tier (Business Impact)
              </label>
              <select
                value={editForm.risk_tier}
                onChange={(e) => setEditForm({ ...editForm, risk_tier: e.target.value as any })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '14px',
                  color: 'var(--text-1)',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* Risk Level */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-2)', marginBottom: '8px' }}>
                Risk Level (Technical)
              </label>
              <select
                value={editForm.risk_level}
                onChange={(e) => setEditForm({ ...editForm, risk_level: e.target.value as any })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '14px',
                  color: 'var(--text-1)',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>
            </div>

            {/* Website */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-2)', marginBottom: '8px' }}>
                Website
              </label>
              <input
                type="url"
                value={editForm.website}
                onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                placeholder="https://example.com"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '14px',
                  color: 'var(--text-1)',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  outline: 'none',
                }}
              />
            </div>

            {/* Contact Email */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-2)', marginBottom: '8px' }}>
                Contact Email
              </label>
              <input
                type="email"
                value={editForm.contact_email}
                onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })}
                placeholder="contact@vendor.com"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '14px',
                  color: 'var(--text-1)',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  outline: 'none',
                }}
              />
            </div>

            {/* Contact Name */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-2)', marginBottom: '8px' }}>
                Contact Name
              </label>
              <input
                type="text"
                value={editForm.contact_name}
                onChange={(e) => setEditForm({ ...editForm, contact_name: e.target.value })}
                placeholder="John Doe"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '14px',
                  color: 'var(--text-1)',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  outline: 'none',
                }}
              />
            </div>

            {/* Description */}
            <div style={{ gridColumn: window.innerWidth < 768 ? 'span 1' : 'span 2' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-2)', marginBottom: '8px' }}>
                Description
              </label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
                placeholder="Brief description of the vendor's services..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '14px',
                  color: 'var(--text-1)',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'var(--font-ui)',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
            <button
              type="submit"
              style={{
                background: 'var(--accent)',
                color: 'var(--text-on-accent)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setEditForm({
                  name: vendor.name,
                  website: vendor.website || '',
                  contact_email: vendor.contact_email || '',
                  contact_name: vendor.contact_name || '',
                  description: vendor.description || '',
                  risk_level: vendor.risk_level || 'medium',
                  risk_tier: vendor.risk_tier || 'medium',
                });
              }}
              style={{
                background: 'var(--card)',
                color: 'var(--text-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--raised)';
                e.currentTarget.style.color = 'var(--text-1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--card)';
                e.currentTarget.style.color = 'var(--text-2)';
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 1024 ? '1fr' : '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Contact Information Card */}
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '28px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '20px' }}>
              Contact Information
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(2, 1fr)', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Mail size={20} style={{ color: 'var(--text-4)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', marginBottom: '4px' }}>
                    Email
                  </p>
                  {vendor.contact_email ? (
                    <a
                      href={`mailto:${vendor.contact_email}`}
                      style={{ fontSize: '14px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}
                    >
                      {vendor.contact_email}
                    </a>
                  ) : (
                    <p style={{ fontSize: '14px', color: 'var(--text-4)' }}>Not provided</p>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <Globe size={20} style={{ color: 'var(--text-4)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', marginBottom: '4px' }}>
                    Website
                  </p>
                  {vendor.website ? (
                    <a
                      href={vendor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '14px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}
                    >
                      {vendor.website}
                    </a>
                  ) : (
                    <p style={{ fontSize: '14px', color: 'var(--text-4)' }}>Not provided</p>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <Phone size={20} style={{ color: 'var(--text-4)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', marginBottom: '4px' }}>
                    Phone
                  </p>
                  {vendor.contact_phone ? (
                    <a
                      href={`tel:${vendor.contact_phone}`}
                      style={{ fontSize: '14px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}
                    >
                      {vendor.contact_phone}
                    </a>
                  ) : (
                    <p style={{ fontSize: '14px', color: 'var(--text-4)' }}>Not provided</p>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <User size={20} style={{ color: 'var(--text-4)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', marginBottom: '4px' }}>
                    Contact Name
                  </p>
                  {vendor.contact_name ? (
                    <p style={{ fontSize: '14px', color: 'var(--text-1)', fontWeight: 500 }}>{vendor.contact_name}</p>
                  ) : (
                    <p style={{ fontSize: '14px', color: 'var(--text-4)' }}>Not provided</p>
                  )}
                </div>
              </div>

              {vendor.description && (
                <div style={{ gridColumn: window.innerWidth < 768 ? 'span 1' : 'span 2' }}>
                  <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', marginBottom: '6px' }}>
                    Description
                  </p>
                  <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.6 }}>{vendor.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Risk Score */}
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '28px',
              boxShadow: 'var(--shadow-xs)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-1)' }}>
              Risk Score
            </h3>
            <RiskScoreIndicator score={vendor.latest_assessment_score ?? 0} size="lg" />
            <CriticalityBadge
              level={(vendor.risk_tier || vendor.criticality_level || 'medium') as 'low' | 'medium' | 'high' | 'critical'}
            />
            {vendor.last_assessment_date && (
              <p style={{ fontSize: '12px', color: 'var(--text-4)', marginTop: '4px' }}>
                Last assessed: {formatDate(vendor.last_assessment_date)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              window.innerWidth < 640
                ? '1fr'
                : window.innerWidth < 1024
                ? 'repeat(2, 1fr)'
                : 'repeat(4, 1fr)',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <p style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
              {stats.totalAssessments}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Total Assessments</p>
          </div>
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <p style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>
              {stats.completedAssessments}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Completed</p>
          </div>
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <p style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--blue)' }}>
              {stats.inProgressAssessments}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>In Progress</p>
          </div>
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <p style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--purple)' }}>
              {stats.averageScore?.toFixed(1) || '0.0'}%
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Avg Score</p>
          </div>
        </div>
      )}

      {/* Assessment History */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-1)' }}>Assessment History</h2>
          <Link
            to={`/assessments/new?vendor=${id}`}
            style={{
              background: 'var(--accent)',
              color: 'var(--text-on-accent)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 500,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
          >
            <ClipboardList size={16} />
            New Assessment
          </Link>
        </div>
        <div style={{ padding: '24px' }}>
          {assessments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <ClipboardList size={48} style={{ color: 'var(--text-4)', margin: '0 auto 16px' }} />
              <p style={{ fontSize: '14px', color: 'var(--text-3)', marginBottom: '20px' }}>No assessments yet</p>
              <Link
                to={`/assessments/new?vendor=${id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--accent)',
                  color: 'var(--text-on-accent)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
              >
                Create First Assessment
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {assessments.map((assessment) => {
                const statusBadge = getStatusBadge(assessment.status);
                return (
                  <Link
                    key={assessment.id}
                    to={`/assessments/${assessment.id}`}
                    style={{
                      display: 'block',
                      padding: '16px',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      textDecoration: 'none',
                      transition: 'all 150ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-hover)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-1)' }}>
                          {assessment.name}
                        </h3>
                        {assessment.description && (
                          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>
                            {assessment.description}
                          </p>
                        )}
                        <p style={{ fontSize: '12px', color: 'var(--text-4)', marginTop: '8px' }}>
                          Started {formatDate(assessment.created_at)}
                          {assessment.completed_at && ` • Completed ${formatDate(assessment.completed_at)}`}
                        </p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end', gap: '8px' }}>
                        <div
                          style={{
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '11px',
                            fontWeight: 500,
                            background: statusBadge.bg,
                            color: statusBadge.color,
                          }}
                        >
                          {statusBadge.label}
                        </div>
                        {assessment.overall_score !== null && assessment.overall_score !== undefined && (
                          <span
                            style={{
                              fontSize: '18px',
                              fontWeight: 700,
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--text-1)',
                            }}
                          >
                            {assessment.overall_score.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

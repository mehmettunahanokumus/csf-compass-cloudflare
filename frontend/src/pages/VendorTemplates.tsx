/**
 * VendorTemplates - Assessment template management (mock data)
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Info,
  Star,
  Pencil,
  Trash2,
  FileText,
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  subcategoryCount: number;
  isDefault: boolean;
  createdAt: string;
}

const mockTemplates: Template[] = [
  {
    id: 'tpl-1',
    name: 'Full NIST CSF 2.0',
    description:
      'Comprehensive assessment covering all 106 subcategories across all six NIST CSF 2.0 functions. Recommended for critical vendors requiring full compliance evaluation.',
    subcategoryCount: 106,
    isDefault: true,
    createdAt: '2024-01-15',
  },
  {
    id: 'tpl-2',
    name: 'Quick Assessment',
    description:
      'A streamlined template focusing on 30 key subcategories for rapid vendor evaluation. Ideal for initial screening or low-risk vendors.',
    subcategoryCount: 30,
    isDefault: false,
    createdAt: '2024-03-22',
  },
  {
    id: 'tpl-3',
    name: 'Cloud Provider',
    description:
      'Specialized template focusing on cloud-specific security controls including data protection, access management, and infrastructure security.',
    subcategoryCount: 45,
    isDefault: false,
    createdAt: '2024-05-10',
  },
];

export default function VendorTemplates() {
  const [templates, setTemplates] = useState<Template[]>(mockTemplates);

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
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
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-1)' }}>
            Assessment Templates
          </h1>
        </div>
        <button
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
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
        >
          <Plus size={18} />
          New Template
        </button>
      </div>

      {/* Info Card */}
      <div
        style={{
          background: 'var(--blue-subtle)',
          border: '1px solid var(--blue)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
          marginBottom: '28px',
          display: 'flex',
          gap: '14px',
          alignItems: 'flex-start',
        }}
      >
        <Info size={20} style={{ color: 'var(--blue-text)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--blue-text)', marginBottom: '6px' }}>
            About Assessment Templates
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--blue-text)', lineHeight: 1.6, opacity: 0.9 }}>
            Templates define which assessment categories and subcategories are included when
            creating new vendor assessments. The default template includes all NIST CSF 2.0
            subcategories.
          </p>
        </div>
      </div>

      {/* Template Grid */}
      {templates.length === 0 ? (
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
          <FileText size={48} style={{ color: 'var(--text-4)', margin: '0 auto 20px' }} />
          <p style={{ fontSize: '14px', color: 'var(--text-3)', marginBottom: '20px' }}>
            No assessment templates found
          </p>
          <button
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
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
          >
            <Plus size={16} />
            Create First Template
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          {templates.map((template) => (
            <div
              key={template.id}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '24px',
                boxShadow: 'var(--shadow-xs)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 200ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                e.currentTarget.style.borderColor = 'var(--border-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              {/* Title + Default Badge */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '12px',
                  gap: '12px',
                }}
              >
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-1)' }}>
                  {template.name}
                </h3>
                {template.isDefault && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: 'rgba(234, 179, 8, 0.15)',
                      color: '#b45309',
                      flexShrink: 0,
                    }}
                  >
                    <Star size={12} fill="currentColor" />
                    Default
                  </span>
                )}
              </div>

              {/* Description */}
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--text-2)',
                  lineHeight: 1.6,
                  marginBottom: '16px',
                  flex: 1,
                }}
              >
                {template.description}
              </p>

              {/* Subcategory count */}
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--text-3)',
                  marginBottom: '8px',
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-1)' }}>
                  {template.subcategoryCount}
                </span>{' '}
                subcategories
              </p>

              {/* Created date */}
              <p style={{ fontSize: '12px', color: 'var(--text-4)', marginBottom: '20px' }}>
                Created {template.createdAt}
              </p>

              {/* Footer Actions */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border)',
                }}
              >
                <button
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--text-2)',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--raised)';
                    e.currentTarget.style.color = 'var(--text-1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-2)';
                  }}
                >
                  <Pencil size={14} />
                  Edit
                </button>
                {!template.isDefault && (
                  <button
                    onClick={() => handleDelete(template.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: 'var(--red-text)',
                      background: 'var(--red-subtle)',
                      border: '1px solid var(--red)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
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
                    <Trash2 size={14} />
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

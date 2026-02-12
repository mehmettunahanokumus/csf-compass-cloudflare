/**
 * Organization Settings Page (Placeholder)
 * Future: Organization profile, team management, roles, and integrations
 */

import { Settings, Building2, Users, Shield, Puzzle, Bell, CreditCard, Globe } from 'lucide-react';
import { useState } from 'react';

export default function Organization() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [hoveredIntegration, setHoveredIntegration] = useState<string | null>(null);

  const settingsSections = [
    {
      icon: Building2,
      title: 'Organization Profile',
      description: 'Configure organization name, logo, industry, size, and company description for branding and context',
      color: 'var(--accent)',
      bgSubtle: 'var(--accent-subtle)',
    },
    {
      icon: Users,
      title: 'Team Members',
      description: 'Invite team members, manage user accounts, view activity logs, and track assessment contributions',
      color: 'var(--blue-text)',
      bgSubtle: 'var(--blue-subtle)',
    },
    {
      icon: Shield,
      title: 'Roles & Permissions',
      description: 'Define custom roles (Admin, Assessor, Viewer, Auditor) with granular permissions for assessment access',
      color: 'var(--purple-text)',
      bgSubtle: 'var(--purple-subtle)',
    },
    {
      icon: Puzzle,
      title: 'Integrations',
      description: 'Connect to GRC platforms, SIEM tools, ticketing systems (Jira, ServiceNow), and cloud providers',
      color: 'var(--green-text)',
      bgSubtle: 'var(--green-subtle)',
    },
    {
      icon: Bell,
      title: 'Notifications & Alerts',
      description: 'Configure email, Slack, and in-app notifications for assessment updates, deadlines, and risk changes',
      color: 'var(--orange-text)',
      bgSubtle: 'var(--orange-subtle)',
    },
    {
      icon: CreditCard,
      title: 'Billing & Subscription',
      description: 'Manage subscription plan, payment methods, usage limits, and view invoices and billing history',
      color: 'var(--purple-text)',
      bgSubtle: 'var(--purple-subtle)',
    },
  ];

  const integrationExamples = [
    { name: 'Slack', category: 'Communication' },
    { name: 'Microsoft Teams', category: 'Communication' },
    { name: 'Jira', category: 'Ticketing' },
    { name: 'ServiceNow', category: 'Ticketing' },
    { name: 'Splunk', category: 'SIEM' },
    { name: 'AWS', category: 'Cloud' },
    { name: 'Azure', category: 'Cloud' },
    { name: 'Google Workspace', category: 'Productivity' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 700,
            fontFamily: 'var(--font-ui)',
            color: 'var(--text-1)',
            marginBottom: '4px',
          }}
        >
          Organization Settings
        </h1>
        <p style={{ color: 'var(--text-3)', fontSize: '14px', fontFamily: 'var(--font-ui)' }}>
          Manage organization profile, team members, and integrations
        </p>
      </div>

      {/* Coming Soon Banner */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderLeft: '4px solid var(--accent)',
          borderRadius: 'var(--radius-md)',
          padding: '24px',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div
            style={{
              background: 'var(--accent-subtle)',
              padding: '12px',
              borderRadius: '50%',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Settings size={24} style={{ color: 'var(--accent)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 600,
                fontFamily: 'var(--font-ui)',
                color: 'var(--text-1)',
                marginBottom: '8px',
              }}
            >
              Organization Settings Coming Soon
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-3)', lineHeight: '1.5' }}>
              Centralized organization management for team collaboration, role-based access control, and enterprise integrations.
              Configure your workspace to align with your security governance structure.
            </p>
          </div>
        </div>
      </div>

      {/* Settings Sections Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            window.innerWidth < 768
              ? '1fr'
              : window.innerWidth < 1024
              ? 'repeat(2, 1fr)'
              : 'repeat(3, 1fr)',
          gap: '24px',
        }}
      >
        {settingsSections.map((section) => {
          const Icon = section.icon;
          const isHovered = hoveredCard === section.title;

          return (
            <div
              key={section.title}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '24px',
                boxShadow: isHovered ? 'var(--shadow-md)' : 'var(--shadow-xs)',
                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                transition: 'all 200ms ease',
                cursor: 'default',
              }}
              onMouseEnter={() => setHoveredCard(section.title)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div
                style={{
                  background: section.bgSubtle,
                  color: section.color,
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  width: 'fit-content',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={24} />
              </div>
              <h3
                style={{
                  fontWeight: 600,
                  fontFamily: 'var(--font-ui)',
                  color: 'var(--text-1)',
                  marginBottom: '8px',
                  fontSize: '16px',
                }}
              >
                {section.title}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-3)', lineHeight: '1.5' }}>
                {section.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Features Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(2, 1fr)',
          gap: '24px',
        }}
      >
        {/* Team Management */}
        <div
          style={{
            background: 'var(--ground)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Users size={20} style={{ color: 'var(--accent)' }} />
            <h3
              style={{
                fontWeight: 600,
                fontFamily: 'var(--font-ui)',
                color: 'var(--text-1)',
                fontSize: '16px',
              }}
            >
              Team Management Features
            </h3>
          </div>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              'Invite unlimited team members via email',
              'Assign roles: Admin, Manager, Assessor, Viewer, Auditor',
              'Create custom departments and teams',
              'Track user activity and assessment contributions',
              'Single Sign-On (SSO) with SAML 2.0 and OAuth',
              'Multi-factor authentication (MFA) enforcement',
            ].map((item, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span style={{ color: 'var(--accent)', marginTop: '2px', flexShrink: 0 }}>•</span>
                <span style={{ fontSize: '14px', color: 'var(--text-3)', lineHeight: '1.5' }}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Permissions & Access Control */}
        <div
          style={{
            background: 'var(--ground)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Shield size={20} style={{ color: 'var(--accent)' }} />
            <h3
              style={{
                fontWeight: 600,
                fontFamily: 'var(--font-ui)',
                color: 'var(--text-1)',
                fontSize: '16px',
              }}
            >
              Granular Permissions
            </h3>
          </div>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              'Control access to assessments, vendors, and analytics',
              'Set view, edit, delete, and export permissions per role',
              'Restrict sensitive data access (evidence, scores)',
              'Approval workflows for assessment completion',
              'Audit logs for all permission changes',
              'IP whitelisting and geographic restrictions',
            ].map((item, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span style={{ color: 'var(--accent)', marginTop: '2px', flexShrink: 0 }}>•</span>
                <span style={{ fontSize: '14px', color: 'var(--text-3)', lineHeight: '1.5' }}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Integrations */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '24px',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Puzzle size={24} style={{ color: 'var(--accent)' }} />
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 600,
              fontFamily: 'var(--font-ui)',
              color: 'var(--text-1)',
            }}
          >
            Planned Integrations
          </h3>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              window.innerWidth < 768
                ? 'repeat(2, 1fr)'
                : 'repeat(4, 1fr)',
            gap: '16px',
          }}
        >
          {integrationExamples.map((integration) => {
            const isHovered = hoveredIntegration === integration.name;
            return (
              <div
                key={integration.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: 'var(--ground)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                  boxShadow: isHovered ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 200ms ease',
                  cursor: 'default',
                }}
                onMouseEnter={() => setHoveredIntegration(integration.name)}
                onMouseLeave={() => setHoveredIntegration(null)}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    background: 'var(--accent-subtle)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Globe size={20} style={{ color: 'var(--accent)' }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      fontWeight: 500,
                      color: 'var(--text-1)',
                      fontSize: '14px',
                      fontFamily: 'var(--font-ui)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {integration.name}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-3)' }}>{integration.category}</p>
                </div>
              </div>
            );
          })}
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-3)', marginTop: '16px', lineHeight: '1.5' }}>
          Connect CSF Compass with your existing tools for automated data sync, notifications, and workflow automation.
        </p>
      </div>

      {/* Enterprise Features */}
      <div
        style={{
          background: 'var(--accent-subtle)',
          border: '1px solid var(--border)',
          borderLeft: '4px solid var(--accent)',
          borderRadius: 'var(--radius-md)',
          padding: '24px',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <h3
          style={{
            fontWeight: 600,
            color: 'var(--accent)',
            marginBottom: '12px',
            fontSize: '16px',
            fontFamily: 'var(--font-ui)',
          }}
        >
          Enterprise Features
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(2, 1fr)',
            gap: '16px',
          }}
        >
          {[
            { label: 'White-label branding:', desc: 'Custom domain, logo, and color scheme' },
            { label: 'API access:', desc: 'RESTful API for custom integrations' },
            { label: 'Dedicated support:', desc: 'Priority support with SLA guarantees' },
            { label: 'Custom frameworks:', desc: 'Add custom compliance frameworks beyond NIST CSF' },
          ].map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ color: 'var(--accent)', marginTop: '2px', flexShrink: 0 }}>•</span>
              <span style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: '1.5' }}>
                <strong>{item.label}</strong> {item.desc}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

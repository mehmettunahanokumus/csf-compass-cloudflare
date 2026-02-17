import { Settings, Building2, Users, Shield, Puzzle, Bell, CreditCard, Globe } from 'lucide-react';
import { T, card, sectionLabel } from '../tokens';

const settingsSections = [
  {
    icon: Building2,
    title: 'Organization Profile',
    description: 'Configure organization name, logo, industry, size, and company description for branding and context',
    color: '#6366F1',
    bg: 'rgba(99,102,241,0.07)',
    bdr: 'rgba(99,102,241,0.18)',
  },
  {
    icon: Users,
    title: 'Team Members',
    description: 'Invite team members, manage user accounts, view activity logs, and track assessment contributions',
    color: '#0EA5E9',
    bg: 'rgba(14,165,233,0.07)',
    bdr: 'rgba(14,165,233,0.18)',
  },
  {
    icon: Shield,
    title: 'Roles & Permissions',
    description: 'Define custom roles (Admin, Assessor, Viewer, Auditor) with granular permissions for assessment access',
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.07)',
    bdr: 'rgba(139,92,246,0.18)',
  },
  {
    icon: Puzzle,
    title: 'Integrations',
    description: 'Connect to GRC platforms, SIEM tools, ticketing systems (Jira, ServiceNow), and cloud providers',
    color: '#16A34A',
    bg: 'rgba(22,163,74,0.07)',
    bdr: 'rgba(22,163,74,0.18)',
  },
  {
    icon: Bell,
    title: 'Notifications & Alerts',
    description: 'Configure email, Slack, and in-app notifications for assessment updates, deadlines, and risk changes',
    color: '#D97706',
    bg: 'rgba(217,119,6,0.07)',
    bdr: 'rgba(217,119,6,0.18)',
  },
  {
    icon: CreditCard,
    title: 'Billing & Subscription',
    description: 'Manage subscription plan, payment methods, usage limits, and view invoices and billing history',
    color: '#EC4899',
    bg: 'rgba(236,72,153,0.07)',
    bdr: 'rgba(236,72,153,0.18)',
  },
];

const integrationList = [
  { name: 'Slack', category: 'Communication' },
  { name: 'Microsoft Teams', category: 'Communication' },
  { name: 'Jira', category: 'Ticketing' },
  { name: 'ServiceNow', category: 'Ticketing' },
  { name: 'Splunk', category: 'SIEM' },
  { name: 'AWS', category: 'Cloud' },
  { name: 'Azure', category: 'Cloud' },
  { name: 'Google Workspace', category: 'Productivity' },
];

export default function Organization() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: T.fontSans, fontSize: 24, fontWeight: 800, color: T.textPrimary, margin: 0 }}>
          Organization Settings
        </h1>
        <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary, margin: '4px 0 0' }}>
          Manage organization profile, team members, and integrations
        </p>
      </div>

      {/* Coming Soon Banner */}
      <div style={{
        ...card,
        padding: '16px 20px',
        borderLeft: `4px solid ${T.warning}`,
        borderRadius: '0 12px 12px 0',
        background: T.warningLight,
        border: `1px solid ${T.warningBorder}`,
        borderLeftWidth: 4,
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: T.warningLight, border: `1px solid ${T.warningBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Settings size={18} style={{ color: T.warning }} />
        </div>
        <div>
          <p style={{ fontFamily: T.fontSans, fontSize: 14, fontWeight: 700, color: T.textPrimary, margin: 0 }}>
            Organization Settings Coming Soon
          </p>
          <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary, margin: '4px 0 0', lineHeight: 1.6 }}>
            Centralized organization management for team collaboration, role-based access control, and enterprise integrations.
          </p>
        </div>
      </div>

      {/* Settings Modules Grid */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 3, height: 14, background: T.accent, borderRadius: 2, flexShrink: 0 }} />
          <span style={sectionLabel}>Settings Modules</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {settingsSections.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.title}
                style={{
                  ...card,
                  padding: 20,
                  transition: 'box-shadow 0.14s, border-color 0.14s',
                  cursor: 'default',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
                  (e.currentTarget as HTMLElement).style.borderColor = section.bdr;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
                  (e.currentTarget as HTMLElement).style.borderColor = T.border;
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: section.bg, border: `1px solid ${section.bdr}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
                }}>
                  <Icon size={20} style={{ color: section.color }} />
                </div>
                <h3 style={{ fontFamily: T.fontSans, fontSize: 14, fontWeight: 700, color: T.textPrimary, margin: '0 0 6px' }}>
                  {section.title}
                </h3>
                <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary, margin: 0, lineHeight: 1.6 }}>
                  {section.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Lists */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[
          {
            title: 'Team Management',
            items: [
              'Invite unlimited team members via email',
              'Assign roles: Admin, Manager, Assessor, Viewer, Auditor',
              'Create custom departments and teams',
              'Track user activity and assessment contributions',
              'Single Sign-On (SSO) with SAML 2.0 and OAuth',
              'Multi-factor authentication (MFA) enforcement',
            ],
          },
          {
            title: 'Granular Permissions',
            items: [
              'Control access to assessments, vendors, and analytics',
              'Set view, edit, delete, and export permissions per role',
              'Restrict sensitive data access (evidence, scores)',
              'Approval workflows for assessment completion',
              'Audit logs for all permission changes',
              'IP whitelisting and geographic restrictions',
            ],
          },
        ].map((section) => (
          <div key={section.title} style={{ ...card, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 3, height: 14, background: T.accent, borderRadius: 2, flexShrink: 0 }} />
              <span style={sectionLabel}>{section.title}</span>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {section.items.map((item, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%', background: T.accent,
                    flexShrink: 0, marginTop: 6,
                  }} />
                  <span style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary, lineHeight: 1.5 }}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Integrations */}
      <div style={{ ...card, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 3, height: 14, background: T.accent, borderRadius: 2, flexShrink: 0 }} />
          <span style={sectionLabel}>Planned Integrations</span>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 12,
          marginBottom: 20,
        }}>
          {integrationList.map((integration) => (
            <div
              key={integration.name}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px',
                background: '#F8FAFC', border: `1px solid ${T.border}`,
                borderRadius: 10, transition: 'border-color 0.14s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = T.accentBorder}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = T.border}
            >
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: T.accentLight, border: `1px solid ${T.accentBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Globe size={13} style={{ color: T.accent }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, color: T.textPrimary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {integration.name}
                </p>
                <p style={{ fontFamily: T.fontMono, fontSize: 10, color: T.textMuted, margin: 0 }}>
                  {integration.category}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary, margin: 0 }}>
          Connect CSF Compass with your existing tools for automated data sync, notifications, and workflow automation.
        </p>
      </div>

      {/* Enterprise Features */}
      <div style={{
        ...card,
        padding: 20,
        background: 'rgba(99,102,241,0.03)',
        borderColor: T.accentBorder,
      }}>
        <p style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 700, color: T.accent, margin: '0 0 14px' }}>
          Enterprise Features
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'White-label branding:', desc: 'Custom domain, logo, and color scheme' },
            { label: 'API access:', desc: 'RESTful API for custom integrations' },
            { label: 'Dedicated support:', desc: 'Priority support with SLA guarantees' },
            { label: 'Custom frameworks:', desc: 'Add custom compliance frameworks beyond NIST CSF' },
          ].map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: T.accent, flexShrink: 0, marginTop: 5,
              }} />
              <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary, margin: 0 }}>
                <span style={{ color: T.textPrimary, fontWeight: 600 }}>{item.label}</span> {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

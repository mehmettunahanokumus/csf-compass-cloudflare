/**
 * Organization Settings Page (Placeholder)
 * Future: Organization profile, team management, roles, and integrations
 */

import { Settings, Building2, Users, Shield, Puzzle, Bell, CreditCard, Globe } from 'lucide-react';

export default function Organization() {
  const settingsSections = [
    {
      icon: Building2,
      title: 'Organization Profile',
      description: 'Configure organization name, logo, industry, size, and company description for branding and context',
      color: 'bg-primary/10 text-primary',
    },
    {
      icon: Users,
      title: 'Team Members',
      description: 'Invite team members, manage user accounts, view activity logs, and track assessment contributions',
      color: 'bg-blue-100 text-blue-700',
    },
    {
      icon: Shield,
      title: 'Roles & Permissions',
      description: 'Define custom roles (Admin, Assessor, Viewer, Auditor) with granular permissions for assessment access',
      color: 'bg-purple-100 text-purple-700',
    },
    {
      icon: Puzzle,
      title: 'Integrations',
      description: 'Connect to GRC platforms, SIEM tools, ticketing systems (Jira, ServiceNow), and cloud providers',
      color: 'bg-green-100 text-green-700',
    },
    {
      icon: Bell,
      title: 'Notifications & Alerts',
      description: 'Configure email, Slack, and in-app notifications for assessment updates, deadlines, and risk changes',
      color: 'bg-amber-100 text-amber-700',
    },
    {
      icon: CreditCard,
      title: 'Billing & Subscription',
      description: 'Manage subscription plan, payment methods, usage limits, and view invoices and billing history',
      color: 'bg-indigo-100 text-indigo-700',
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Organization Settings</h1>
        <p className="text-text-secondary mt-1">
          Manage organization profile, team members, and integrations
        </p>
      </div>

      {/* Coming Soon Banner */}
      <div className="card border-l-4 border-primary">
        <div className="card-body">
          <div className="flex items-start space-x-4">
            <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Organization Settings Coming Soon
              </h3>
              <p className="text-sm text-text-secondary">
                Centralized organization management for team collaboration, role-based access control, and enterprise integrations.
                Configure your workspace to align with your security governance structure.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.title} className="card hover:shadow-md transition-shadow">
              <div className="card-body">
                <div className={`${section.color} p-3 rounded-lg w-fit mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-text-primary mb-2">{section.title}</h3>
                <p className="text-sm text-text-secondary">{section.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team Management */}
        <div className="card bg-surface">
          <div className="card-body">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-text-primary">Team Management Features</h3>
            </div>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-start space-x-2">
                <span className="text-primary mt-1">•</span>
                <span>Invite unlimited team members via email</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary mt-1">•</span>
                <span>Assign roles: Admin, Manager, Assessor, Viewer, Auditor</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary mt-1">•</span>
                <span>Create custom departments and teams</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary mt-1">•</span>
                <span>Track user activity and assessment contributions</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary mt-1">•</span>
                <span>Single Sign-On (SSO) with SAML 2.0 and OAuth</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary mt-1">•</span>
                <span>Multi-factor authentication (MFA) enforcement</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Permissions & Access Control */}
        <div className="card bg-surface">
          <div className="card-body">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-text-primary">Granular Permissions</h3>
            </div>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-start space-x-2">
                <span className="text-primary mt-1">•</span>
                <span>Control access to assessments, vendors, and analytics</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary mt-1">•</span>
                <span>Set view, edit, delete, and export permissions per role</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary mt-1">•</span>
                <span>Restrict sensitive data access (evidence, scores)</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary mt-1">•</span>
                <span>Approval workflows for assessment completion</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary mt-1">•</span>
                <span>Audit logs for all permission changes</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-primary mt-1">•</span>
                <span>IP whitelisting and geographic restrictions</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Integrations */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center space-x-3 mb-6">
            <Puzzle className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-semibold text-text-primary">Planned Integrations</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {integrationExamples.map((integration) => (
              <div
                key={integration.name}
                className="flex items-center space-x-3 p-3 bg-surface rounded-lg border border-border"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-text-primary text-sm truncate">{integration.name}</p>
                  <p className="text-xs text-text-secondary">{integration.category}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-text-secondary mt-4">
            Connect CSF Compass with your existing tools for automated data sync, notifications, and workflow automation.
          </p>
        </div>
      </div>

      {/* Enterprise Features */}
      <div className="card border-l-4 border-secondary bg-secondary/5">
        <div className="card-body">
          <h3 className="font-semibold text-secondary mb-3">Enterprise Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-text-secondary">
            <div className="flex items-start space-x-2">
              <span className="text-secondary mt-1">•</span>
              <span><strong>White-label branding:</strong> Custom domain, logo, and color scheme</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-secondary mt-1">•</span>
              <span><strong>API access:</strong> RESTful API for custom integrations</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-secondary mt-1">•</span>
              <span><strong>Dedicated support:</strong> Priority support with SLA guarantees</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-secondary mt-1">•</span>
              <span><strong>Custom frameworks:</strong> Add custom compliance frameworks beyond NIST CSF</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

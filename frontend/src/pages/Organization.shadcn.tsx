import { Settings, Building2, Users, Shield, Puzzle, Bell, CreditCard, Globe } from 'lucide-react';

const settingsSections = [
  {
    icon: Building2,
    title: 'Organization Profile',
    description: 'Configure organization name, logo, industry, size, and company description for branding and context',
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10 border-blue-500/15',
  },
  {
    icon: Users,
    title: 'Team Members',
    description: 'Invite team members, manage user accounts, view activity logs, and track assessment contributions',
    iconColor: 'text-sky-400',
    iconBg: 'bg-sky-500/10 border-sky-500/15',
  },
  {
    icon: Shield,
    title: 'Roles & Permissions',
    description: 'Define custom roles (Admin, Assessor, Viewer, Auditor) with granular permissions for assessment access',
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/10 border-purple-500/15',
  },
  {
    icon: Puzzle,
    title: 'Integrations',
    description: 'Connect to GRC platforms, SIEM tools, ticketing systems (Jira, ServiceNow), and cloud providers',
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10 border-emerald-500/15',
  },
  {
    icon: Bell,
    title: 'Notifications & Alerts',
    description: 'Configure email, Slack, and in-app notifications for assessment updates, deadlines, and risk changes',
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10 border-amber-500/15',
  },
  {
    icon: CreditCard,
    title: 'Billing & Subscription',
    description: 'Manage subscription plan, payment methods, usage limits, and view invoices and billing history',
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/10 border-purple-500/15',
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

export default function Organization() {
  return (
    <div className="animate-fade-in-up space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-[#F0F0F5]">Organization Settings</h1>
        <p className="font-sans text-sm text-[#8E8FA8] mt-1">
          Manage organization profile, team members, and integrations
        </p>
      </div>

      {/* Coming Soon Banner */}
      <div className="relative bg-[#0E1018] border border-white/[0.07] rounded-xl p-5 overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-amber-500 rounded-l-xl" />
        <div className="flex items-start gap-4 pl-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Settings className="w-[18px] h-[18px] text-amber-500/70" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-[#F0F0F5]">Organization Settings Coming Soon</p>
            <p className="font-sans text-sm text-[#8E8FA8] mt-1 leading-relaxed">
              Centralized organization management for team collaboration, role-based access control, and enterprise integrations.
            </p>
          </div>
        </div>
      </div>

      {/* Settings Sections Grid */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-[3px] h-4 bg-amber-500 rounded-full flex-shrink-0" />
          <h2 className="font-display text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8E8FA8]">
            Settings Modules
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.title}
                className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-5 hover:border-amber-500/20 transition-all group"
              >
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg border ${section.iconBg} mb-4`}>
                  <Icon className={`w-5 h-5 ${section.iconColor}`} />
                </div>
                <h3 className="font-display text-sm font-semibold text-[#F0F0F5] mb-2">{section.title}</h3>
                <p className="font-sans text-xs text-[#8E8FA8] leading-relaxed">{section.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Features Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Team Management */}
        <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-[3px] h-4 bg-amber-500 rounded-full flex-shrink-0" />
            <h2 className="font-display text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8E8FA8]">
              Team Management
            </h2>
          </div>
          <ul className="space-y-3">
            {[
              'Invite unlimited team members via email',
              'Assign roles: Admin, Manager, Assessor, Viewer, Auditor',
              'Create custom departments and teams',
              'Track user activity and assessment contributions',
              'Single Sign-On (SSO) with SAML 2.0 and OAuth',
              'Multi-factor authentication (MFA) enforcement',
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 font-sans text-sm text-[#8E8FA8]">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500/60 mt-1.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Granular Permissions */}
        <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-[3px] h-4 bg-amber-500 rounded-full flex-shrink-0" />
            <h2 className="font-display text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8E8FA8]">
              Granular Permissions
            </h2>
          </div>
          <ul className="space-y-3">
            {[
              'Control access to assessments, vendors, and analytics',
              'Set view, edit, delete, and export permissions per role',
              'Restrict sensitive data access (evidence, scores)',
              'Approval workflows for assessment completion',
              'Audit logs for all permission changes',
              'IP whitelisting and geographic restrictions',
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 font-sans text-sm text-[#8E8FA8]">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500/60 mt-1.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Integrations */}
      <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-[3px] h-4 bg-amber-500 rounded-full flex-shrink-0" />
          <h2 className="font-display text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8E8FA8]">
            Planned Integrations
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {integrationExamples.map((integration) => (
            <div
              key={integration.name}
              className="flex items-center gap-3 p-3 bg-[#13151F] border border-white/[0.05] rounded-lg hover:border-amber-500/15 transition-colors"
            >
              <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
                <Globe className="w-3.5 h-3.5 text-amber-500/70" />
              </div>
              <div className="min-w-0">
                <p className="font-sans text-sm text-[#F0F0F5] font-medium truncate">{integration.name}</p>
                <p className="font-mono text-[10px] text-[#55576A]">{integration.category}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="font-sans text-sm text-[#8E8FA8]">
          Connect CSF Compass with your existing tools for automated data sync, notifications, and workflow automation.
        </p>
      </div>

      {/* Enterprise Features */}
      <div className="relative bg-[#0E1018] border border-white/[0.07] rounded-xl p-5 overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-amber-500 rounded-l-xl" />
        <div className="pl-3">
          <p className="font-display text-sm font-semibold text-amber-400 mb-3">Enterprise Features</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: 'White-label branding:', desc: 'Custom domain, logo, and color scheme' },
              { label: 'API access:', desc: 'RESTful API for custom integrations' },
              { label: 'Dedicated support:', desc: 'Priority support with SLA guarantees' },
              { label: 'Custom frameworks:', desc: 'Add custom compliance frameworks beyond NIST CSF' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 font-sans text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500/60 mt-1.5 flex-shrink-0" />
                <span className="text-[#8E8FA8]">
                  <span className="text-[#F0F0F5] font-medium">{item.label}</span> {item.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

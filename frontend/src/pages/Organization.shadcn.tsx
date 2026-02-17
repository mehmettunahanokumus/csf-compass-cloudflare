import { Settings, Building2, Users, Shield, Puzzle, Bell, CreditCard, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';

const settingsSections = [
  {
    icon: Building2,
    title: 'Organization Profile',
    description: 'Configure organization name, logo, industry, size, and company description for branding and context',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    icon: Users,
    title: 'Team Members',
    description: 'Invite team members, manage user accounts, view activity logs, and track assessment contributions',
    iconBg: 'bg-sky-100 dark:bg-sky-900/30',
    iconColor: 'text-sky-600 dark:text-sky-400',
  },
  {
    icon: Shield,
    title: 'Roles & Permissions',
    description: 'Define custom roles (Admin, Assessor, Viewer, Auditor) with granular permissions for assessment access',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    icon: Puzzle,
    title: 'Integrations',
    description: 'Connect to GRC platforms, SIEM tools, ticketing systems (Jira, ServiceNow), and cloud providers',
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  {
    icon: Bell,
    title: 'Notifications & Alerts',
    description: 'Configure email, Slack, and in-app notifications for assessment updates, deadlines, and risk changes',
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  {
    icon: CreditCard,
    title: 'Billing & Subscription',
    description: 'Manage subscription plan, payment methods, usage limits, and view invoices and billing history',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
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
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Organization Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage organization profile, team members, and integrations
        </p>
      </div>

      {/* Coming Soon Banner */}
      <Alert className="border-l-4 border-l-primary">
        <Settings className="h-4 w-4" />
        <AlertDescription>
          <span className="font-semibold">Organization Settings Coming Soon</span>
          <p className="mt-1 text-sm text-muted-foreground">
            Centralized organization management for team collaboration, role-based access control, and enterprise integrations.
          </p>
        </AlertDescription>
      </Alert>

      {/* Settings Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className={`inline-flex items-center justify-center p-3 rounded-lg ${section.iconBg} mb-4`}>
                  <Icon className={`h-6 w-6 ${section.iconColor}`} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{section.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{section.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Team Management Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {[
                'Invite unlimited team members via email',
                'Assign roles: Admin, Manager, Assessor, Viewer, Auditor',
                'Create custom departments and teams',
                'Track user activity and assessment contributions',
                'Single Sign-On (SSO) with SAML 2.0 and OAuth',
                'Multi-factor authentication (MFA) enforcement',
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Granular Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {[
                'Control access to assessments, vendors, and analytics',
                'Set view, edit, delete, and export permissions per role',
                'Restrict sensitive data access (evidence, scores)',
                'Approval workflows for assessment completion',
                'Audit logs for all permission changes',
                'IP whitelisting and geographic restrictions',
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Puzzle className="h-5 w-5 text-primary" />
            Planned Integrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {integrationExamples.map((integration) => (
              <div
                key={integration.name}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border hover:shadow-sm transition-shadow"
              >
                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Globe className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{integration.name}</p>
                  <p className="text-xs text-muted-foreground">{integration.category}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Connect CSF Compass with your existing tools for automated data sync, notifications, and workflow automation.
          </p>
        </CardContent>
      </Card>

      {/* Enterprise Features */}
      <Alert className="border-l-4 border-l-primary bg-primary/5">
        <AlertDescription>
          <span className="font-semibold text-primary">Enterprise Features</span>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: 'White-label branding:', desc: 'Custom domain, logo, and color scheme' },
              { label: 'API access:', desc: 'RESTful API for custom integrations' },
              { label: 'Dedicated support:', desc: 'Priority support with SLA guarantees' },
              { label: 'Custom frameworks:', desc: 'Add custom compliance frameworks beyond NIST CSF' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                <span className="text-foreground">
                  <strong>{item.label}</strong> {item.desc}
                </span>
              </div>
            ))}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}

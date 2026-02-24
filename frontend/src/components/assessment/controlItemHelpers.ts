/**
 * Shared helpers for ControlItem component and assessment pages.
 * Extracted from AssessmentChecklist + VendorPortal to avoid duplication.
 */
import type React from 'react';
import { T } from '../../tokens';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface ComplianceCriteria {
  compliant: string;
  partial: string;
  non_compliant: string;
}

export interface PlatformEntry {
  category: string;
  tools: string;
}

export interface GuidanceData {
  capability: string;
  steps: string[];
  platforms: PlatformEntry[];
}

export interface StatusOption {
  value: string;
  label: string;
  bg: string;
  color: string;
  border: string;
}

// ─── Status helpers ─────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  compliant: 'Compliant',
  partial: 'Partial',
  non_compliant: 'Non-Compliant',
  not_assessed: 'Not Assessed',
  not_applicable: 'N/A',
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] || status.replace('_', ' ');
}

export function statusBadgeStyle(status: string): React.CSSProperties {
  const base: React.CSSProperties = {
    fontFamily: T.fontSans,
    fontSize: 11,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 20,
    display: 'inline-block',
  };
  const map: Record<string, React.CSSProperties> = {
    compliant:      { ...base, background: T.successLight, color: T.success, border: `1px solid ${T.successBorder}` },
    partial:        { ...base, background: T.warningLight, color: T.warning, border: `1px solid ${T.warningBorder}` },
    non_compliant:  { ...base, background: T.dangerLight,  color: T.danger,  border: `1px solid ${T.dangerBorder}` },
    not_assessed:   { ...base, background: T.bg, color: T.textMuted, border: `1px solid ${T.border}` },
    not_applicable: { ...base, background: T.bg, color: T.textMuted, border: `1px solid ${T.border}` },
  };
  return map[status] || { ...base, background: T.bg, color: T.textMuted, border: `1px solid ${T.border}` };
}

/** Status color set for button styling (bg, text color, border) */
export function statusColorSet(status: string): { bg: string; color: string; border: string } {
  switch (status) {
    case 'compliant':      return { bg: T.successLight, color: T.success, border: T.successBorder };
    case 'partial':        return { bg: T.warningLight, color: T.warning, border: T.warningBorder };
    case 'non_compliant':  return { bg: T.dangerLight,  color: T.danger,  border: T.dangerBorder };
    case 'not_applicable': return { bg: T.borderLight,  color: T.textMuted, border: T.border };
    default:               return { bg: T.borderLight,  color: T.textMuted, border: T.border };
  }
}

/** Full status options for org/internal assessments (includes not_assessed) */
export const FULL_STATUS_OPTIONS: StatusOption[] = [
  { value: 'compliant',      label: 'Compliant',      bg: T.successLight, color: T.success, border: T.successBorder },
  { value: 'partial',        label: 'Partial',         bg: T.warningLight, color: T.warning, border: T.warningBorder },
  { value: 'non_compliant',  label: 'Non-Compliant',  bg: T.dangerLight,  color: T.danger,  border: T.dangerBorder },
  { value: 'not_applicable', label: 'N/A',             bg: T.borderLight,  color: T.textMuted, border: T.border },
  { value: 'not_assessed',   label: 'Not Assessed',   bg: T.borderLight,  color: T.textMuted, border: T.border },
];

/** Vendor-facing status options (no not_assessed — vendor must choose) */
export const VENDOR_STATUS_OPTIONS: StatusOption[] = [
  { value: 'compliant',      label: 'Compliant',      bg: T.successLight, color: T.success, border: T.successBorder },
  { value: 'partial',        label: 'Partial',         bg: T.warningLight, color: T.warning, border: T.warningBorder },
  { value: 'non_compliant',  label: 'Non-Compliant',  bg: T.dangerLight,  color: T.danger,  border: T.dangerBorder },
  { value: 'not_applicable', label: 'N/A',             bg: T.borderLight,  color: T.textMuted, border: T.border },
];

// ─── Left-border accent color by status ─────────────────────────────────────────

export function statusAccentColor(status: string): string {
  switch (status) {
    case 'compliant':     return T.success;
    case 'partial':       return T.warning;
    case 'non_compliant': return T.danger;
    default:              return T.border;
  }
}

// ─── Evidence examples (simpler, vendor-facing) ─────────────────────────────────

export function getEvidenceExamples(subcategoryId: string): string[] {
  const prefix = subcategoryId?.split('.')[0] || '';
  switch (prefix) {
    case 'GV': return [
      'Cybersecurity policy documents and approval records',
      'Risk management framework documentation',
      'Board/leadership meeting minutes discussing cyber risk',
      'Roles and responsibilities matrix (RACI)',
    ];
    case 'ID': return [
      'Asset inventory or CMDB export',
      'Network architecture diagrams',
      'Data classification and flow documentation',
      'Business impact analysis (BIA) reports',
    ];
    case 'PR': return [
      'Access control policy and user provisioning records',
      'Security awareness training completion reports',
      'Encryption standards and implementation evidence',
      'Change management and patch records',
    ];
    case 'DE': return [
      'SIEM/monitoring tool configuration and alert rules',
      'Log retention policy and sample logs',
      'Intrusion detection/prevention system reports',
      'Vulnerability scan results from last 90 days',
    ];
    case 'RS': return [
      'Incident response plan and playbooks',
      'Incident response drill/tabletop exercise results',
      'Communication plan for security incidents',
      'Post-incident review reports',
    ];
    case 'RC': return [
      'Business continuity and disaster recovery plans',
      'Backup verification and restoration test results',
      'Recovery time objective (RTO/RPO) documentation',
      'Lessons learned from past recovery exercises',
    ];
    default: return [
      'Relevant policy or procedure documentation',
      'Implementation evidence (screenshots, configs)',
      'Audit or review records from last 12 months',
      'Third-party assessment or certification reports',
    ];
  }
}

// ─── Compliance criteria (per CSF function) ─────────────────────────────────────

export function getComplianceCriteria(subcategoryId: string | undefined): ComplianceCriteria {
  const prefix = subcategoryId?.split('.')[0] || '';
  const map: Record<string, ComplianceCriteria> = {
    GV: {
      compliant:     'Policy is documented, formally approved by leadership, reviewed within the last 12 months, and actively communicated to all relevant stakeholders.',
      partial:       'Policy exists but may be outdated (>12 months since review), lacks formal approval, or has not been communicated to all affected parties.',
      non_compliant: 'No policy, procedure, or formal governance mechanism exists for this control area.',
    },
    ID: {
      compliant:     'Inventory or mapping is complete, current, includes all required attributes, and has a documented review/update cycle.',
      partial:       'Inventory exists but is incomplete, outdated, or lacks a formal maintenance process.',
      non_compliant: 'No inventory, asset register, or formal identification process exists.',
    },
    PR: {
      compliant:     'Control is fully implemented, configured per hardening standards, and its effectiveness has been verified through testing or audit.',
      partial:       'Control is partially implemented, deviates from hardening standards, or effectiveness has not been validated.',
      non_compliant: 'Control is not implemented or has been identified as ineffective.',
    },
    DE: {
      compliant:     'Monitoring is active with defined alert thresholds, logs are retained per policy, and alerts are triaged within defined SLAs.',
      partial:       'Monitoring exists but has incomplete coverage, alerts are not consistently reviewed, or log retention is insufficient.',
      non_compliant: 'No monitoring, alerting, or detection capability exists for this area.',
    },
    RS: {
      compliant:     'Incident response procedures are documented, tested (tabletop or live drill) within the last 12 months, and the response team is trained.',
      partial:       'Procedures exist but have not been tested recently, or training is incomplete for key personnel.',
      non_compliant: 'No documented incident response procedure or escalation path exists.',
    },
    RC: {
      compliant:     'Recovery plan is documented, RTO/RPO are defined and achievable, and the plan has been tested within the last 12 months.',
      partial:       'Recovery plan exists but has not been tested, RTO/RPO are undefined, or recovery capabilities are unverified.',
      non_compliant: 'No recovery plan or documented recovery capability exists.',
    },
  };
  return map[prefix] || {
    compliant:     'The control is fully implemented and its effectiveness has been verified.',
    partial:       'The control is partially implemented or has not been validated.',
    non_compliant: 'The control has not been implemented.',
  };
}

// ─── Evidence requirements (detailed, assessor-facing) ──────────────────────────

export function getEvidenceRequirements(subcategoryId: string | undefined): string[] {
  const prefix = subcategoryId?.split('.')[0] || '';
  const map: Record<string, string[]> = {
    GV: [
      'Written policy or procedure document (dated, versioned)',
      'Formal approval signature, board resolution, or management sign-off',
      'Distribution record or intranet/portal publication screenshot',
      'Annual review log or policy management system export',
    ],
    ID: [
      'Asset inventory export (spreadsheet, CMDB, or discovery tool report)',
      'Data flow or network topology diagram',
      'Asset ownership and classification records',
      'Last-updated timestamp and evidence of periodic review',
    ],
    PR: [
      'Configuration export or hardening baseline screenshot',
      'Access control report (user list, role assignments, MFA status)',
      'Training completion report or attendance records',
      'Patch status report or vulnerability scan export',
    ],
    DE: [
      'SIEM or monitoring platform alert rule configuration screenshot',
      'Log retention policy documentation',
      'Sample alert or detection event log',
      'Monitoring coverage report or dashboard screenshot',
    ],
    RS: [
      'Incident response plan or playbook document',
      'Incident ticket records or post-mortem/lessons-learned report',
      'Tabletop exercise agenda and results',
      'On-call rotation or escalation contact list',
    ],
    RC: [
      'Business continuity or disaster recovery plan document',
      'Automated backup job completion report',
      'Recovery test results with RTO/RPO metrics',
      'Defined RTO/RPO targets per system (SLA document)',
    ],
  };
  return map[prefix] || [
    'Policy or procedure documentation',
    'Configuration or system screenshots',
    'Audit log exports',
    'Third-party certification (SOC 2, ISO 27001)',
  ];
}

// ─── Implementation guidance (detailed, with platform examples) ─────────────────

export function getImplementationGuidance(subcategoryId: string | undefined): GuidanceData {
  const prefix = subcategoryId?.split('.')[0] || '';
  const map: Record<string, GuidanceData> = {
    GV: {
      capability: 'Establish a formal governance structure with documented policies, clear ownership, and regular review cycles aligned to your risk appetite.',
      steps: [
        'Identify the policy owner (typically CISO, CRO, or senior leadership)',
        'Draft the policy using an established template (NIST, SANS, or ISO 27001 Annex A)',
        'Review with legal, HR, and IT stakeholders for completeness',
        'Obtain formal written approval and publish to all relevant staff',
        'Schedule annual reviews and track changes with version control',
      ],
      platforms: [
        { category: 'GRC Platforms', tools: 'ServiceNow GRC, OneTrust, Archer, LogicGate, Vanta' },
        { category: 'Document Management', tools: 'SharePoint, Confluence, Google Workspace, Notion' },
        { category: 'Policy Management', tools: 'PolicyTech, PowerDMS, Drata, Secureframe' },
      ],
    },
    ID: {
      capability: 'Build and maintain a comprehensive, up-to-date inventory of all assets, data stores, and third-party dependencies with clear ownership and classification.',
      steps: [
        'Run automated discovery to enumerate hardware, software, cloud resources, and data stores',
        'Classify each asset by criticality, data type, and business function',
        'Assign a named owner for each asset or asset class',
        'Document data flows between internal systems and third parties',
        'Schedule quarterly reviews to capture new assets and retire decommissioned ones',
      ],
      platforms: [
        { category: 'Asset Management', tools: 'ServiceNow ITAM, Lansweeper, Axonius, JupiterOne' },
        { category: 'Cloud Discovery', tools: 'AWS Config, Azure Resource Graph, GCP Asset Inventory' },
        { category: 'Network Discovery', tools: 'Nmap, Qualys VMDR, Tenable.io, Rapid7 InsightVM' },
      ],
    },
    PR: {
      capability: 'Implement layered technical controls to restrict access, protect sensitive data, and harden systems against unauthorized use and exploitation.',
      steps: [
        'Apply principle of least privilege — audit and remove excessive permissions',
        'Enforce MFA for all privileged accounts and remote access sessions',
        'Harden system configurations against CIS Benchmarks or vendor security baselines',
        'Encrypt sensitive data at rest (AES-256) and in transit (TLS 1.2+)',
        'Automate patch deployment and track remediation against defined SLAs',
      ],
      platforms: [
        { category: 'Identity & Access', tools: 'Microsoft Entra ID, Okta, Google Workspace, CyberArk' },
        { category: 'Endpoint Protection', tools: 'Microsoft Defender, CrowdStrike Falcon, SentinelOne' },
        { category: 'Patch Management', tools: 'Microsoft Intune, SCCM, Qualys VMDR, Ivanti' },
      ],
    },
    DE: {
      capability: 'Deploy continuous monitoring with real-time alerting to detect anomalous activity, unauthorized access, and potential threats before they escalate.',
      steps: [
        'Identify critical log sources (authentication, network, endpoint, cloud) and centralize them in a SIEM',
        'Create alert rules for high-priority events: brute force, privilege escalation, lateral movement, data exfiltration',
        'Define log retention aligned to regulatory requirements (90 days active, 1+ year archive)',
        'Assign alert triage ownership and define SLAs for acknowledgment and response',
        'Review and tune detection rules quarterly to reduce false positives and cover emerging threats',
      ],
      platforms: [
        { category: 'SIEM', tools: 'Microsoft Sentinel, Splunk, IBM QRadar, Elastic SIEM' },
        { category: 'EDR / XDR', tools: 'CrowdStrike Falcon, Microsoft Defender XDR, Palo Alto Cortex XDR' },
        { category: 'Cloud Threat Detection', tools: 'AWS GuardDuty, Microsoft Defender for Cloud, Google SCC' },
      ],
    },
    RS: {
      capability: 'Establish and regularly exercise incident response capabilities to contain, eradicate, and communicate about security incidents quickly and consistently.',
      steps: [
        'Define incident severity levels (P1–P4) and classification criteria for each',
        'Document response playbooks for each incident type (ransomware, phishing, data breach, DDoS)',
        'Assign roles: Incident Commander, Technical Lead, Legal/Communications Lead',
        'Conduct a tabletop exercise at least once per year; track and remediate gaps',
        'Prepare notification templates for internal stakeholders, regulators, and affected customers',
      ],
      platforms: [
        { category: 'SOAR & Ticketing', tools: 'ServiceNow, PagerDuty, Jira Service Management, Palo Alto XSOAR' },
        { category: 'Threat Intelligence', tools: 'Microsoft Sentinel, MISP, Recorded Future, ThreatConnect' },
        { category: 'Communications', tools: 'Slack/Teams dedicated incident channel, StatusPage, Everbridge' },
      ],
    },
    RC: {
      capability: 'Ensure business continuity by maintaining tested, up-to-date recovery plans and backup capabilities that reliably meet your RTO and RPO targets.',
      steps: [
        'Define RTO and RPO for each critical system; document these in a formal SLA/BIA',
        'Implement automated backups with off-site or cloud replication and immutability',
        'Test recovery procedures regularly — start with full restores in an isolated test environment',
        'Document a BCP and DRP; validate them against real outage scenarios at least annually',
        'Conduct annual DR drills; update plans and train new staff based on drill findings',
      ],
      platforms: [
        { category: 'Backup & Recovery', tools: 'Veeam, Azure Backup, AWS Backup, Commvault, Cohesity' },
        { category: 'BCM Platforms', tools: 'ServiceNow BCM, Fusion Risk Management, IBM OpenPages' },
        { category: 'Cloud DR', tools: 'Azure Site Recovery, AWS Elastic Disaster Recovery, Zerto' },
      ],
    },
  };
  return map[prefix] || {
    capability: 'Implement the required technical or procedural control to meet this NIST CSF subcategory.',
    steps: [
      'Review the subcategory description and identify current gaps against your environment',
      'Assign an owner accountable for implementing and maintaining the control',
      'Document the implementation approach, acceptance criteria, and timeline',
      'Implement the control and collect verifiable evidence of effectiveness',
      'Schedule periodic reviews to confirm the control remains effective and up to date',
    ],
    platforms: [
      { category: 'GRC / Compliance', tools: 'ServiceNow GRC, Vanta, Drata, Secureframe' },
      { category: 'Documentation', tools: 'Confluence, SharePoint, Notion' },
    ],
  };
}

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { assessmentsApi } from '../api/assessments';
import { csfApi } from '../api/csf';
import { getErrorMessage } from '../api/client';
import type { Assessment, AssessmentItem, CsfFunction } from '../types';
import { T, card } from '../tokens';
const cardStyle = card;

const FUNCTION_TABS = ['All', 'GV', 'ID', 'PR', 'DE', 'RS', 'RC'];

function statusBadgeStyle(status: string): React.CSSProperties {
  const base: React.CSSProperties = { fontFamily: T.fontSans, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20 };
  const map: Record<string, React.CSSProperties> = {
    compliant:     { ...base, background: T.successLight, color: T.success, border: `1px solid ${T.successBorder}` },
    partial:       { ...base, background: T.warningLight, color: T.warning, border: `1px solid ${T.warningBorder}` },
    non_compliant: { ...base, background: T.dangerLight, color: T.danger, border: `1px solid ${T.dangerBorder}` },
    not_assessed:  { ...base, background: '#F1F5F9', color: T.textMuted, border: `1px solid ${T.border}` },
    not_applicable:{ ...base, background: '#F1F5F9', color: T.textMuted, border: `1px solid ${T.border}` },
  };
  return map[status] || { ...base, background: '#F1F5F9', color: T.textMuted, border: `1px solid ${T.border}` };
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    compliant: 'Compliant', partial: 'Partial', non_compliant: 'Non-Compliant',
    not_assessed: 'Not Assessed', not_applicable: 'N/A',
  };
  return map[status] || status.replace('_', ' ');
}

// ─── Content helpers ──────────────────────────────────────────────────────────

interface ComplianceCriteria {
  compliant: string;
  partial: string;
  non_compliant: string;
}

function getComplianceCriteria(subcategoryId: string | undefined): ComplianceCriteria {
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

function getEvidenceRequirements(subcategoryId: string | undefined): string[] {
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

interface PlatformEntry { category: string; tools: string; }
interface GuidanceData { capability: string; steps: string[]; platforms: PlatformEntry[]; }

function getImplementationGuidance(subcategoryId: string | undefined): GuidanceData {
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function AssessmentChecklist() {
  const { id } = useParams<{ id: string }>();

  const [_assessment, setAssessment] = useState<Assessment | null>(null);
  const [functions, setFunctions] = useState<CsfFunction[]>([]);
  const [items, setItems] = useState<AssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Panel visibility state — two independent panels per item
  const [expandedRequired, setExpandedRequired] = useState<Set<string>>(new Set());
  const [expandedGuidance, setExpandedGuidance] = useState<Set<string>>(new Set());
  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<string>>(new Set());

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true); setError(null);
      const [assessmentData, functionsData, itemsData] = await Promise.all([
        assessmentsApi.get(id),
        csfApi.getFunctions(),
        assessmentsApi.getItems(id),
      ]);
      setAssessment(assessmentData);
      setFunctions(functionsData);
      setItems(itemsData);
    } catch (err) { setError(getErrorMessage(err)); } finally { setLoading(false); }
  };

  const distribution = useMemo(() => {
    const d = { compliant: 0, partial: 0, non_compliant: 0, not_assessed: 0, not_applicable: 0 };
    items.forEach((item) => { if (item.status in d) d[item.status as keyof typeof d]++; });
    return d;
  }, [items]);

  const complianceScore = useMemo(() => {
    const assessed = items.filter((i) => i.status !== 'not_assessed' && i.status !== 'not_applicable').length;
    return assessed === 0 ? 0 : (distribution.compliant / assessed) * 100;
  }, [items, distribution]);

  const filteredItems = useMemo(() => {
    let filtered = items;
    if (activeTab !== 'All') {
      filtered = filtered.filter((item) => {
        const funcName = item.function?.name || '';
        const catName = item.category?.name || '';
        return funcName.startsWith(activeTab) || catName.startsWith(activeTab) || item.subcategory?.name?.startsWith(activeTab);
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((item) =>
        (item.subcategory?.name || '').toLowerCase().includes(q) ||
        (item.subcategory?.description || '').toLowerCase().includes(q) ||
        (item.category?.name || '').toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [items, activeTab, searchQuery]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, { categoryId: string; categoryName: string; functionName: string; items: AssessmentItem[] }> = {};
    filteredItems.forEach((item) => {
      const catId = item.category?.id || 'unknown';
      if (!groups[catId]) {
        groups[catId] = { categoryId: catId, categoryName: item.category?.name || 'Unknown Category', functionName: item.function?.name || '', items: [] };
      }
      groups[catId].items.push(item);
    });
    return Object.values(groups).sort((a, b) => a.categoryName.localeCompare(b.categoryName));
  }, [filteredItems]);

  const toggleRequired = useCallback((itemId: string) => {
    setExpandedRequired(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
      return next;
    });
  }, []);

  const toggleGuidance = useCallback((itemId: string) => {
    setExpandedGuidance(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
      return next;
    });
  }, []);

  const togglePlatforms = useCallback((itemId: string) => {
    setExpandedPlatforms(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
      return next;
    });
  }, []);

  const handleStatusChange = async (itemId: string, newStatus: string) => {
    if (!id) return;
    try {
      const updated = await assessmentsApi.updateItem(id, itemId, { status: newStatus as AssessmentItem['status'] });
      setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...updated } : item)));
    } catch (err) { console.error('Failed to update status:', getErrorMessage(err)); }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[1,2,3,4].map(i => <div key={i} style={{ height: i === 1 ? 40 : i === 2 ? 160 : 40, background: '#E2E8F0', borderRadius: 12 }} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center', padding: '40px 0' }}>
        <div style={{ ...cardStyle, padding: 16, background: T.dangerLight, borderColor: T.dangerBorder, marginBottom: 16 }}>
          <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.danger, margin: 0 }}>{error}</p>
        </div>
        <button onClick={loadData} style={{
          padding: '9px 20px', borderRadius: 8, background: T.accent, border: 'none',
          fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, color: '#FFF', cursor: 'pointer',
        }}>
          Retry
        </button>
      </div>
    );
  }

  const scoreColor = complianceScore >= 80 ? T.success : complianceScore >= 50 ? T.warning : T.danger;
  const circumference = 2 * Math.PI * 50;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <Link to={`/assessments/${id}`} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12,
          fontFamily: T.fontSans, fontSize: 12, color: T.textMuted, textDecoration: 'none',
        }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = T.textSecondary}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = T.textMuted}
        >
          <ChevronLeft size={14} /> Back to Assessment
        </Link>
        <h1 style={{ fontFamily: T.fontSans, fontSize: 24, fontWeight: 800, color: T.textPrimary, margin: '0 0 4px' }}>
          Assessment Checklist
        </h1>
        <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary, margin: 0 }}>
          <span style={{ fontFamily: T.fontMono, color: T.accent }}>{items.length}</span> subcategories across{' '}
          <span style={{ fontFamily: T.fontMono, color: T.accent }}>{functions.length}</span> functions
        </p>
      </div>

      {/* Score Overview */}
      <div style={{ ...cardStyle, padding: 24 }}>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Circle */}
          <div style={{ position: 'relative', width: 128, height: 128, flexShrink: 0 }}>
            <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r="50" fill="none" stroke={T.border} strokeWidth="14" />
              <circle
                cx="60" cy="60" r="50" fill="none"
                stroke={scoreColor}
                strokeWidth="14"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={`${circumference * (1 - complianceScore / 100)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: T.fontDisplay, fontSize: 28, fontWeight: 700, color: T.textPrimary }}>
                {Math.round(complianceScore)}
              </span>
              <span style={{ fontFamily: T.fontSans, fontSize: 10, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Score
              </span>
            </div>
          </div>

          {/* Distribution bars */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Compliant',    count: distribution.compliant,     color: T.success },
              { label: 'Partial',      count: distribution.partial,       color: T.warning },
              { label: 'Non-Compliant',count: distribution.non_compliant, color: T.danger  },
              { label: 'Not Assessed', count: distribution.not_assessed,  color: T.textMuted },
              { label: 'N/A',          count: distribution.not_applicable,color: T.border  },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: item.color }} />
                <span style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary, width: 110 }}>
                  {item.label}
                </span>
                <div style={{ flex: 1, height: 6, background: T.bg, borderRadius: 3, overflow: 'hidden', border: `1px solid ${T.border}` }}>
                  <div style={{
                    height: '100%', borderRadius: 3, background: item.color,
                    width: items.length > 0 ? `${(item.count / items.length) * 100}%` : '0%',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
                <span style={{ fontFamily: T.fontMono, fontSize: 12, fontWeight: 600, color: T.textPrimary, width: 28, textAlign: 'right' }}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Function Tabs + Search */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {FUNCTION_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '6px 14px', borderRadius: 8, whiteSpace: 'nowrap',
                  background: isActive ? T.accent : T.card,
                  border: isActive ? 'none' : `1px solid ${T.border}`,
                  fontFamily: T.fontSans, fontSize: 13, fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#FFF' : T.textSecondary,
                  cursor: 'pointer', transition: 'all 0.14s',
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>
        <div style={{ position: 'relative', flex: 1, maxWidth: 280, marginLeft: 'auto' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.textMuted }} />
          <input
            type="text"
            placeholder="Search subcategories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
              boxSizing: 'border-box', borderRadius: 8,
              background: T.card, border: `1px solid ${T.border}`,
              fontFamily: T.fontSans, fontSize: 13, color: T.textPrimary, outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Results count */}
      {searchQuery && (
        <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary, margin: 0 }}>
          Showing <span style={{ fontFamily: T.fontMono, color: T.accent }}>{filteredItems.length}</span> of {items.length} subcategories
        </p>
      )}

      {/* Grouped Items */}
      {groupedItems.length === 0 ? (
        <div style={{ ...cardStyle, padding: '48px 20px', textAlign: 'center' }}>
          <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textMuted, margin: 0 }}>
            No items found matching your filters.
          </p>
        </div>
      ) : (
        groupedItems.map((group) => (
          <div key={group.categoryId} style={{ ...cardStyle, overflow: 'hidden' }}>
            {/* Category header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 20px', borderBottom: `1px solid ${T.border}`,
              background: T.bg,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 3, height: 14, background: T.accent, borderRadius: 2, flexShrink: 0 }} />
                <h3 style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 700, color: T.textPrimary, margin: 0 }}>
                  {group.categoryName}
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  fontFamily: T.fontMono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em',
                  padding: '2px 8px', borderRadius: 6, background: T.accentLight, color: T.accent,
                  border: `1px solid ${T.accentBorder}`,
                }}>
                  {group.functionName}
                </span>
                <span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.textMuted }}>
                  {group.items.length} items
                </span>
              </div>
            </div>

            {/* Items */}
            <div>
              {group.items.map((item, idx) => {
                const isRequiredOpen = expandedRequired.has(item.id);
                const isGuidanceOpen = expandedGuidance.has(item.id);
                const isPlatformsOpen = expandedPlatforms.has(item.id);
                const isAnyOpen = isRequiredOpen || isGuidanceOpen;

                const criteria = getComplianceCriteria(item.subcategory?.id);
                const evidenceList = getEvidenceRequirements(item.subcategory?.id);
                const guidance = getImplementationGuidance(item.subcategory?.id);

                const controlDescription = item.subcategory?.description
                  || `This subcategory covers ${item.subcategory?.id || 'this area'}. Gather relevant documentation, screenshots, or audit logs as evidence.`;

                return (
                  <div key={item.id} style={{
                    borderBottom: idx < group.items.length - 1 ? `1px solid ${T.border}` : 'none',
                  }}>
                    {/* Item row */}
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: 16, padding: '14px 20px',
                      transition: 'background 0.1s',
                    }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = T.bg}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = T.card}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontFamily: T.fontMono, fontSize: 12, fontWeight: 600, color: T.accent }}>
                            {item.subcategory?.id}
                          </span>
                          <span style={statusBadgeStyle(item.status || 'not_assessed')}>
                            {statusLabel(item.status || 'not_assessed')}
                          </span>
                        </div>
                        <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary, margin: 0, lineHeight: 1.6 }}>
                          {item.subcategory?.description}
                        </p>
                      </div>

                      {/* Action buttons + status select */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        {/* What's Required button */}
                        <button
                          onClick={() => toggleRequired(item.id)}
                          title="What's required to comply with this control"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 9px', borderRadius: 6, whiteSpace: 'nowrap',
                            background: isRequiredOpen ? T.accentLight : 'transparent',
                            border: `1px solid ${isRequiredOpen ? T.accentBorder : T.border}`,
                            fontFamily: T.fontSans, fontSize: 11, fontWeight: 500,
                            color: isRequiredOpen ? T.accent : T.textMuted,
                            cursor: 'pointer', transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { if (!isRequiredOpen) (e.currentTarget as HTMLElement).style.color = T.accent; }}
                          onMouseLeave={e => { if (!isRequiredOpen) (e.currentTarget as HTMLElement).style.color = T.textMuted; }}
                        >
                          ℹ️ What's Required
                        </button>

                        {/* Implementation Guidance button */}
                        <button
                          onClick={() => toggleGuidance(item.id)}
                          title="How to implement this control"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 9px', borderRadius: 6, whiteSpace: 'nowrap',
                            background: isGuidanceOpen ? T.accentLight : 'transparent',
                            border: `1px solid ${isGuidanceOpen ? T.accentBorder : T.border}`,
                            fontFamily: T.fontSans, fontSize: 11, fontWeight: 500,
                            color: isGuidanceOpen ? T.accent : T.textMuted,
                            cursor: 'pointer', transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { if (!isGuidanceOpen) (e.currentTarget as HTMLElement).style.color = T.accent; }}
                          onMouseLeave={e => { if (!isGuidanceOpen) (e.currentTarget as HTMLElement).style.color = T.textMuted; }}
                        >
                          📘 Guidance
                        </button>

                        {/* Status select */}
                        <div style={{ width: 160 }}>
                          <select
                            value={item.status || 'not_assessed'}
                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                            style={{
                              width: '100%', padding: '6px 10px', borderRadius: 8,
                              background: T.bg, border: `1px solid ${T.border}`,
                              fontFamily: T.fontSans, fontSize: 12, color: T.textPrimary,
                              outline: 'none', cursor: 'pointer',
                            }}
                          >
                            <option value="not_assessed">Not Assessed</option>
                            <option value="compliant">Compliant</option>
                            <option value="partial">Partial</option>
                            <option value="non_compliant">Non-Compliant</option>
                            <option value="not_applicable">N/A</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Expandable panels */}
                    {isAnyOpen && (
                      <div style={{
                        padding: '0 20px 16px 20px',
                        background: T.bg,
                        borderTop: `1px solid ${T.border}`,
                      }}>
                        <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>

                          {/* ── What's Required panel ─────────────────────── */}
                          {isRequiredOpen && (
                            <div style={{
                              padding: 16, borderRadius: 8,
                              background: T.card,
                              border: `1px solid ${T.border}`,
                              borderLeft: `3px solid ${T.accent}`,
                              display: 'flex', flexDirection: 'column', gap: 14,
                            }}>
                              {/* Control ID + name */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{
                                  fontFamily: T.fontMono, fontSize: 11, fontWeight: 700, color: T.accent,
                                  background: T.accentLight, border: `1px solid ${T.accentBorder}`,
                                  padding: '2px 7px', borderRadius: 4, flexShrink: 0,
                                }}>
                                  {item.subcategory?.id}
                                </span>
                                <span style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, color: T.textPrimary }}>
                                  {item.subcategory?.name || item.subcategory?.id}
                                </span>
                              </div>

                              {/* Control description */}
                              <div>
                                <p style={{
                                  fontFamily: T.fontSans, fontSize: 10, fontWeight: 600, color: T.textMuted,
                                  textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px',
                                }}>Control Description</p>
                                <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary, margin: 0, lineHeight: 1.65 }}>
                                  {controlDescription}
                                </p>
                              </div>

                              {/* Required evidence */}
                              <div>
                                <p style={{
                                  fontFamily: T.fontSans, fontSize: 10, fontWeight: 600, color: T.textMuted,
                                  textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px',
                                }}>Required Evidence</p>
                                <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                  {evidenceList.map((ev, i) => (
                                    <li key={i} style={{
                                      fontFamily: T.fontSans, fontSize: 11, color: T.textSecondary, lineHeight: 1.6,
                                    }}>
                                      {ev}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Compliance criteria */}
                              <div>
                                <p style={{
                                  fontFamily: T.fontSans, fontSize: 10, fontWeight: 600, color: T.textMuted,
                                  textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px',
                                }}>Compliance Criteria</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                  {[
                                    { label: 'Compliant', text: criteria.compliant, color: T.success, bg: T.successLight, border: T.successBorder },
                                    { label: 'Partial', text: criteria.partial, color: T.warning, bg: T.warningLight, border: T.warningBorder },
                                    { label: 'Non-Compliant', text: criteria.non_compliant, color: T.danger, bg: T.dangerLight, border: T.dangerBorder },
                                  ].map(({ label, text, color, bg, border }) => (
                                    <div key={label} style={{
                                      display: 'flex', gap: 10, padding: '7px 10px',
                                      background: bg, border: `1px solid ${border}`,
                                      borderRadius: 6, alignItems: 'flex-start',
                                    }}>
                                      <span style={{
                                        fontFamily: T.fontSans, fontSize: 10, fontWeight: 700,
                                        color, width: 94, flexShrink: 0, paddingTop: 1,
                                        textTransform: 'uppercase', letterSpacing: '0.04em',
                                      }}>{label}</span>
                                      <span style={{
                                        fontFamily: T.fontSans, fontSize: 11, color: T.textSecondary, lineHeight: 1.55,
                                      }}>{text}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* ── Implementation Guidance panel ─────────────── */}
                          {isGuidanceOpen && (
                            <div style={{
                              padding: 16, borderRadius: 8,
                              background: T.accentLight,
                              border: `1px solid ${T.accentBorder}`,
                              display: 'flex', flexDirection: 'column', gap: 14,
                            }}>
                              {/* Panel header */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 15 }}>📘</span>
                                <span style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 700, color: T.accent }}>
                                  Implementation Guidance
                                </span>
                              </div>

                              {/* Capability */}
                              <div>
                                <p style={{
                                  fontFamily: T.fontSans, fontSize: 10, fontWeight: 600, color: T.accent,
                                  textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px', opacity: 0.8,
                                }}>Capability Required</p>
                                <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary, margin: 0, lineHeight: 1.65 }}>
                                  {guidance.capability}
                                </p>
                              </div>

                              {/* Steps */}
                              <div>
                                <p style={{
                                  fontFamily: T.fontSans, fontSize: 10, fontWeight: 600, color: T.accent,
                                  textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px', opacity: 0.8,
                                }}>Implementation Steps</p>
                                <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 5 }}>
                                  {guidance.steps.map((step, i) => (
                                    <li key={i} style={{
                                      fontFamily: T.fontSans, fontSize: 11, color: T.textSecondary, lineHeight: 1.65,
                                    }}>
                                      {step}
                                    </li>
                                  ))}
                                </ol>
                              </div>

                              {/* Platform-specific examples (collapsible) */}
                              <div>
                                <button
                                  onClick={() => togglePlatforms(item.id)}
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                    padding: 0, background: 'transparent', border: 'none',
                                    fontFamily: T.fontSans, fontSize: 11, fontWeight: 600,
                                    color: T.accent, cursor: 'pointer',
                                  }}
                                >
                                  {isPlatformsOpen
                                    ? <ChevronDown size={12} />
                                    : <ChevronRight size={12} />}
                                  Platform-specific examples
                                </button>

                                {isPlatformsOpen && (
                                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
                                    {guidance.platforms.map((p, i) => (
                                      <div key={i} style={{
                                        display: 'flex', gap: 10, alignItems: 'flex-start',
                                        padding: '6px 10px', borderRadius: 6,
                                        background: T.card, border: `1px solid ${T.border}`,
                                      }}>
                                        <span style={{
                                          fontFamily: T.fontSans, fontSize: 10, fontWeight: 700,
                                          color: T.textPrimary, minWidth: 130, flexShrink: 0,
                                          textTransform: 'uppercase', letterSpacing: '0.04em', paddingTop: 1,
                                        }}>{p.category}</span>
                                        <span style={{
                                          fontFamily: T.fontSans, fontSize: 11, color: T.textSecondary, lineHeight: 1.55,
                                        }}>{p.tools}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

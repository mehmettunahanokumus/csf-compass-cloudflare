import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Shield,
  KeyRound,
  ShieldCheck,
  Cloud,
  Network,
  Monitor,
  Database,
  Fingerprint,
  Activity,
  AlertTriangle,
  HardDrive,
  Bug,
  Users,
  GraduationCap,
  Building2,
  ChevronLeft,
  ChevronRight,
  Save,
  Loader2,
  CheckCircle2,
  Upload,
  FileText,
  X,
  Check,
  Download,
} from 'lucide-react';
import { assessmentsApi } from '../api/assessments';
import { evidenceApi } from '../api/evidence';
import type { Assessment, EvidenceFile } from '../types';

// ── Design tokens ─────────────────────────────────────────────
const T = {
  card:          '#FFFFFF',
  bg:            '#F8FAFC',
  border:        '#E2E8F0',
  borderLight:   '#F1F5F9',
  textPrimary:   '#0F172A',
  textSecondary: '#64748B',
  textMuted:     '#94A3B8',
  textFaint:     '#CBD5E1',
  accent:        '#4F46E5',
  accentLight:   'rgba(79,70,229,0.08)',
  accentBorder:  'rgba(79,70,229,0.2)',
  success:       '#16A34A',
  successLight:  'rgba(22,163,74,0.08)',
  successBorder: 'rgba(22,163,74,0.2)',
  warning:       '#D97706',
  warningLight:  'rgba(217,119,6,0.08)',
  danger:        '#DC2626',
  dangerLight:   'rgba(220,38,38,0.08)',
  fontSans:      'Manrope, sans-serif',
  fontMono:      'JetBrains Mono, monospace',
  fontDisplay:   'Barlow Condensed, sans-serif',
};

const card: React.CSSProperties = {
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
};

const sectionLabel: React.CSSProperties = {
  fontFamily: T.fontSans, fontSize: 10, fontWeight: 700,
  letterSpacing: '0.09em', textTransform: 'uppercase', color: T.textMuted,
};

// ── Constants ────────────────────────────────────────────

const STEP_NAMES = [
  'Governance & Policy',
  'Entra ID / Azure AD',
  'Microsoft Defender',
  'AWS Security',
  'Network Security',
  'Endpoint Protection',
  'Data Protection',
  'Identity & Access Management',
  'Security Monitoring',
  'Incident Response',
  'Backup & Recovery',
  'Vulnerability Management',
  'Vendor Risk Management',
  'Security Awareness Training',
  'Business Continuity',
];

const STEP_DESCRIPTIONS = [
  'Upload governance documents, security policies, and organizational charts',
  'Provide Entra ID configuration exports and Azure AD security settings',
  'Share Microsoft Defender security assessments and threat reports',
  'Upload AWS security configurations, IAM policies, and CloudTrail logs',
  'Provide network diagrams, firewall rules, and segmentation documentation',
  'Share endpoint protection configurations and deployment status',
  'Upload data classification policies, encryption configs, and DLP reports',
  'Provide IAM configurations, access reviews, and MFA deployment status',
  'Share SIEM configurations, monitoring dashboards, and alert rules',
  'Upload incident response plans, playbooks, and exercise results',
  'Provide backup configurations, recovery plans, and test results',
  'Share vulnerability scan reports, patch management policies',
  'Upload vendor risk assessments, third-party audit reports',
  'Provide security training materials, completion records, phishing test results',
  'Upload BCP/DR plans, business impact analyses, recovery documentation',
];

const STEP_ICONS = [
  Shield, KeyRound, ShieldCheck, Cloud, Network, Monitor, Database,
  Fingerprint, Activity, AlertTriangle, HardDrive, Bug, Users,
  GraduationCap, Building2,
];

const TOTAL_STEPS = 15;

// ── Types ────────────────────────────────────────────────

interface StepData {
  notes: string;
  files: EvidenceFile[];
}

// ── Component ────────────────────────────────────────────

export default function AssessmentWizardShadcn() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [stepData, setStepData] = useState<Record<number, StepData>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!id) return;
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [assessmentData, allEvidence] = await Promise.all([
          assessmentsApi.get(id),
          evidenceApi.getForAssessment(id),
        ]);
        setAssessment(assessmentData);
        const organized: Record<number, StepData> = {};
        for (let i = 0; i < TOTAL_STEPS; i++) {
          const stepFiles = allEvidence.filter((f) => f.wizard_step === i);
          organized[i] = { notes: '', files: stepFiles };
        }
        setStepData(organized);
        const stepsWithFiles = Object.entries(organized)
          .filter(([, data]) => data.files.length > 0)
          .map(([step]) => parseInt(step));
        setCompletedSteps(stepsWithFiles);
      } catch {
        // Error loading
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id]);

  const currentStepData = stepData[currentStep] || { notes: '', files: [] };
  const currentFiles = currentStepData.files.map((f) => ({
    id: f.id,
    fileName: f.file_name,
    fileSize: f.file_size,
    mimeType: f.file_type || 'application/octet-stream',
    uploadedAt: f.uploaded_at || f.created_at,
  }));

  const progress = TOTAL_STEPS > 0 ? Math.round((completedSteps.length / TOTAL_STEPS) * 100) : 0;
  const StepIcon = STEP_ICONS[currentStep] || Shield;

  const handleUpload = useCallback(
    async (files: File[]) => {
      if (!id) return;
      const uploaded: EvidenceFile[] = [];
      for (const file of files) {
        const result = await evidenceApi.upload(file, id);
        uploaded.push(result);
      }
      setStepData((prev) => ({
        ...prev,
        [currentStep]: {
          ...prev[currentStep],
          files: [...(prev[currentStep]?.files || []), ...uploaded],
        },
      }));
    },
    [id, currentStep],
  );

  const handleDownload = useCallback(
    (fileId: string) => {
      const file = currentStepData.files.find((f) => f.id === fileId);
      if (file?.download_url) {
        const url = evidenceApi.getDownloadUrl(file.download_url);
        window.open(url, '_blank');
      }
    },
    [currentStepData.files],
  );

  const handleDelete = useCallback(
    async (fileId: string) => {
      await evidenceApi.delete(fileId);
      setStepData((prev) => ({
        ...prev,
        [currentStep]: {
          ...prev[currentStep],
          files: (prev[currentStep]?.files || []).filter((f) => f.id !== fileId),
        },
      }));
    },
    [currentStep],
  );

  const handleNotesChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setStepData((prev) => ({
        ...prev,
        [currentStep]: { ...prev[currentStep], notes: e.target.value },
      }));
    },
    [currentStep],
  );

  const handlePrevious = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleNext = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps((prev) => [...prev, currentStep]);
    }
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate(`/assessments/${id}`);
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps((prev) => [...prev, currentStep]);
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleUpload(files);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isLastStep = currentStep === TOTAL_STEPS - 1;
  const isFirstStep = currentStep === 0;

  // ── Loading state ──

  if (isLoading) {
    return (
      <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 9, background: T.borderLight }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ height: 18, width: 200, borderRadius: 6, background: T.borderLight }} />
            <div style={{ height: 12, width: 120, borderRadius: 6, background: T.borderLight }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[96, 180, 120].map((h, i) => (
              <div key={i} style={{ height: h, borderRadius: 12, background: T.borderLight }} />
            ))}
          </div>
          <div style={{ width: 260, height: 480, borderRadius: 12, background: T.borderLight, flexShrink: 0 }} />
        </div>
      </div>
    );
  }

  // ── Main render ──

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 8rem)' }}>

      {/* Sticky Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${T.border}`,
        background: 'rgba(248,250,252,0.95)',
        backdropFilter: 'blur(8px)',
        padding: '14px 0', marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => navigate(`/assessments/${id}`)}
            style={{
              width: 36, height: 36, borderRadius: 9,
              background: T.card, border: `1px solid ${T.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: T.textMuted, cursor: 'pointer', transition: 'all 0.14s',
            }}
            onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = '#CBD5E1'; el.style.color = T.textPrimary; }}
            onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = T.border; el.style.color = T.textMuted; }}
          >
            <ChevronLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontFamily: T.fontSans, fontSize: 18, fontWeight: 800, color: T.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
              Data Collection Wizard
            </h1>
            {assessment && (
              <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textMuted, marginTop: 2 }}>
                {assessment.name}
              </p>
            )}
          </div>
        </div>
        <span style={{ fontFamily: T.fontMono, fontSize: 13, color: T.textSecondary }}>
          Step <span style={{ color: T.accent, fontWeight: 700 }}>{currentStep + 1}</span> of {TOTAL_STEPS}
        </span>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, gap: 24, paddingBottom: 24 }}>

        {/* Left: Main content area */}
        <div style={{ flex: 3, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Step Info Banner */}
          <div style={{
            ...card,
            display: 'flex', alignItems: 'flex-start', gap: 16,
            padding: '18px 20px',
            borderLeft: `3px solid ${T.accent}`,
            background: T.accentLight,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, flexShrink: 0,
              background: T.accentLight, border: `1px solid ${T.accentBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <StepIcon size={20} style={{ color: T.accent }} />
            </div>
            <div>
              <h2 style={{ fontFamily: T.fontDisplay, fontSize: 17, fontWeight: 700, color: T.textPrimary, margin: 0, letterSpacing: '0.01em' }}>
                {STEP_NAMES[currentStep]}
              </h2>
              <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary, marginTop: 4, lineHeight: 1.6 }}>
                {STEP_DESCRIPTIONS[currentStep]}
              </p>
            </div>
          </div>

          {/* File Uploader */}
          <div style={card}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.borderLight}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 3, height: 14, borderRadius: 2, background: T.accent, flexShrink: 0 }} />
              <span style={sectionLabel}>Upload Evidence</span>
            </div>
            <div style={{ padding: 20 }}>
              <label
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '32px 20px', borderRadius: 10,
                  border: `2px dashed ${isDragging ? T.accent : T.border}`,
                  background: isDragging ? T.accentLight : T.bg,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onMouseEnter={e => { (e.currentTarget as HTMLLabelElement).style.borderColor = T.accent; (e.currentTarget as HTMLLabelElement).style.background = T.accentLight; }}
                onMouseLeave={e => { if (!isDragging) { (e.currentTarget as HTMLLabelElement).style.borderColor = T.border; (e.currentTarget as HTMLLabelElement).style.background = T.bg; } }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: T.accentLight, border: `1px solid ${T.accentBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
                }}>
                  <Upload size={20} style={{ color: T.accent }} />
                </div>
                <p style={{ fontFamily: T.fontSans, fontSize: 14, fontWeight: 600, color: T.textPrimary, margin: 0 }}>
                  Click to upload files
                </p>
                <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textMuted, marginTop: 4 }}>
                  PDF, DOCX, PNG, JPG up to 10MB — or drag & drop
                </p>
                <input
                  type="file"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFileInputChange}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx,.csv"
                />
              </label>
            </div>
          </div>

          {/* Evidence List */}
          <div style={card}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.borderLight}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 3, height: 14, borderRadius: 2, background: T.accent, flexShrink: 0 }} />
              <span style={sectionLabel}>
                Uploaded Files
              </span>
              <span style={{ ...sectionLabel, color: T.textFaint, marginLeft: 4 }}>
                ({currentFiles.length})
              </span>
            </div>
            <div style={{ padding: 20 }}>
              {currentFiles.length === 0 ? (
                <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textMuted, textAlign: 'center', padding: '16px 0' }}>
                  No files uploaded for this step yet
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {currentFiles.map((file) => (
                    <div
                      key={file.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 14px', borderRadius: 9,
                        background: T.bg, border: `1px solid ${T.border}`,
                      }}
                    >
                      <div style={{
                        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                        background: T.accentLight, border: `1px solid ${T.accentBorder}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <FileText size={14} style={{ color: T.accent }} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, color: T.textPrimary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {file.fileName}
                        </p>
                        <p style={{ fontFamily: T.fontMono, fontSize: 10, color: T.textMuted, marginTop: 2 }}>
                          {formatFileSize(file.fileSize)}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={() => handleDownload(file.id)}
                          style={{
                            width: 30, height: 30, borderRadius: 7,
                            background: 'none', border: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: T.textMuted, cursor: 'pointer', transition: 'all 0.12s',
                          }}
                          onMouseEnter={e => { const el = e.currentTarget; el.style.background = T.accentLight; el.style.color = T.accent; }}
                          onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'none'; el.style.color = T.textMuted; }}
                          title="Download"
                        >
                          <Download size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(file.id)}
                          style={{
                            width: 30, height: 30, borderRadius: 7,
                            background: 'none', border: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: T.textMuted, cursor: 'pointer', transition: 'all 0.12s',
                          }}
                          onMouseEnter={e => { const el = e.currentTarget; el.style.background = 'rgba(220,38,38,0.08)'; el.style.color = T.danger; }}
                          onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'none'; el.style.color = T.textMuted; }}
                          title="Delete"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Additional Notes */}
          <div style={card}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.borderLight}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 3, height: 14, borderRadius: 2, background: T.accent, flexShrink: 0 }} />
              <span style={sectionLabel}>Additional Notes</span>
            </div>
            <div style={{ padding: 20 }}>
              <textarea
                rows={6}
                value={currentStepData.notes}
                onChange={handleNotesChange}
                placeholder="Add any additional notes or context for this step..."
                style={{
                  width: '100%', minHeight: 120, resize: 'vertical',
                  background: T.bg, border: `1px solid ${T.border}`,
                  borderRadius: 9, padding: '12px 16px',
                  fontFamily: T.fontSans, fontSize: 13, color: T.textPrimary,
                  outline: 'none', boxSizing: 'border-box', lineHeight: 1.6,
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = T.accentBorder; }}
                onBlur={e => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = T.border; }}
              />
            </div>
          </div>
        </div>

        {/* Right: Wizard Stepper Sidebar */}
        <div style={{ width: 260, flexShrink: 0 }}>
          <div style={{
            ...card, position: 'sticky', top: 80,
            display: 'flex', flexDirection: 'column',
            maxHeight: 'calc(100vh - 10rem)', overflow: 'hidden',
          }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.borderLight}` }}>
              <span style={sectionLabel}>Wizard Steps</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
              {STEP_NAMES.map((name, index) => {
                const isCurrent = index === currentStep;
                const isCompleted = completedSteps.includes(index);
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    style={{
                      display: 'flex', width: '100%', alignItems: 'center', gap: 10,
                      padding: '9px 16px', textAlign: 'left', border: 'none', cursor: 'pointer',
                      background: isCurrent ? T.accentLight : 'transparent',
                      borderRight: isCurrent ? `2px solid ${T.accent}` : '2px solid transparent',
                      transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => { if (!isCurrent) (e.currentTarget as HTMLButtonElement).style.background = T.borderLight; }}
                    onMouseLeave={e => { if (!isCurrent) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  >
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700, fontFamily: T.fontSans,
                      background: isCurrent ? T.accent : isCompleted ? T.successLight : T.borderLight,
                      color: isCurrent ? '#fff' : isCompleted ? T.success : T.textMuted,
                      border: isCompleted ? `1px solid ${T.successBorder}` : 'none',
                      transition: 'all 0.12s',
                    }}>
                      {isCompleted ? <Check size={11} strokeWidth={3} /> : index + 1}
                    </div>
                    <span style={{
                      fontFamily: T.fontSans, fontSize: 12, lineHeight: 1.3,
                      color: isCurrent ? T.accent : isCompleted ? T.textSecondary : T.textMuted,
                      fontWeight: isCurrent ? 700 : 400,
                    }}>
                      {name}
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={{ padding: 16, borderTop: `1px solid ${T.borderLight}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ ...sectionLabel, letterSpacing: '0.06em' }}>Progress</span>
                <span style={{ fontFamily: T.fontMono, fontSize: 12, fontWeight: 700, color: T.accent }}>
                  {progress}%
                </span>
              </div>
              <div style={{ height: 6, background: T.borderLight, borderRadius: 999, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 999,
                  background: progress < 30 ? T.danger : progress < 70 ? T.warning : T.accent,
                  width: `${progress}%`, transition: 'width 0.5s ease-out',
                }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Step Indicator */}
      <div style={{ borderTop: `1px solid ${T.border}`, padding: '12px 0', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary }}>
            Step {currentStep + 1}: {STEP_NAMES[currentStep]}
          </span>
          <span style={{ fontFamily: T.fontMono, fontSize: 12, fontWeight: 700, color: T.accent }}>
            {progress}%
          </span>
        </div>
        <div style={{ height: 5, background: T.borderLight, borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 999, background: T.accent,
            width: `${progress}%`, transition: 'width 0.5s ease-out',
          }} />
        </div>
      </div>

      {/* Sticky Bottom Navigation */}
      <div style={{
        position: 'sticky', bottom: 0, zIndex: 30,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderTop: `1px solid ${T.border}`,
        background: 'rgba(248,250,252,0.95)',
        backdropFilter: 'blur(8px)',
        padding: '14px 0',
        marginTop: 8,
      }}>
        {/* Previous */}
        <button
          onClick={handlePrevious}
          disabled={isFirstStep}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 9,
            background: T.card, border: `1px solid ${T.border}`,
            fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
            color: isFirstStep ? T.textFaint : T.textSecondary,
            cursor: isFirstStep ? 'not-allowed' : 'pointer',
            opacity: isFirstStep ? 0.4 : 1,
            transition: 'all 0.14s',
          }}
          onMouseEnter={e => { if (!isFirstStep) { const el = e.currentTarget; el.style.borderColor = '#CBD5E1'; el.style.color = T.textPrimary; } }}
          onMouseLeave={e => { if (!isFirstStep) { const el = e.currentTarget; el.style.borderColor = T.border; el.style.color = T.textSecondary; } }}
        >
          <ChevronLeft size={15} />
          Previous
        </button>

        {/* Dot indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              style={{
                borderRadius: 999, border: 'none', cursor: 'pointer',
                padding: 0, transition: 'all 0.15s',
                width: i === currentStep ? 10 : 7,
                height: i === currentStep ? 10 : 7,
                background: i === currentStep
                  ? T.accent
                  : completedSteps.includes(i)
                    ? T.success
                    : T.borderLight,
              }}
            />
          ))}
        </div>

        {/* Save + Next */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={handleSaveDraft}
            disabled={isSaving}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 9,
              background: T.card, border: `1px solid ${T.border}`,
              fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
              color: T.textSecondary, cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.6 : 1, transition: 'all 0.14s',
            }}
            onMouseEnter={e => { if (!isSaving) { const el = e.currentTarget; el.style.borderColor = '#CBD5E1'; el.style.color = T.textPrimary; } }}
            onMouseLeave={e => { if (!isSaving) { const el = e.currentTarget; el.style.borderColor = T.border; el.style.color = T.textSecondary; } }}
          >
            {isSaving ? (
              <>
                <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                Saving...
              </>
            ) : (
              <>
                <Save size={13} />
                Save Draft
              </>
            )}
          </button>

          <button
            onClick={handleNext}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 20px', borderRadius: 9,
              background: T.accent, color: '#fff', border: 'none',
              fontFamily: T.fontDisplay, fontSize: 14, fontWeight: 700,
              cursor: 'pointer', letterSpacing: '0.02em',
              boxShadow: '0 1px 3px rgba(79,70,229,0.3)',
              transition: 'all 0.14s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#4338CA'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = T.accent; }}
          >
            {isLastStep ? (
              <>
                Complete Assessment
                <CheckCircle2 size={15} />
              </>
            ) : (
              <>
                Next
                <ChevronRight size={15} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

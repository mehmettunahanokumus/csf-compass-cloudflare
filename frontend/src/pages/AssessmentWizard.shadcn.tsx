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

  // Fetch assessment and evidence on mount
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

        // Organize evidence by wizard_step
        const organized: Record<number, StepData> = {};
        for (let i = 0; i < TOTAL_STEPS; i++) {
          const stepFiles = allEvidence.filter((f) => f.wizard_step === i);
          organized[i] = { notes: '', files: stepFiles };
        }
        setStepData(organized);

        // Mark steps with files as completed
        const stepsWithFiles = Object.entries(organized)
          .filter(([, data]) => data.files.length > 0)
          .map(([step]) => parseInt(step));
        setCompletedSteps(stepsWithFiles);
      } catch {
        // Error loading - assessment may not exist
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
        [currentStep]: {
          ...prev[currentStep],
          notes: e.target.value,
        },
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
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="h-9 w-9 bg-white/[0.06] rounded-lg" />
          <div className="space-y-2">
            <div className="h-5 w-48 bg-white/[0.06] rounded" />
            <div className="h-3 w-32 bg-white/[0.06] rounded" />
          </div>
        </div>
        <div className="flex gap-6">
          <div className="flex-[3] space-y-4">
            <div className="h-24 w-full bg-white/[0.06] rounded-xl" />
            <div className="h-48 w-full bg-white/[0.06] rounded-xl" />
            <div className="h-32 w-full bg-white/[0.06] rounded-xl" />
          </div>
          <div className="hidden lg:block w-[280px] h-[500px] bg-white/[0.06] rounded-xl" />
        </div>
      </div>
    );
  }

  // ── Main render ──

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col animate-fade-in-up">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/[0.06] bg-[#08090E]/95 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/assessments/${id}`)}
            className="flex items-center justify-center w-9 h-9 bg-white/[0.04] border border-white/[0.07] rounded-lg text-[#8E8FA8] hover:text-[#F0F0F5] hover:border-amber-500/30 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-display text-lg font-semibold text-[#F0F0F5]">Data Collection Wizard</h1>
            {assessment && (
              <p className="font-sans text-xs text-[#55576A]">{assessment.name}</p>
            )}
          </div>
        </div>
        <span className="font-mono text-sm font-medium text-[#8E8FA8]">
          Step <span className="text-amber-400">{currentStep + 1}</span> of {TOTAL_STEPS}
        </span>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 gap-6 p-6">
        {/* Left: Main content area */}
        <div className="flex min-w-0 flex-[3] flex-col gap-5">
          {/* Step Info Banner */}
          <div className="flex items-start gap-4 bg-amber-500/[0.05] border-l-[3px] border-l-amber-500 border border-white/[0.07] rounded-xl p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/15">
              <StepIcon className="h-5 w-5 text-amber-500/70" />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold text-[#F0F0F5]">{STEP_NAMES[currentStep]}</h2>
              <p className="mt-1 font-sans text-sm text-[#8E8FA8] leading-relaxed">
                {STEP_DESCRIPTIONS[currentStep]}
              </p>
            </div>
          </div>

          {/* File Uploader */}
          <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <h3 className="font-display text-xs font-semibold tracking-wide text-[#8E8FA8] uppercase">Upload Evidence</h3>
            </div>
            <div className="p-5">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/[0.1] p-8 transition-all hover:border-amber-500/30 hover:bg-amber-500/[0.03] group">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center mb-3 group-hover:bg-amber-500/15 transition-colors">
                  <Upload className="h-5 w-5 text-amber-500/60 group-hover:text-amber-400 transition-colors" />
                </div>
                <p className="font-sans text-sm font-medium text-[#F0F0F5]">Click to upload files</p>
                <p className="mt-1 font-sans text-xs text-[#55576A]">
                  PDF, DOCX, PNG, JPG up to 10MB
                </p>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileInputChange}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx,.csv"
                />
              </label>
            </div>
          </div>

          {/* Evidence List */}
          <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <h3 className="font-display text-xs font-semibold tracking-wide text-[#8E8FA8] uppercase">
                Uploaded Files <span className="text-[#55576A]">({currentFiles.length})</span>
              </h3>
            </div>
            <div className="p-5">
              {currentFiles.length === 0 ? (
                <p className="py-4 text-center font-sans text-sm text-[#55576A]">
                  No files uploaded for this step yet
                </p>
              ) : (
                <div className="space-y-2">
                  {currentFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 hover:border-white/[0.1] transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-3.5 w-3.5 text-amber-500/60" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-sans text-sm font-medium text-[#F0F0F5]">{file.fileName}</p>
                        <p className="font-mono text-[10px] text-[#55576A]">
                          {formatFileSize(file.fileSize)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDownload(file.id)}
                          className="p-1.5 rounded-md text-[#55576A] hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(file.id)}
                          className="p-1.5 rounded-md text-[#55576A] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Additional Notes */}
          <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <h3 className="font-display text-xs font-semibold tracking-wide text-[#8E8FA8] uppercase">Additional Notes</h3>
            </div>
            <div className="p-5">
              <textarea
                rows={6}
                value={currentStepData.notes}
                onChange={handleNotesChange}
                placeholder="Add any additional notes or context for this step..."
                className="w-full min-h-[120px] resize-y bg-white/[0.03] border border-white/[0.07] rounded-lg px-4 py-3 font-sans text-sm text-[#F0F0F5] placeholder:text-[#55576A] focus:outline-none focus:border-amber-500/30 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Right: Wizard Stepper Sidebar */}
        <div className="hidden min-w-[240px] max-w-[300px] flex-1 lg:block">
          <div className="sticky top-24 bg-[#0E1018] border border-white/[0.07] rounded-xl flex max-h-[calc(100vh-10rem)] flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <h3 className="font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-[#55576A]">
                Wizard Steps
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto py-1 scrollbar-thin">
              {STEP_NAMES.map((name, index) => {
                const isCurrent = index === currentStep;
                const isCompleted = completedSteps.includes(index);

                return (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-all ${
                      isCurrent
                        ? 'bg-amber-500/[0.08] border-r-2 border-r-amber-500'
                        : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-all ${
                        isCurrent
                          ? 'bg-amber-500 text-[#08090E]'
                          : isCompleted
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-white/[0.06] text-[#55576A]'
                      }`}
                    >
                      {isCompleted ? <Check className="h-3 w-3" strokeWidth={3} /> : index + 1}
                    </div>
                    <span
                      className={`font-sans text-[12px] leading-tight ${
                        isCurrent
                          ? 'font-semibold text-amber-400'
                          : isCompleted
                            ? 'text-[#8E8FA8]'
                            : 'text-[#55576A]'
                      }`}
                    >
                      {name}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-white/[0.06] p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-sans text-[10px] font-medium text-[#55576A] uppercase tracking-wider">
                  Progress
                </span>
                <span className="font-mono text-xs font-bold text-amber-400">{progress}%</span>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Step Indicator (visible only on small screens) */}
      <div className="border-t border-white/[0.06] px-6 py-3 lg:hidden">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-sans text-xs font-medium text-[#8E8FA8]">
            Step {currentStep + 1}: {STEP_NAMES[currentStep]}
          </span>
          <span className="font-mono text-xs font-bold text-amber-400">{progress}%</span>
        </div>
        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Sticky Bottom Navigation */}
      <div className="sticky bottom-0 z-30 flex items-center justify-between border-t border-white/[0.06] bg-[#08090E]/95 backdrop-blur-sm px-6 py-4">
        {/* Previous */}
        <button
          onClick={handlePrevious}
          disabled={isFirstStep}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/[0.04] border border-white/[0.07] text-[#8E8FA8] font-sans text-sm rounded-lg hover:border-amber-500/30 hover:text-[#F0F0F5] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-white/[0.07] disabled:hover:text-[#8E8FA8]"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        {/* Dot indicators - desktop only */}
        <div className="hidden items-center gap-1.5 md:flex">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`rounded-full transition-all ${
                i === currentStep
                  ? 'h-2.5 w-2.5 bg-amber-500'
                  : completedSteps.includes(i)
                    ? 'h-2 w-2 bg-emerald-500/60'
                    : 'h-2 w-2 bg-white/[0.1]'
              }`}
            />
          ))}
        </div>

        {/* Save + Next */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/[0.04] border border-white/[0.07] text-[#8E8FA8] font-sans text-sm rounded-lg hover:border-amber-500/30 hover:text-[#F0F0F5] transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                Save Draft
              </>
            )}
          </button>

          <button
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-[#08090E] font-display text-sm font-semibold rounded-lg hover:bg-amber-400 transition-colors"
          >
            {isLastStep ? (
              <>
                Complete Assessment
                <CheckCircle2 className="w-4 h-4" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

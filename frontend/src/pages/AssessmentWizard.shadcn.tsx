import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Skeleton } from '../components/ui/skeleton';
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
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div>
            <Skeleton className="mb-2 h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="flex gap-6">
          <div className="flex-[3] space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="hidden h-[500px] w-[280px] lg:block" />
        </div>
      </div>
    );
  }

  // ── Main render ──

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-background px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(`/assessments/${id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Data Collection Wizard</h1>
            {assessment && (
              <p className="text-xs text-muted-foreground">{assessment.name}</p>
            )}
          </div>
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          Step {currentStep + 1} of {TOTAL_STEPS}
        </span>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 gap-6 p-6">
        {/* Left: Main content area */}
        <div className="flex min-w-0 flex-[3] flex-col gap-5">
          {/* Step Info Banner */}
          <div className="flex items-start gap-4 rounded-r-lg border-l-4 border-l-primary bg-primary/5 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm">
              <StepIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold">{STEP_NAMES[currentStep]}</h2>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {STEP_DESCRIPTIONS[currentStep]}
              </p>
            </div>
          </div>

          {/* File Uploader */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Upload Evidence</CardTitle>
            </CardHeader>
            <CardContent>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-primary hover:bg-primary/5">
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Click to upload files</p>
                <p className="mt-1 text-xs text-muted-foreground">
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
            </CardContent>
          </Card>

          {/* Evidence List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Uploaded Files ({currentFiles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentFiles.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No files uploaded for this step yet
                </p>
              ) : (
                <div className="space-y-2">
                  {currentFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 rounded-lg border bg-background p-3"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{file.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.fileSize)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDownload(file.id)}
                        >
                          <ArrowLeft className="h-3 w-3 rotate-[-90deg]" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(file.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="step-notes" className="sr-only">
                Notes
              </Label>
              <Textarea
                id="step-notes"
                rows={6}
                value={currentStepData.notes}
                onChange={handleNotesChange}
                placeholder="Add any additional notes or context for this step..."
                className="min-h-[120px] resize-y"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right: Wizard Stepper Sidebar */}
        <div className="hidden min-w-[240px] max-w-[300px] flex-1 lg:block">
          <Card className="sticky top-24 flex max-h-[calc(100vh-10rem)] flex-col overflow-hidden">
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Wizard Steps
              </CardTitle>
            </CardHeader>

            <div className="flex-1 overflow-y-auto py-2">
              {STEP_NAMES.map((name, index) => {
                const isCurrent = index === currentStep;
                const isCompleted = completedSteps.includes(index);

                return (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      isCurrent
                        ? 'bg-primary/10'
                        : 'hover:bg-accent'
                    }`}
                  >
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        isCurrent
                          ? 'bg-primary text-primary-foreground'
                          : isCompleted
                            ? 'bg-emerald-500 text-white'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : index + 1}
                    </div>
                    <span
                      className={`text-[13px] leading-tight ${
                        isCurrent
                          ? 'font-semibold text-foreground'
                          : isCompleted
                            ? 'text-muted-foreground'
                            : 'text-muted-foreground'
                      }`}
                    >
                      {name}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="border-t p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Overall Progress
                </span>
                <span className="text-xs font-semibold">{progress}%</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          </Card>
        </div>
      </div>

      {/* Mobile Step Indicator (visible only on small screens) */}
      <div className="border-t px-6 py-3 lg:hidden">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Step {currentStep + 1}: {STEP_NAMES[currentStep]}
          </span>
          <span className="text-xs font-semibold">{progress}%</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Sticky Bottom Navigation */}
      <div className="sticky bottom-0 z-30 flex items-center justify-between border-t bg-background px-6 py-4">
        {/* Previous */}
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={isFirstStep}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>

        {/* Dot indicators - desktop only */}
        <div className="hidden items-center gap-1.5 md:flex">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`rounded-full transition-all ${
                i === currentStep
                  ? 'h-2.5 w-2.5 bg-primary'
                  : completedSteps.includes(i)
                    ? 'h-2 w-2 bg-emerald-500'
                    : 'h-2 w-2 bg-border'
              }`}
            />
          ))}
        </div>

        {/* Save + Next */}
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-1 h-4 w-4" />
                Save Draft
              </>
            )}
          </Button>

          <Button onClick={handleNext}>
            {isLastStep ? (
              <>
                Complete Assessment
                <CheckCircle2 className="ml-1 h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

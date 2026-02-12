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
} from 'lucide-react';
import { assessmentsApi } from '../api/assessments';
import { evidenceApi } from '../api/evidence';
import type { Assessment, EvidenceFile } from '../types';
import WizardStepper from '../components/wizard/WizardStepper';
import StepNavigation from '../components/wizard/StepNavigation';
import FileUploader from '../components/evidence/FileUploader';
import EvidenceList from '../components/evidence/EvidenceList';

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
];

const TOTAL_STEPS = 15;

interface StepData {
  notes: string;
  files: EvidenceFile[];
}

const AssessmentWizard: React.FC = () => {
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
          const stepFiles = allEvidence
            .filter((f) => f.wizard_step === i)
            .map((f) => f);
          organized[i] = {
            notes: '',
            files: stepFiles,
          };
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
    [id, currentStep]
  );

  const handleDownload = useCallback(
    (fileId: string) => {
      const file = currentStepData.files.find((f) => f.id === fileId);
      if (file?.download_url) {
        const url = evidenceApi.getDownloadUrl(file.download_url);
        window.open(url, '_blank');
      }
    },
    [currentStepData.files]
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
    [currentStep]
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
    [currentStep]
  );

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    // Mark current step as completed
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps((prev) => [...prev, currentStep]);
    }
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Last step - navigate back
      navigate(`/assessments/${id}`);
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      // Mark current step as completed if it has content
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps((prev) => [...prev, currentStep]);
      }
      // Simulate save delay for UX
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      setIsSaving(false);
    }
  };

  const handleStepClick = (step: number) => {
    setCurrentStep(step);
  };

  const StepIcon = STEP_ICONS[currentStep] || Shield;

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          padding: '24px',
        }}
      >
        <div className="skeleton" style={{ height: '48px', width: '300px', borderRadius: 'var(--radius-sm)' }} />
        <div style={{ display: 'flex', gap: '24px' }}>
          <div className="skeleton" style={{ flex: 3, height: '500px', borderRadius: 'var(--radius-md)' }} />
          <div className="skeleton" style={{ flex: 1, height: '500px', borderRadius: 'var(--radius-md)' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Sticky Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: 'var(--card)',
          borderBottom: '1px solid var(--border)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate(`/assessments/${id}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              color: 'var(--text-2)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-hover)';
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--sidebar-hover)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text-1)',
                fontFamily: 'var(--font-display)',
                margin: 0,
              }}
            >
              Data Collection Wizard
            </h1>
            {assessment && (
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--text-3)',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {assessment.name}
              </span>
            )}
          </div>
        </div>
        <span
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--text-2)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Step {currentStep + 1} of {TOTAL_STEPS}
        </span>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          gap: '24px',
          padding: '24px',
          minHeight: 0,
        }}
      >
        {/* Left: Main content area */}
        <div
          style={{
            flex: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            minWidth: 0,
          }}
        >
          {/* Step Info Banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
              padding: '20px',
              background: 'var(--accent-subtle)',
              borderLeft: '4px solid var(--accent)',
              borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <StepIcon size={22} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--text-1)',
                  fontFamily: 'var(--font-sans)',
                  margin: 0,
                }}
              >
                {STEP_NAMES[currentStep]}
              </h2>
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--text-2)',
                  fontFamily: 'var(--font-sans)',
                  margin: '4px 0 0',
                  lineHeight: 1.5,
                }}
              >
                {STEP_DESCRIPTIONS[currentStep]}
              </p>
            </div>
          </div>

          {/* File Uploader */}
          <div
            style={{
              background: 'var(--card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              padding: '20px',
            }}
          >
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-1)',
                fontFamily: 'var(--font-sans)',
                margin: '0 0 16px',
              }}
            >
              Upload Evidence
            </h3>
            <FileUploader onUpload={handleUpload} />
          </div>

          {/* Evidence List */}
          <div
            style={{
              background: 'var(--card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              padding: '20px',
            }}
          >
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-1)',
                fontFamily: 'var(--font-sans)',
                margin: '0 0 16px',
              }}
            >
              Uploaded Files ({currentFiles.length})
            </h3>
            <EvidenceList
              files={currentFiles}
              onDownload={handleDownload}
              onDelete={handleDelete}
            />
          </div>

          {/* Additional Notes */}
          <div
            style={{
              background: 'var(--card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              padding: '20px',
            }}
          >
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-1)',
                fontFamily: 'var(--font-sans)',
                margin: '0 0 12px',
              }}
            >
              Additional Notes
            </h3>
            <textarea
              rows={6}
              value={currentStepData.notes}
              onChange={handleNotesChange}
              placeholder="Add any additional notes or context for this step..."
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--card)',
                color: 'var(--text-1)',
                fontSize: '13px',
                fontFamily: 'var(--font-sans)',
                lineHeight: 1.6,
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLTextAreaElement).style.borderColor = 'var(--border-focus)';
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLTextAreaElement).style.borderColor = 'var(--border)';
              }}
            />
          </div>
        </div>

        {/* Right: Wizard Stepper */}
        <div
          style={{
            flex: 1,
            minWidth: '240px',
            maxWidth: '300px',
          }}
        >
          <WizardStepper
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
          />
        </div>
      </div>

      {/* Sticky Bottom Navigation */}
      <StepNavigation
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        completedSteps={completedSteps}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onSaveDraft={handleSaveDraft}
        isSaving={isSaving}
        isLastStep={currentStep === TOTAL_STEPS - 1}
      />
    </div>
  );
};

export default AssessmentWizard;

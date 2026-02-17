/**
 * NewAssessment - Multi-step wizard for creating organization or vendor assessments
 * CIPHER design system
 */

import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Building2, ClipboardCheck } from 'lucide-react';
import { assessmentsApi } from '../api/assessments';
import { vendorsApi } from '../api/vendors';
import type { Vendor } from '../types';
import { getErrorMessage } from '../api/client';

type AssessmentType = 'organization' | 'vendor';

interface FormData {
  type: AssessmentType;
  vendorId: string;
  name: string;
  description: string;
}

export default function NewAssessmentNew() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    type: 'organization',
    vendorId: '',
    name: '',
    description: '',
  });

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      setLoadingVendors(true);
      const vendorsData = await vendorsApi.list();
      setVendors(vendorsData);
    } catch (err) {
      console.error('Failed to load vendors:', err);
    } finally {
      setLoadingVendors(false);
    }
  };

  const handleTypeSelect = (type: AssessmentType) => {
    setFormData({ ...formData, type });
    setStep(2);
  };

  const handleVendorSelect = (vendorId: string) => {
    setFormData({ ...formData, vendorId });
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleNext = () => {
    if (step === 2 && formData.type === 'vendor' && !formData.vendorId) {
      alert('Please select a vendor');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter an assessment name');
      return;
    }

    try {
      setLoading(true);
      const assessment = await assessmentsApi.create({
        assessment_type: formData.type,
        vendor_id: formData.type === 'vendor' ? formData.vendorId : undefined,
        name: formData.name,
        description: formData.description || undefined,
      });

      navigate(`/assessments/${assessment.id}`);
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 2 && formData.type === 'vendor') {
      return !!formData.vendorId;
    }
    return true;
  };

  const getRiskBadgeClass = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'bg-red-500/10 text-red-400';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400';
      case 'low':
        return 'bg-emerald-500/10 text-emerald-400';
      default:
        return 'bg-white/[0.06] text-[#8E8FA8]';
    }
  };

  return (
    <div className="max-w-[800px] mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="flex gap-4 items-start mb-8">
        <Link
          to="/assessments"
          className="bg-[#0E1018] border border-white/[0.07] rounded-lg p-2.5 flex items-center justify-center text-[#8E8FA8] hover:text-[#F0F0F5] hover:border-amber-500/20 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#F0F0F5] mb-1">
            Create New Assessment
          </h1>
          <p className="font-sans text-sm text-[#8E8FA8]">
            Step <span className="font-mono">{step}</span> of{' '}
            <span className="font-mono">3</span> —{' '}
            {step === 1
              ? 'Assessment Type'
              : step === 2
              ? formData.type === 'vendor'
                ? 'Select Vendor'
                : 'Assessment Details'
              : 'Assessment Details'}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-6 mb-7">
        <div className="flex items-center">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex items-center ${s < 3 ? 'flex-1' : ''}`}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-mono text-base font-semibold transition-all duration-300 ${
                  s <= step
                    ? 'bg-amber-500 text-[#08090E]'
                    : 'bg-[#08090E] text-[#55576A]'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-1 mx-3 rounded-full transition-all duration-300 ${
                    s < step ? 'bg-amber-500' : 'bg-white/[0.07]'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Assessment Type */}
      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Organization Assessment */}
          <button
            onClick={() => handleTypeSelect('organization')}
            className="bg-[#0E1018] border-2 border-white/[0.07] rounded-xl p-9 text-center cursor-pointer transition-all hover:border-amber-500/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/5 group"
          >
            <Building2 className="w-16 h-16 text-amber-500/70 mx-auto mb-5 group-hover:text-amber-400 transition-colors" />
            <h2 className="font-display text-lg font-semibold text-[#F0F0F5] mb-2.5">
              Organization Assessment
            </h2>
            <p className="font-sans text-sm text-[#8E8FA8] leading-relaxed">
              Assess your organization's cybersecurity posture against NIST CSF 2.0 framework
            </p>
          </button>

          {/* Vendor Assessment */}
          <button
            onClick={() => handleTypeSelect('vendor')}
            className="bg-[#0E1018] border-2 border-white/[0.07] rounded-xl p-9 text-center cursor-pointer transition-all hover:border-purple-500/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/5 group"
          >
            <ClipboardCheck className="w-16 h-16 text-purple-400/70 mx-auto mb-5 group-hover:text-purple-400 transition-colors" />
            <h2 className="font-display text-lg font-semibold text-[#F0F0F5] mb-2.5">
              Vendor Assessment
            </h2>
            <p className="font-sans text-sm text-[#8E8FA8] leading-relaxed">
              Evaluate a third-party vendor's security controls and compliance posture
            </p>
          </button>
        </div>
      )}

      {/* Step 2: Vendor Selection (only for vendor assessments) */}
      {step === 2 && formData.type === 'vendor' && (
        <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-7">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-[3px] h-4 bg-amber-500 rounded-full flex-shrink-0" />
            <h2 className="font-display text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8E8FA8]">
              Select Vendor
            </h2>
          </div>

          {loadingVendors ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-[72px] bg-white/[0.04] rounded-lg" />
              ))}
            </div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-sans text-sm text-[#55576A] mb-5">
                No vendors found. Create a vendor first.
              </p>
              <Link
                to="/vendors"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-[#08090E] font-display text-sm font-semibold rounded-lg hover:bg-amber-400 transition-colors"
              >
                Go to Vendors
              </Link>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {vendors.map((vendor) => {
                const isSelected = formData.vendorId === vendor.id;
                return (
                  <label
                    key={vendor.id}
                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-500/60 bg-amber-500/[0.05]'
                        : 'border-white/[0.07] bg-[#0E1018] hover:border-white/[0.12] hover:bg-[#13151F]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="vendor"
                      value={vendor.id}
                      checked={isSelected}
                      onChange={(e) => handleVendorSelect(e.target.value)}
                      className="w-4 h-4 accent-amber-500 cursor-pointer"
                    />
                    <div className="flex-1 ml-4">
                      <p className="font-sans text-sm font-semibold text-[#F0F0F5]">{vendor.name}</p>
                      <p className="font-sans text-xs text-[#55576A] mt-0.5">
                        {vendor.website || vendor.contact_email}
                      </p>
                    </div>
                    {vendor.risk_level && (
                      <span className={`font-mono text-[10px] font-medium px-2 py-0.5 rounded ${getRiskBadgeClass(vendor.risk_level)}`}>
                        {vendor.risk_level} risk
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          )}

          <div className="flex justify-between pt-6 border-t border-white/[0.06]">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0E1018] text-[#8E8FA8] border border-white/[0.07] rounded-lg font-sans text-sm font-medium hover:text-[#F0F0F5] hover:border-white/[0.12] transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-display text-sm font-semibold transition-all ${
                canProceed()
                  ? 'bg-amber-500 text-[#08090E] hover:bg-amber-400'
                  : 'bg-white/[0.04] text-[#55576A] cursor-not-allowed'
              }`}
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2 for organization assessments - auto-advance to step 3 */}
      {step === 2 && formData.type === 'organization' && (
        <div style={{ display: 'none' }}>{setTimeout(() => setStep(3), 0)}</div>
      )}

      {/* Step 3: Assessment Details */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-7">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-[3px] h-4 bg-amber-500 rounded-full flex-shrink-0" />
            <h2 className="font-display text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8E8FA8]">
              Assessment Details
            </h2>
          </div>

          <div className="space-y-6">
            {/* Assessment Name */}
            <div>
              <label className="block font-display text-[10px] tracking-[0.12em] uppercase text-[#8E8FA8] font-semibold mb-2">
                Assessment Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Q1 2024 Security Assessment"
                required
                className="w-full px-3 py-2.5 font-sans text-sm text-[#F0F0F5] bg-white/[0.04] border border-white/[0.07] rounded-lg outline-none transition-all placeholder:text-[#55576A] focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block font-display text-[10px] tracking-[0.12em] uppercase text-[#8E8FA8] font-semibold mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Optional: Add notes about the scope and purpose of this assessment"
                rows={4}
                className="w-full px-3 py-2.5 font-sans text-sm text-[#F0F0F5] bg-white/[0.04] border border-white/[0.07] rounded-lg outline-none transition-all resize-y placeholder:text-[#55576A] focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20"
              />
            </div>

            {/* Summary */}
            <div className="bg-[#13151F] border border-white/[0.05] rounded-lg p-5">
              <h3 className="font-display text-[10px] tracking-[0.12em] uppercase text-[#8E8FA8] font-semibold mb-4">
                Assessment Summary
              </h3>
              <div className="space-y-3 font-sans text-sm">
                <div className="flex justify-between">
                  <span className="text-[#55576A]">Type</span>
                  <span className="font-medium text-[#F0F0F5]">
                    {formData.type === 'organization' ? 'Organization Assessment' : 'Vendor Assessment'}
                  </span>
                </div>
                {formData.type === 'vendor' && formData.vendorId && (
                  <div className="flex justify-between">
                    <span className="text-[#55576A]">Vendor</span>
                    <span className="font-medium text-[#F0F0F5]">
                      {vendors.find((v) => v.id === formData.vendorId)?.name}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#55576A]">Framework</span>
                  <span className="font-medium text-[#F0F0F5]">NIST CSF 2.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#55576A]">Subcategories</span>
                  <span className="font-mono font-medium text-amber-400">
                    120 <span className="text-[#55576A] font-sans font-normal">(across 6 functions)</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-6 mt-6 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0E1018] text-[#8E8FA8] border border-white/[0.07] rounded-lg font-sans text-sm font-medium hover:text-[#F0F0F5] hover:border-white/[0.12] transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-display text-sm font-semibold transition-all ${
                loading
                  ? 'bg-white/[0.04] text-[#55576A] cursor-not-allowed'
                  : 'bg-amber-500 text-[#08090E] hover:bg-amber-400'
              }`}
            >
              {loading ? 'Creating...' : 'Create Assessment'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

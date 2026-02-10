/**
 * New Assessment Page (Wizard)
 * Multi-step wizard for creating organization or vendor assessments
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

export default function NewAssessment() {
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
    // Validation for step 2 (vendor selection)
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

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link to="/assessments" className="btn btn-secondary">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Assessment</h1>
          <p className="text-gray-500 mt-1">
            Step {step} of 3 - {step === 1 ? 'Assessment Type' : step === 2 ? formData.type === 'vendor' ? 'Select Vendor' : 'Assessment Details' : 'Assessment Details'}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card card-body">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  s <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div className={`flex-1 h-1 mx-2 ${s < step ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Assessment Type */}
      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => handleTypeSelect('organization')}
            className="card card-body p-8 text-center hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500"
          >
            <Building2 className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Organization Assessment</h2>
            <p className="text-gray-600">
              Assess your organization's cybersecurity posture against NIST CSF 2.0 framework
            </p>
          </button>

          <button
            onClick={() => handleTypeSelect('vendor')}
            className="card card-body p-8 text-center hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500"
          >
            <ClipboardCheck className="w-16 h-16 text-purple-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Vendor Assessment</h2>
            <p className="text-gray-600">
              Evaluate a third-party vendor's security controls and compliance posture
            </p>
          </button>
        </div>
      )}

      {/* Step 2: Vendor Selection (only for vendor assessments) or Skip to Details */}
      {step === 2 && formData.type === 'vendor' && (
        <div className="card card-body">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Vendor</h2>
          {loadingVendors ? (
            <div className="text-center py-8 text-gray-500">Loading vendors...</div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No vendors found. Create a vendor first.</p>
              <Link to="/vendors" className="btn btn-primary">
                Go to Vendors
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {vendors.map((vendor) => (
                <label
                  key={vendor.id}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.vendorId === vendor.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="vendor"
                    value={vendor.id}
                    checked={formData.vendorId === vendor.id}
                    onChange={(e) => handleVendorSelect(e.target.value)}
                    className="w-5 h-5 text-blue-600"
                  />
                  <div className="ml-4 flex-1">
                    <p className="font-semibold text-gray-900">{vendor.name}</p>
                    <p className="text-sm text-gray-600">{vendor.website || vendor.contact_email}</p>
                  </div>
                  {vendor.risk_level && (
                    <span
                      className={`badge ${
                        vendor.risk_level === 'high'
                          ? 'badge-red'
                          : vendor.risk_level === 'medium'
                          ? 'badge-yellow'
                          : 'badge-green'
                      }`}
                    >
                      {vendor.risk_level} risk
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-6">
            <button onClick={handleBack} className="btn btn-secondary">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`btn btn-primary ${!canProceed() ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Next
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2 for organization assessments - skip directly to step 3 */}
      {step === 2 && formData.type === 'organization' && (
        <div className="hidden">
          {/* Auto-advance to step 3 */}
          {setTimeout(() => setStep(3), 0)}
        </div>
      )}

      {/* Step 3: Assessment Details */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="card card-body">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Assessment Details</h2>

          <div className="space-y-6">
            <div>
              <label className="form-label">Assessment Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Q1 2024 Security Assessment"
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="form-label">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Optional: Add notes about the scope and purpose of this assessment"
                rows={4}
                className="form-textarea"
              />
            </div>

            {/* Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Assessment Summary</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Type:</dt>
                  <dd className="font-medium text-gray-900">
                    {formData.type === 'organization' ? 'Organization Assessment' : 'Vendor Assessment'}
                  </dd>
                </div>
                {formData.type === 'vendor' && formData.vendorId && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Vendor:</dt>
                    <dd className="font-medium text-gray-900">
                      {vendors.find((v) => v.id === formData.vendorId)?.name}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-gray-600">Framework:</dt>
                  <dd className="font-medium text-gray-900">NIST CSF 2.0</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Subcategories:</dt>
                  <dd className="font-medium text-gray-900">120 (across 6 functions)</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
            <button type="button" onClick={handleBack} className="btn btn-secondary">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Creating...' : 'Create Assessment'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

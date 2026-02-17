/**
 * VendorNew - Form for creating a new vendor
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { vendorsApi, type CreateVendorData } from '../api/vendors';
import { getErrorMessage } from '../api/client';

interface FormErrors {
  name?: string;
  contact_email?: string;
}

const industries = [
  'Technology',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Energy',
  'Government',
  'Education',
  'Other',
];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass = "w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.07] rounded-lg font-sans text-sm text-[#F0F0F5] placeholder-[#55576A] focus:outline-none focus:border-amber-500/40 transition-colors";
const inputErrorClass = "w-full px-3 py-2.5 bg-white/[0.04] border border-red-500/40 rounded-lg font-sans text-sm text-[#F0F0F5] placeholder-[#55576A] focus:outline-none focus:border-red-500/60 transition-colors";
const selectClass = "w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.07] rounded-lg font-sans text-sm text-[#F0F0F5] focus:outline-none focus:border-amber-500/40 transition-colors appearance-none cursor-pointer";

export default function VendorNew() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [form, setForm] = useState({
    name: '',
    industry: '',
    website: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    criticality_level: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    vendor_status: 'active' as 'active' | 'inactive' | 'under_review' | 'terminated',
    notes: '',
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.name.trim()) {
      newErrors.name = 'Vendor name is required';
    }

    if (form.contact_email && !emailRegex.test(form.contact_email)) {
      newErrors.contact_email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setSubmitting(true);
      const data: CreateVendorData = {
        name: form.name.trim(),
      };
      if (form.industry) data.industry = form.industry;
      if (form.website) data.website = form.website;
      if (form.contact_name) data.contact_name = form.contact_name;
      if (form.contact_email) data.contact_email = form.contact_email;
      if (form.contact_phone) data.contact_phone = form.contact_phone;
      if (form.criticality_level) data.criticality_level = form.criticality_level;
      if (form.vendor_status) data.vendor_status = form.vendor_status;
      if (form.notes) data.notes = form.notes;

      await vendorsApi.create(data);
      navigate('/vendors');
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/vendors"
          className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-[#55576A] hover:text-[#F0F0F5] hover:border-amber-500/30 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#F0F0F5]">Add New Vendor</h1>
          <p className="font-sans text-sm text-[#8E8FA8] mt-0.5">Register a new third-party vendor</p>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-[#0E1018] border border-white/[0.07] rounded-xl overflow-hidden">
        {/* Section 1: Basic Information */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-[3px] h-4 bg-amber-500 rounded-full flex-shrink-0" />
            <h2 className="font-display text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8E8FA8]">
              Basic Information
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Vendor Name */}
            <div className="space-y-1.5">
              <label className="font-display text-[10px] tracking-[0.08em] uppercase text-[#8E8FA8] font-semibold">
                Vendor Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Enter vendor name"
                className={errors.name ? inputErrorClass : inputClass}
              />
              {errors.name && (
                <p className="font-sans text-[11px] text-red-400">{errors.name}</p>
              )}
            </div>

            {/* Industry */}
            <div className="space-y-1.5">
              <label className="font-display text-[10px] tracking-[0.08em] uppercase text-[#8E8FA8] font-semibold">Industry</label>
              <select
                value={form.industry}
                onChange={(e) => updateField('industry', e.target.value)}
                className={selectClass}
              >
                <option value="" className="bg-[#0E1018]">Select industry</option>
                {industries.map((ind) => (
                  <option key={ind} value={ind} className="bg-[#0E1018]">{ind}</option>
                ))}
              </select>
            </div>

            {/* Website */}
            <div className="space-y-1.5">
              <label className="font-display text-[10px] tracking-[0.08em] uppercase text-[#8E8FA8] font-semibold">Website</label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => updateField('website', e.target.value)}
                placeholder="https://example.com"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Contact Information */}
        <div className="px-6 pb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-[3px] h-4 bg-amber-500 rounded-full flex-shrink-0" />
            <h2 className="font-display text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8E8FA8]">
              Contact Information
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Contact Name */}
            <div className="space-y-1.5">
              <label className="font-display text-[10px] tracking-[0.08em] uppercase text-[#8E8FA8] font-semibold">Contact Name</label>
              <input
                type="text"
                value={form.contact_name}
                onChange={(e) => updateField('contact_name', e.target.value)}
                placeholder="John Doe"
                className={inputClass}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="font-display text-[10px] tracking-[0.08em] uppercase text-[#8E8FA8] font-semibold">Email</label>
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => updateField('contact_email', e.target.value)}
                placeholder="contact@vendor.com"
                className={errors.contact_email ? inputErrorClass : inputClass}
              />
              {errors.contact_email && (
                <p className="font-sans text-[11px] text-red-400">{errors.contact_email}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="font-display text-[10px] tracking-[0.08em] uppercase text-[#8E8FA8] font-semibold">Phone</label>
              <input
                type="text"
                value={form.contact_phone}
                onChange={(e) => updateField('contact_phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Risk Management */}
        <div className="px-6 pb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-[3px] h-4 bg-amber-500 rounded-full flex-shrink-0" />
            <h2 className="font-display text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8E8FA8]">
              Risk Management
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Criticality Level */}
            <div className="space-y-1.5">
              <label className="font-display text-[10px] tracking-[0.08em] uppercase text-[#8E8FA8] font-semibold">Criticality Level</label>
              <select
                value={form.criticality_level}
                onChange={(e) => updateField('criticality_level', e.target.value)}
                className={selectClass}
              >
                <option value="low" className="bg-[#0E1018]">Low</option>
                <option value="medium" className="bg-[#0E1018]">Medium</option>
                <option value="high" className="bg-[#0E1018]">High</option>
                <option value="critical" className="bg-[#0E1018]">Critical</option>
              </select>
            </div>

            {/* Vendor Status */}
            <div className="space-y-1.5">
              <label className="font-display text-[10px] tracking-[0.08em] uppercase text-[#8E8FA8] font-semibold">Vendor Status</label>
              <select
                value={form.vendor_status}
                onChange={(e) => updateField('vendor_status', e.target.value)}
                className={selectClass}
              >
                <option value="active" className="bg-[#0E1018]">Active</option>
                <option value="inactive" className="bg-[#0E1018]">Inactive</option>
                <option value="under_review" className="bg-[#0E1018]">Under Review</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Notes */}
        <div className="px-6 pb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-[3px] h-4 bg-amber-500 rounded-full flex-shrink-0" />
            <h2 className="font-display text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8E8FA8]">
              Notes
            </h2>
          </div>
          <textarea
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            rows={4}
            placeholder="Any additional notes about this vendor..."
            className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.07] rounded-lg font-sans text-sm text-[#F0F0F5] placeholder-[#55576A] focus:outline-none focus:border-amber-500/40 transition-colors resize-none"
          />
        </div>

        {/* Form Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/[0.06] bg-white/[0.02]">
          <Link
            to="/vendors"
            className="inline-flex items-center px-4 py-2 bg-white/[0.04] border border-white/[0.07] text-[#8E8FA8] font-sans text-sm rounded-lg hover:border-white/[0.15] hover:text-[#F0F0F5] transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2 bg-amber-500 text-[#08090E] font-display text-sm font-semibold rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Vendor
          </button>
        </div>
      </form>
    </div>
  );
}

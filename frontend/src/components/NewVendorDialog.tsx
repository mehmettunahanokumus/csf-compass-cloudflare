import { useState } from 'react';
import { Plus, AlertCircle, X } from 'lucide-react';
import { vendorsApi, type CreateVendorData } from '../api/vendors';
import { getErrorMessage } from '../api/client';
import type { Vendor } from '../types';

interface NewVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (vendor: Vendor) => void;
}

export default function NewVendorDialog({ open, onOpenChange, onCreate }: NewVendorDialogProps) {
  const [formData, setFormData] = useState<CreateVendorData>({
    name: '',
    industry: '',
    website: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    criticality_level: 'medium',
    vendor_status: 'active',
    notes: '',
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      setError('Vendor name is required');
      return;
    }
    try {
      setCreating(true);
      setError(null);
      const vendor = await vendorsApi.create(formData);
      onCreate(vendor);
      handleClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      industry: '',
      website: '',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      criticality_level: 'medium',
      vendor_status: 'active',
      notes: '',
    });
    setError(null);
    onOpenChange(false);
  };

  if (!open) return null;

  const inputClass = "w-full bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2.5 font-sans text-sm text-[#F0F0F5] placeholder:text-[#55576A] outline-none transition-all focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20";
  const labelClass = "block font-display text-[10px] tracking-[0.12em] uppercase text-[#8E8FA8] font-semibold mb-1.5";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div
        className="bg-[#0E1018] border border-white/[0.07] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <h2 className="font-display text-lg font-bold text-[#F0F0F5]">Add New Vendor</h2>
          <button onClick={handleClose} className="text-[#55576A] hover:text-[#F0F0F5] transition-colors p-1 rounded-lg hover:bg-white/[0.04]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="font-sans text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-[3px] h-4 bg-amber-500 rounded-full flex-shrink-0" />
              <h3 className="font-display text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8E8FA8]">
                Basic Information
              </h3>
            </div>

            <div>
              <label className={labelClass}>Vendor Name <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Acme Corporation"
                className={inputClass}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Industry</label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="Technology, Finance, etc."
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-[3px] h-4 bg-amber-500 rounded-full flex-shrink-0" />
              <h3 className="font-display text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8E8FA8]">
                Contact Information
              </h3>
            </div>

            <div>
              <label className={labelClass}>Contact Name</label>
              <input
                type="text"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                placeholder="John Doe"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Contact Email</label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="contact@example.com"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Contact Phone</label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Vendor Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-[3px] h-4 bg-amber-500 rounded-full flex-shrink-0" />
              <h3 className="font-display text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8E8FA8]">
                Vendor Details
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Criticality Level</label>
                <select
                  value={formData.criticality_level}
                  onChange={(e) => setFormData({ ...formData, criticality_level: e.target.value as any })}
                  className={inputClass}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
                <p className="font-sans text-xs text-[#55576A] mt-1">
                  Impact level if this vendor experiences a security incident
                </p>
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select
                  value={formData.vendor_status}
                  onChange={(e) => setFormData({ ...formData, vendor_status: e.target.value as any })}
                  className={inputClass}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="under_review">Under Review</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this vendor..."
                rows={3}
                className={`${inputClass} resize-y`}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-5 border-t border-white/[0.06]">
            <button type="button" onClick={handleClose} disabled={creating} className="px-4 py-2.5 font-sans text-sm font-medium text-[#8E8FA8] border border-white/[0.07] rounded-lg hover:text-[#F0F0F5] hover:border-white/[0.12] transition-all disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={creating} className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-[#08090E] font-display text-sm font-semibold rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50">
              <Plus className="w-4 h-4" />
              {creating ? 'Creating...' : 'Create Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

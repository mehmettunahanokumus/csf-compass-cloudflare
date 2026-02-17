import { useState } from 'react';
import { Link2, Copy, Check, AlertCircle, X } from 'lucide-react';
import { vendorInvitationsApi } from '../api/vendor-invitations';
import type { SendInvitationResponse } from '../types';
import { getErrorMessage } from '../api/client';

interface InviteVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (response: SendInvitationResponse) => void;
  assessmentId: string;
  assessmentName: string;
  vendorEmail?: string;
  vendorName?: string;
}

export default function InviteVendorDialog({
  open,
  onOpenChange,
  onSend,
  assessmentId,
  assessmentName,
  vendorEmail = '',
  vendorName = '',
}: InviteVendorDialogProps) {
  const [email, setEmail] = useState(vendorEmail);
  const [contactName, setContactName] = useState(vendorName);
  const [expiryDays, setExpiryDays] = useState('30');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vendorLink, setVendorLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [invitationResponse, setInvitationResponse] = useState<SendInvitationResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Vendor email is required for your records');
      return;
    }
    try {
      setCreating(true);
      setError(null);
      const response = await vendorInvitationsApi.send({
        organization_assessment_id: assessmentId,
        vendor_contact_email: email,
        vendor_contact_name: contactName || undefined,
        token_expiry_days: Number(expiryDays),
      });
      setVendorLink(response.magic_link);
      setInvitationResponse(response);
      onSend(response);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!vendorLink) return;
    try {
      await navigator.clipboard.writeText(vendorLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleRevoke = async () => {
    if (!invitationResponse) return;
    if (!confirm('Are you sure you want to revoke this link?')) return;
    try {
      await vendorInvitationsApi.revoke(invitationResponse.invitation_id);
      handleClose();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleClose = () => {
    setEmail(vendorEmail);
    setContactName(vendorName);
    setExpiryDays('30');
    setError(null);
    setVendorLink(null);
    setInvitationResponse(null);
    setCopied(false);
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
          <h2 className="font-display text-lg font-bold text-[#F0F0F5]">
            {vendorLink ? 'Vendor Link Created' : 'Create Vendor Link'}
          </h2>
          <button onClick={handleClose} className="text-[#55576A] hover:text-[#F0F0F5] transition-colors p-1 rounded-lg hover:bg-white/[0.04]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {vendorLink ? (
            /* Success: Link created */
            <div className="space-y-5">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-display text-sm font-semibold text-emerald-400 mb-1">Link created successfully!</h3>
                  <p className="font-sans text-sm text-[#8E8FA8]">
                    Copy this link and send it to the vendor via email, Slack, or your preferred method.
                  </p>
                </div>
              </div>

              <div>
                <label className={labelClass}>Vendor Assessment Link (expires in {expiryDays} days)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={vendorLink}
                    readOnly
                    className={`${inputClass} font-mono text-xs`}
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-sans text-sm font-medium flex-shrink-0 transition-all ${
                      copied
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-white/[0.04] text-[#8E8FA8] border border-white/[0.07] hover:text-[#F0F0F5] hover:border-white/[0.12]'
                    }`}
                  >
                    {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy</>}
                  </button>
                </div>
                <p className="font-sans text-xs text-[#55576A] mt-2">
                  You can also access this link anytime from the assessment detail page.
                </p>
              </div>

              <div className="relative bg-[#13151F] border border-white/[0.05] rounded-lg p-4 overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-500 rounded-l-lg" />
                <h4 className="font-display text-sm font-semibold text-[#F0F0F5] mb-2 pl-2">Next Steps</h4>
                <ul className="space-y-1.5 pl-2">
                  {[
                    'Copy the link and send it to the vendor via email or Slack',
                    'The vendor can use this link multiple times (bookmark-friendly)',
                    'Once submitted, view the comparison to see differences',
                    `The link will expire in ${expiryDays} days`,
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 font-sans text-sm text-[#8E8FA8]">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400/60 mt-1.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between pt-5 border-t border-white/[0.06]">
                <button onClick={handleRevoke} className="font-sans text-sm font-medium text-red-400 hover:text-red-300 transition-colors">
                  Revoke Link
                </button>
                <button onClick={handleClose} className="px-5 py-2.5 bg-amber-500 text-[#08090E] font-display text-sm font-semibold rounded-lg hover:bg-amber-400 transition-colors">
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="font-sans text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="relative bg-[#13151F] border border-white/[0.05] rounded-lg p-4 overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-500 rounded-l-lg" />
                <p className="font-sans text-sm text-[#8E8FA8] pl-2">
                  <span className="text-[#F0F0F5] font-medium">Note:</span> This creates a reusable link that you'll manually send to the vendor. No email is sent automatically.
                </p>
              </div>

              <div>
                <label className={labelClass}>Assessment</label>
                <input type="text" value={assessmentName} readOnly className={`${inputClass} bg-white/[0.02]`} />
              </div>

              <div>
                <label className={labelClass}>Vendor Email <span className="text-red-400">*</span></label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vendor@example.com"
                  className={inputClass}
                  required
                />
                <p className="font-sans text-xs text-[#55576A] mt-1">For your records only — no email will be sent</p>
              </div>

              <div>
                <label className={labelClass}>Vendor Contact Name (Optional)</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="John Doe"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Link Expiration</label>
                <select value={expiryDays} onChange={(e) => setExpiryDays(e.target.value)} className={inputClass}>
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days (recommended)</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-5 border-t border-white/[0.06]">
                <button type="button" onClick={handleClose} disabled={creating} className="px-4 py-2.5 font-sans text-sm font-medium text-[#8E8FA8] border border-white/[0.07] rounded-lg hover:text-[#F0F0F5] hover:border-white/[0.12] transition-all disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-[#08090E] font-display text-sm font-semibold rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50">
                  <Link2 className="w-4 h-4" />
                  {creating ? 'Creating Link...' : 'Create Link'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

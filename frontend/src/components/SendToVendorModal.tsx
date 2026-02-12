/**
 * Create Vendor Link Modal
 * Modal for generating reusable vendor assessment links
 */

import { useState } from 'react';
import { X, Link2, Copy, Check, AlertCircle } from 'lucide-react';
import { vendorInvitationsApi } from '../api/vendor-invitations';
import type { SendInvitationResponse } from '../types';
import { getErrorMessage } from '../api/client';

interface SendToVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (response: SendInvitationResponse) => void;
  assessmentId: string;
  assessmentName: string;
  vendorEmail?: string;
  vendorName?: string;
}

export default function SendToVendorModal({
  isOpen,
  onClose,
  onSend,
  assessmentId,
  assessmentName,
  vendorEmail = '',
  vendorName = '',
}: SendToVendorModalProps) {
  const [email, setEmail] = useState(vendorEmail);
  const [contactName, setContactName] = useState(vendorName);
  const [expiryDays, setExpiryDays] = useState(30);
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
        token_expiry_days: expiryDays,
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
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleRevoke = async () => {
    if (!invitationResponse) return;

    if (!confirm('Are you sure you want to revoke this link? The vendor will no longer be able to access the assessment.')) {
      return;
    }

    try {
      await vendorInvitationsApi.revoke(invitationResponse.invitation_id);
      alert('Link revoked successfully');
      handleClose();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleClose = () => {
    setEmail(vendorEmail);
    setContactName(vendorName);
    setExpiryDays(30);
    setError(null);
    setVendorLink(null);
    setInvitationResponse(null);
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {vendorLink ? 'Vendor Link Created' : 'Create Vendor Link'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Success State - Show Vendor Link */}
          {vendorLink ? (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-green-900 mb-1">
                    Link created successfully!
                  </h3>
                  <p className="text-sm text-green-700">
                    Copy this link and send it to the vendor via email, Slack, or your preferred communication method.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor Assessment Link (expires in {expiryDays} days)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={vendorLink}
                    readOnly
                    className="flex-1 input font-mono text-sm"
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <button
                    onClick={handleCopyLink}
                    className="btn btn-secondary flex-shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 You can also access this link anytime from the assessment detail page by clicking "Show Vendor Link"
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Next Steps:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Copy the link above using the "Copy Link" button</li>
                  <li>• Send it to the vendor via email, Slack, Teams, or any other method you prefer</li>
                  <li>• The vendor can use this link multiple times (bookmark-friendly)</li>
                  <li>• Once submitted, view the comparison to see differences in your assessments</li>
                  <li>• The link will expire in {expiryDays} days</li>
                </ul>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={handleRevoke}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Revoke Link
                </button>
                <button onClick={handleClose} className="btn btn-primary">
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> This creates a reusable link that you'll manually send to the vendor.
                  No email is sent automatically - you choose how to deliver it.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assessment
                </label>
                <input
                  type="text"
                  value={assessmentName}
                  readOnly
                  className="input bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vendor@example.com"
                  className="input"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  For your records only - no email will be sent
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor Contact Name (Optional)
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="John Doe"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link Expiration
                </label>
                <select
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(Number(e.target.value))}
                  className="input"
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days (recommended)</option>
                  <option value={60}>60 days</option>
                  <option value={90}>90 days</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn btn-secondary"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating}
                >
                  <Link2 className="w-4 h-4 mr-2" />
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

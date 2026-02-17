import { useState } from 'react';
import { Link2, Copy, Check, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {vendorLink ? 'Vendor Link Created' : 'Create Vendor Link'}
          </DialogTitle>
        </DialogHeader>

        {vendorLink ? (
          /* Step 2: Link created - show result */
          <div className="space-y-5 pt-2">
            <Alert className="border-green-200 bg-green-50 dark:bg-green-900/10">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-300">
                <span className="font-semibold">Link created successfully!</span>
                <p className="mt-1 text-sm">
                  Copy this link and send it to the vendor via email, Slack, or your preferred method.
                </p>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Vendor Assessment Link (expires in {expiryDays} days)</Label>
              <div className="flex gap-2">
                <Input
                  value={vendorLink}
                  readOnly
                  className="font-mono text-sm"
                  onClick={(e) => e.currentTarget.select()}
                />
                <Button type="button" variant="outline" onClick={handleCopyLink} className="flex-shrink-0">
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                You can also access this link anytime from the assessment detail page.
              </p>
            </div>

            <Alert>
              <AlertDescription>
                <span className="font-semibold">Next Steps:</span>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>• Copy the link and send it to the vendor via email or Slack</li>
                  <li>• The vendor can use this link multiple times (bookmark-friendly)</li>
                  <li>• Once submitted, view the comparison to see differences</li>
                  <li>• The link will expire in {expiryDays} days</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-between pt-4 border-t">
              <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={handleRevoke}>
                Revoke Link
              </Button>
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        ) : (
          /* Step 1: Form */
          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Alert>
              <AlertDescription className="text-sm">
                <strong>Note:</strong> This creates a reusable link that you'll manually send to the vendor.
                No email is sent automatically.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Assessment</Label>
              <Input value={assessmentName} readOnly className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor-email">
                Vendor Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="vendor-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vendor@example.com"
                required
              />
              <p className="text-xs text-muted-foreground">For your records only — no email will be sent</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-name">Vendor Contact Name (Optional)</Label>
              <Input
                id="contact-name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry">Link Expiration</Label>
              <Select value={expiryDays} onValueChange={setExpiryDays}>
                <SelectTrigger id="expiry">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days (recommended)</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleClose} disabled={creating}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                <Link2 className="h-4 w-4 mr-2" />
                {creating ? 'Creating Link...' : 'Create Link'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

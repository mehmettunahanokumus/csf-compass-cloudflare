/**
 * Vendor Portal Page
 * Public page for vendors to complete self-assessments via magic link
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, Circle, Ban, AlertCircle, Send } from 'lucide-react';
import { vendorInvitationsApi } from '../api/vendor-invitations';
import { csfApi } from '../api/csf';
import type {
  ValidateTokenResponse,
  Assessment,
  AssessmentItem,
  CsfFunction,
} from '../types';
import { getErrorMessage, formatDate } from '../api/client';

export default function VendorPortal() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationData, setValidationData] = useState<ValidateTokenResponse | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [items, setItems] = useState<AssessmentItem[]>([]);
  const [functions, setFunctions] = useState<CsfFunction[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    if (token) {
      validateToken();
    }
  }, [token]);

  const validateToken = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const data = await vendorInvitationsApi.validate(token);

      if (!data.valid) {
        setError(data.error || 'Invalid or expired invitation link');
        return;
      }

      setValidationData(data);
      setAssessment(data.assessment || null);
      setCompleted(data.invitation?.invitation_status === 'completed');

      // Load CSF functions and assessment items
      if (data.assessment && token) {
        await loadAssessmentData(token);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadAssessmentData = async (tokenValue: string) => {
    try {
      setLoadingItems(true);

      // Load CSF functions
      const functionsData = await csfApi.getFunctions();
      setFunctions(functionsData);

      // Set first function as default
      if (functionsData.length > 0) {
        setSelectedFunction(functionsData[0].id);
      }

      // Load assessment items
      const itemsData = await vendorInvitationsApi.getItems(tokenValue);
      setItems(itemsData);
    } catch (err) {
      console.error('Failed to load assessment data:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoadingItems(false);
    }
  };

  const handleStatusChange = async (itemId: string, status: string) => {
    if (!token) return;

    try {
      const updatedItem = await vendorInvitationsApi.updateItem(token, itemId, {
        status: status as 'compliant' | 'partial' | 'non_compliant' | 'not_assessed' | 'not_applicable'
      });

      // Update item in state
      setItems((prevItems) =>
        prevItems.map((item) => (item.id === itemId ? updatedItem : item))
      );
    } catch (err) {
      console.error('Failed to update item:', err);
      alert(getErrorMessage(err));
    }
  };

  const handleSubmit = async () => {
    if (!token) return;

    if (!confirm('Are you sure you want to submit this assessment? You will not be able to make changes after submission.')) {
      return;
    }

    try {
      setSubmitting(true);
      await vendorInvitationsApi.complete(token);
      setCompleted(true);
      alert('Assessment submitted successfully!');
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'partial':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'non_compliant':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'not_applicable':
        return <Ban className="w-5 h-5 text-gray-400" />;
      default:
        return <Circle className="w-5 h-5 text-gray-300" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return <span className="badge bg-green-100 text-green-800">Compliant</span>;
      case 'partial':
        return <span className="badge bg-yellow-100 text-yellow-800">Partial</span>;
      case 'non_compliant':
        return <span className="badge bg-red-100 text-red-800">Non-Compliant</span>;
      case 'not_applicable':
        return <span className="badge bg-gray-100 text-gray-600">N/A</span>;
      default:
        return <span className="badge bg-gray-100 text-gray-600">Not Assessed</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 text-lg">Validating invitation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="flex items-center space-x-3 text-red-600 mb-4">
            <XCircle className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Invalid Invitation</h1>
          </div>
          <p className="text-gray-700 mb-6">{error}</p>
          <div className="text-sm text-gray-500">
            Please contact the organization that sent you this invitation for assistance.
          </div>
        </div>
      </div>
    );
  }

  if (!validationData || !assessment) {
    return null;
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Assessment Completed</h1>
          <p className="text-gray-600 mb-6">
            Thank you for completing the cybersecurity assessment. Your responses have been submitted successfully.
          </p>
          <div className="text-sm text-gray-500">
            Completed on {formatDate(validationData.invitation?.completed_at || undefined)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{assessment.name}</h1>
              <p className="text-gray-500 mt-1">
                Vendor Self-Assessment Portal
                {validationData.vendor_contact_name && (
                  <> · Welcome, {validationData.vendor_contact_name}</>
                )}
              </p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn btn-primary"
            >
              <Send className="w-4 h-4 mr-2" />
              {submitting ? 'Submitting...' : 'Submit Assessment'}
            </button>
          </div>

          {validationData.invitation?.message && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">{validationData.invitation.message}</p>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-500">
            Expires on {formatDate(validationData.invitation?.token_expires_at)}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              NIST Cybersecurity Framework Assessment
            </h2>
            <p className="text-gray-600 mb-6">
              Please review each category and indicate your compliance status. You can save your progress and return later using the same link.
            </p>

            {/* Function Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                {functions.map((func) => (
                  <button
                    key={func.id}
                    onClick={() => setSelectedFunction(func.id)}
                    className={`
                      py-2 px-1 border-b-2 font-medium text-sm
                      ${
                        selectedFunction === func.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    {func.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Assessment Items */}
            <div className="space-y-4">
              {loadingItems ? (
                <div className="text-center text-gray-500 py-8">
                  Loading assessment items...
                </div>
              ) : items.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No assessment items found
                </div>
              ) : (
                <>
                  {items
                    .filter((item) => item.function?.id === selectedFunction)
                    .map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start space-x-3 flex-1">
                      {getStatusIcon(item.status)}
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {item.subcategory?.id} - {item.subcategory?.name}
                        </h3>
                        {item.subcategory?.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {item.subcategory.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>

                  {/* Status Selection */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleStatusChange(item.id, 'compliant')}
                      className={`btn btn-sm ${
                        item.status === 'compliant'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Compliant
                    </button>
                    <button
                      onClick={() => handleStatusChange(item.id, 'partial')}
                      className={`btn btn-sm ${
                        item.status === 'partial'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Partial
                    </button>
                    <button
                      onClick={() => handleStatusChange(item.id, 'non_compliant')}
                      className={`btn btn-sm ${
                        item.status === 'non_compliant'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Non-Compliant
                    </button>
                    <button
                      onClick={() => handleStatusChange(item.id, 'not_applicable')}
                      className={`btn btn-sm ${
                        item.status === 'not_applicable'
                          ? 'bg-gray-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Not Applicable
                    </button>
                  </div>
                </div>
              ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

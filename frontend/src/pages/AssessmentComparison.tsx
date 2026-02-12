/**
 * Assessment Comparison Page
 * Side-by-side comparison of organization assessment vs vendor self-assessment
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Circle, AlertCircle, Filter } from 'lucide-react';
import { vendorInvitationsApi } from '../api/vendor-invitations';
import type { ComparisonData } from '../types';
import { getErrorMessage, formatDate } from '../api/client';

type FilterType = 'all' | 'matches' | 'differences';

export default function AssessmentComparison() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ComparisonData | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadComparison();
    }
  }, [id]);

  const loadComparison = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const comparisonData = await vendorInvitationsApi.getComparison(id);
      setData(comparisonData);

      // Auto-select first function if available
      if (comparisonData.comparison_items.length > 0) {
        const firstFunction = comparisonData.comparison_items[0]?.function?.id;
        if (firstFunction) {
          setSelectedFunction(firstFunction);
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
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

  const getMatchBadge = (matches: boolean, vendorItem: any) => {
    if (!vendorItem) {
      return <span className="badge bg-gray-100 text-gray-600">Not Assessed</span>;
    }
    if (matches) {
      return <span className="badge bg-green-100 text-green-800">✓ Match</span>;
    }
    return <span className="badge bg-yellow-100 text-yellow-800">⚠ Difference</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading comparison...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (!data || !data.organization_assessment) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Comparison data not available</p>
      </div>
    );
  }

  // Get unique functions
  const functions = Array.from(
    new Map(
      data.comparison_items
        .filter((item) => item.function)
        .map((item) => [item.function!.id, item.function!])
    ).values()
  );

  // Filter items
  let filteredItems = data.comparison_items;

  // Filter by function
  if (selectedFunction) {
    filteredItems = filteredItems.filter((item) => item.function?.id === selectedFunction);
  }

  // Filter by match/difference
  if (filter === 'matches') {
    filteredItems = filteredItems.filter((item) => item.matches && item.vendor_item);
  } else if (filter === 'differences') {
    filteredItems = filteredItems.filter((item) => !item.matches || !item.vendor_item);
  }

  // Calculate statistics
  const totalItems = data.comparison_items.length;
  const assessedByVendor = data.comparison_items.filter((item) => item.vendor_item).length;
  const matches = data.comparison_items.filter((item) => item.matches && item.vendor_item).length;
  const differences = data.comparison_items.filter(
    (item) => !item.matches && item.vendor_item
  ).length;
  const notAssessed = totalItems - assessedByVendor;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            <Link to={`/assessments/${id}`} className="hover:text-gray-700 flex items-center">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Assessment
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Assessment Comparison</h1>
          <p className="text-gray-500 mt-1">{data.organization_assessment.name}</p>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card card-body">
          <div className="text-sm text-gray-500">Total Items</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{totalItems}</div>
        </div>
        <div className="card card-body">
          <div className="text-sm text-gray-500">Matches</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{matches}</div>
        </div>
        <div className="card card-body">
          <div className="text-sm text-gray-500">Differences</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">{differences}</div>
        </div>
        <div className="card card-body">
          <div className="text-sm text-gray-500">Not Assessed</div>
          <div className="text-2xl font-bold text-gray-400 mt-1">{notAssessed}</div>
        </div>
      </div>

      {/* Invitation Status */}
      {data.invitation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900">Vendor Self-Assessment Status</h3>
              <p className="text-sm text-blue-700 mt-1">
                Invitation sent to {data.invitation.vendor_contact_email} on{' '}
                {formatDate(data.invitation.sent_at)}
              </p>
            </div>
            <div>
              {data.invitation.invitation_status === 'completed' ? (
                <span className="badge bg-green-100 text-green-800">Completed</span>
              ) : data.invitation.invitation_status === 'accessed' ? (
                <span className="badge bg-yellow-100 text-yellow-800">In Progress</span>
              ) : (
                <span className="badge bg-gray-100 text-gray-600">
                  {data.invitation.invitation_status}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filter:</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded text-sm ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Items ({totalItems})
                </button>
                <button
                  onClick={() => setFilter('matches')}
                  className={`px-3 py-1 rounded text-sm ${
                    filter === 'matches'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Matches ({matches})
                </button>
                <button
                  onClick={() => setFilter('differences')}
                  className={`px-3 py-1 rounded text-sm ${
                    filter === 'differences'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Differences ({differences + notAssessed})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Function Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-4">
            {functions.map((func) => (
              <button
                key={func.id}
                onClick={() => setSelectedFunction(func.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  selectedFunction === func.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {func.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                  Subcategory
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                  Your Assessment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                  Vendor Self-Assessment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No items to display
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.subcategory_id}
                    className={
                      item.vendor_item && !item.matches ? 'bg-yellow-50' : undefined
                    }
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {item.subcategory?.id}
                      </div>
                      <div className="text-sm text-gray-500">{item.subcategory?.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(item.org_item.status)}
                        {getStatusBadge(item.org_item.status)}
                      </div>
                      {item.org_item.notes && (
                        <div className="text-xs text-gray-500 mt-1">
                          {item.org_item.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {item.vendor_item ? (
                        <>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(item.vendor_item.status)}
                            {getStatusBadge(item.vendor_item.status)}
                          </div>
                          {item.vendor_item.notes && (
                            <div className="text-xs text-gray-500 mt-1">
                              {item.vendor_item.notes}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Not assessed</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getMatchBadge(item.matches, item.vendor_item)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

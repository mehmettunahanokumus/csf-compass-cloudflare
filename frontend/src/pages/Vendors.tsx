/**
 * Vendors List Page
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Building2 } from 'lucide-react';
import { vendorsApi } from '../api/vendors';
import type { Vendor } from '../types';
import { getErrorMessage, formatDate } from '../api/client';

export default function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const data = await vendorsApi.list();
      setVendors(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter(
    (vendor) =>
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.industry?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading vendors...</div>
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

  const getCriticalityColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'badge-red';
      case 'high':
        return 'badge-yellow';
      case 'medium':
        return 'badge-blue';
      default:
        return 'badge-gray';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-500 mt-1">Manage your third-party vendors</p>
        </div>
        <button className="btn btn-primary">
          <Plus className="w-5 h-5 mr-2" />
          New Vendor
        </button>
      </div>

      {/* Search */}
      <div className="card card-body">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-10"
          />
        </div>
      </div>

      {/* Vendors List */}
      {filteredVendors.length === 0 ? (
        <div className="card card-body text-center py-12">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No vendors found</p>
          <button className="btn btn-primary mx-auto">Add Your First Vendor</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map((vendor) => (
            <Link
              key={vendor.id}
              to={`/vendors/${vendor.id}`}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="card-body">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{vendor.name}</h3>
                    {vendor.industry && (
                      <p className="text-sm text-gray-600 mt-1">{vendor.industry}</p>
                    )}
                  </div>
                  <span className={`badge ${getCriticalityColor(vendor.criticality_level || 'medium')}`}>
                    {vendor.criticality_level || 'medium'}
                  </span>
                </div>

                {vendor.contact_email && (
                  <p className="text-sm text-gray-600 mb-3">{vendor.contact_email}</p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {vendor.vendor_status?.replace('_', ' ') || 'active'}
                    </p>
                  </div>
                  {vendor.last_assessment_date && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Last Assessment</p>
                      <p className="text-sm text-gray-700">
                        {formatDate(vendor.last_assessment_date)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

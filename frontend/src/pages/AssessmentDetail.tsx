/**
 * Assessment Detail Page
 * Full assessment view with CSF functions, subcategories, evidence, and AI analysis
 */

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Upload, Brain } from 'lucide-react';
import { assessmentsApi } from '../api/assessments';
import { csfApi } from '../api/csf';
import { evidenceApi } from '../api/evidence';
import { aiApi } from '../api/ai';
import type { Assessment, AssessmentItem, CsfFunction } from '../types';
import { getErrorMessage, formatDate } from '../api/client';

export default function AssessmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [functions, setFunctions] = useState<CsfFunction[]>([]);
  const [items, setItems] = useState<AssessmentItem[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [analyzingItem, setAnalyzingItem] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (selectedFunction && id) {
      loadItems(selectedFunction);
    }
  }, [selectedFunction, id]);

  const loadData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [assessmentData, functionsData] = await Promise.all([
        assessmentsApi.get(id),
        csfApi.getFunctions(),
      ]);
      setAssessment(assessmentData);
      setFunctions(functionsData);

      if (functionsData.length > 0 && !selectedFunction) {
        setSelectedFunction(functionsData[0].id);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async (functionId: string) => {
    if (!id) return;

    try {
      const itemsData = await assessmentsApi.getItems(id, functionId);
      setItems(itemsData);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleStatusChange = async (itemId: string, status: string) => {
    if (!id) return;

    try {
      await assessmentsApi.updateItem(id, itemId, { status: status as any });
      // Reload items and assessment to get updated score
      await Promise.all([loadItems(selectedFunction), loadData()]);
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleFileUpload = async (itemId: string, file: File) => {
    if (!id) return;

    try {
      setUploadingFor(itemId);
      await evidenceApi.upload(file, id, itemId);
      alert('File uploaded successfully!');
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setUploadingFor(null);
    }
  };

  const handleAnalyze = async (item: AssessmentItem) => {
    if (!id) return;

    try {
      setAnalyzingItem(item.id);
      const result = await aiApi.analyzeEvidence({
        assessment_item_id: item.id,
        subcategory_code: item.subcategory?.id || '',
        subcategory_description: item.subcategory?.description || '',
        evidence_notes: item.notes || '',
        file_names: [],
        current_status: item.status || 'not_assessed',
      });

      alert(`AI Analysis Complete!\n\nSuggested Status: ${result.result.suggestedStatus}\nConfidence: ${(result.result.confidenceScore * 100).toFixed(0)}%\n\nReasoning: ${result.result.reasoning}`);

      // Reload items to show AI suggestions
      await loadItems(selectedFunction);
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setAnalyzingItem(null);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this assessment?')) return;

    try {
      await assessmentsApi.delete(id);
      navigate('/assessments');
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'badge-green';
      case 'partial':
        return 'badge-yellow';
      case 'non_compliant':
        return 'badge-red';
      case 'not_applicable':
        return 'badge-blue';
      default:
        return 'badge-gray';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading assessment...</div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error || 'Assessment not found'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/assessments" className="btn btn-secondary">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{assessment.name}</h1>
            <p className="text-gray-500 mt-1">
              Created {formatDate(assessment.created_at)} • Score: {assessment.overall_score?.toFixed(1) || '0.0'}%
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`badge ${getStatusColor(assessment.status)}`}>
            {assessment.status.replace('_', ' ')}
          </span>
          <button onClick={handleDelete} className="btn btn-danger btn-sm">
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </button>
        </div>
      </div>

      {/* Stats */}
      {assessment.stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card card-body text-center">
            <p className="text-2xl font-bold text-green-600">{assessment.stats.compliant}</p>
            <p className="text-sm text-gray-600">Compliant</p>
          </div>
          <div className="card card-body text-center">
            <p className="text-2xl font-bold text-yellow-600">{assessment.stats.partial}</p>
            <p className="text-sm text-gray-600">Partial</p>
          </div>
          <div className="card card-body text-center">
            <p className="text-2xl font-bold text-red-600">{assessment.stats.nonCompliant}</p>
            <p className="text-sm text-gray-600">Non-Compliant</p>
          </div>
          <div className="card card-body text-center">
            <p className="text-2xl font-bold text-gray-600">{assessment.stats.notAssessed}</p>
            <p className="text-sm text-gray-600">Not Assessed</p>
          </div>
          <div className="card card-body text-center">
            <p className="text-2xl font-bold text-blue-600">{assessment.stats.notApplicable}</p>
            <p className="text-sm text-gray-600">Not Applicable</p>
          </div>
        </div>
      )}

      {/* Function Tabs */}
      <div className="card">
        <div className="card-body">
          <div className="flex space-x-2 overflow-x-auto">
            {functions.map((func) => (
              <button
                key={func.id}
                onClick={() => setSelectedFunction(func.id)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                  selectedFunction === func.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {func.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="card">
            <div className="card-body">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.subcategory?.id}</h3>
                  <p className="text-sm text-gray-600 mt-1">{item.subcategory?.description}</p>
                  {item.ai_suggested_status && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-900">
                        <Brain className="w-4 h-4 inline mr-1" />
                        AI Suggestion: <strong>{item.ai_suggested_status}</strong> ({(item.ai_confidence_score! * 100).toFixed(0)}% confidence)
                      </p>
                      {item.ai_reasoning && (
                        <p className="text-xs text-blue-700 mt-1">{item.ai_reasoning}</p>
                      )}
                    </div>
                  )}
                </div>
                <span className={`badge ${getStatusColor(item.status || 'not_assessed')}`}>
                  {item.status?.replace('_', ' ') || 'not assessed'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Status</label>
                  <select
                    value={item.status || 'not_assessed'}
                    onChange={(e) => handleStatusChange(item.id, e.target.value)}
                    className="form-select"
                  >
                    <option value="not_assessed">Not Assessed</option>
                    <option value="compliant">Compliant</option>
                    <option value="partial">Partially Compliant</option>
                    <option value="non_compliant">Non-Compliant</option>
                    <option value="not_applicable">Not Applicable</option>
                  </select>
                </div>

                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <label className="form-label">Evidence Upload</label>
                    <label className="btn btn-secondary w-full cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingFor === item.id ? 'Uploading...' : 'Upload File'}
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleFileUpload(item.id, e.target.files[0]);
                          }
                        }}
                        disabled={uploadingFor === item.id}
                      />
                    </label>
                  </div>
                  <button
                    onClick={() => handleAnalyze(item)}
                    disabled={analyzingItem === item.id}
                    className="btn btn-primary"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    {analyzingItem === item.id ? 'Analyzing...' : 'AI Analyze'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

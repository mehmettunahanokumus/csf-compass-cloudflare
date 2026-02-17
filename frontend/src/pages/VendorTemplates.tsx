/**
 * VendorTemplates - Assessment template management (mock data)
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Info,
  Star,
  Pencil,
  Trash2,
  FileText,
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  subcategoryCount: number;
  isDefault: boolean;
  createdAt: string;
}

const mockTemplates: Template[] = [
  {
    id: 'tpl-1',
    name: 'Full NIST CSF 2.0',
    description:
      'Comprehensive assessment covering all 106 subcategories across all six NIST CSF 2.0 functions. Recommended for critical vendors requiring full compliance evaluation.',
    subcategoryCount: 106,
    isDefault: true,
    createdAt: '2024-01-15',
  },
  {
    id: 'tpl-2',
    name: 'Quick Assessment',
    description:
      'A streamlined template focusing on 30 key subcategories for rapid vendor evaluation. Ideal for initial screening or low-risk vendors.',
    subcategoryCount: 30,
    isDefault: false,
    createdAt: '2024-03-22',
  },
  {
    id: 'tpl-3',
    name: 'Cloud Provider',
    description:
      'Specialized template focusing on cloud-specific security controls including data protection, access management, and infrastructure security.',
    subcategoryCount: 45,
    isDefault: false,
    createdAt: '2024-05-10',
  },
];

export default function VendorTemplates() {
  const [templates, setTemplates] = useState<Template[]>(mockTemplates);

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/vendors"
            className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-[#55576A] hover:text-[#F0F0F5] hover:border-amber-500/30 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold text-[#F0F0F5]">Assessment Templates</h1>
            <p className="font-sans text-sm text-[#8E8FA8] mt-0.5">Manage reusable assessment configurations</p>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-[#08090E] font-display text-sm font-semibold rounded-lg hover:bg-amber-400 transition-colors">
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-5 flex gap-3.5 items-start">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
          <Info className="w-4 h-4 text-indigo-400" />
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold text-indigo-300 mb-1">
            About Assessment Templates
          </h3>
          <p className="font-sans text-sm text-indigo-300/70 leading-relaxed">
            Templates define which assessment categories and subcategories are included when
            creating new vendor assessments. The default template includes all NIST CSF 2.0
            subcategories.
          </p>
        </div>
      </div>

      {/* Template Grid */}
      {templates.length === 0 ? (
        <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-5 h-5 text-amber-500/50" />
          </div>
          <p className="font-display text-sm font-semibold text-[#F0F0F5] mb-1">No templates found</p>
          <p className="font-sans text-xs text-[#8E8FA8] mb-4">Create your first assessment template</p>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-[#08090E] font-display text-sm font-semibold rounded-lg hover:bg-amber-400 transition-colors">
            <Plus className="w-4 h-4" />
            Create First Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-6 flex flex-col hover:border-amber-500/15 transition-all group"
            >
              {/* Title + Default Badge */}
              <div className="flex justify-between items-start gap-3 mb-3">
                <h3 className="font-display text-base font-semibold text-[#F0F0F5] group-hover:text-amber-400 transition-colors">
                  {template.name}
                </h3>
                {template.isDefault && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 font-sans text-[10px] font-semibold text-amber-400 uppercase tracking-wide flex-shrink-0">
                    <Star className="w-3 h-3" fill="currentColor" />
                    Default
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="font-sans text-xs text-[#8E8FA8] leading-relaxed mb-4 flex-1">
                {template.description}
              </p>

              {/* Subcategory count */}
              <p className="font-sans text-xs text-[#55576A] mb-1">
                <span className="font-mono font-bold text-[#F0F0F5]">{template.subcategoryCount}</span>{' '}
                subcategories
              </p>

              {/* Created date */}
              <p className="font-mono text-[10px] text-[#55576A] mb-5">
                Created {template.createdAt}
              </p>

              {/* Footer Actions */}
              <div className="flex gap-2 pt-4 border-t border-white/[0.06]">
                <button className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white/[0.04] border border-white/[0.07] text-[#8E8FA8] font-sans text-xs rounded-lg hover:border-amber-500/30 hover:text-[#F0F0F5] transition-all">
                  <Pencil className="w-3 h-3" />
                  Edit
                </button>
                {!template.isDefault && (
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500/5 border border-red-500/15 text-red-400/70 font-sans text-xs rounded-lg hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

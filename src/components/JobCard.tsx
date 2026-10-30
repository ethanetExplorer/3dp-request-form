import React, { useRef, useEffect } from 'react';
import {
  Copy,
  Trash2,
  ChevronDown,
  ChevronUp,
  Box,
  Layers,
  Plus,
  Minus,
  MessageSquare
} from 'lucide-react';
import { PrintJob, SlicerSettings, Material, PrintMode } from '../types';
import { Section2ModelSlicer } from './Section2ModelSlicer';
import { Section3MaterialsColours } from './Section3MaterialsColours';
import { useAdminSettings } from '../context/AdminSettingsContext';

interface JobCardProps {
  job: PrintJob;
  index: number;
  totalJobs: number;
  onUpdateJob: (id: string, updates: Partial<PrintJob>) => void;
  onDuplicateJob: (id: string) => void;
  onRemoveJob: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onFileUpload: (id: string, file: File) => void;
  onSelectSample: (id: string, sampleId: string) => void;
  onBatchFiles?: (jobId: string, files: File[]) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  index,
  totalJobs,
  onUpdateJob,
  onDuplicateJob,
  onRemoveJob,
  onToggleCollapse,
  onFileUpload,
  onSelectSample,
  onBatchFiles
}) => {
  const { settings, accentTextColor } = useAdminSettings();
  const isDark = settings.theme === 'dark';

  const isCollapsed = !!job.isCollapsed;
  const unitPrice = job.estimate ? job.estimate.totalCost : 0;
  const jobSubtotal = unitPrice * job.quantity;

  const handleQuantityChange = (delta: number) => {
    const newQty = Math.max(1, Math.min(99, job.quantity + delta));
    onUpdateJob(job.id, { quantity: newQty });
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-adapt textarea height to content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const minHeight = 96; // reasonably tall base height (~4 lines)
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.max(minHeight, scrollHeight)}px`;
    }
  }, [job.instructions, isCollapsed]);

  return (
    <div className={`rounded-xl border shadow-xs overflow-hidden transition-all ${
      isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200/90'
    }`}>
      {/* Top Header Bar of the Job Card */}
      <div
        className={`px-4 sm:px-5 py-3.5 flex flex-wrap items-center justify-between gap-2.5 transition-colors cursor-pointer select-none border-b ${
          isDark
            ? isCollapsed
              ? 'bg-neutral-850 hover:bg-neutral-800/80 border-transparent'
              : 'bg-neutral-850/90 border-neutral-800'
            : isCollapsed
              ? 'bg-neutral-50 hover:bg-neutral-100/80 border-transparent'
              : 'bg-neutral-50/90 border-neutral-200/80'
        }`}
        onClick={() => onToggleCollapse(job.id)}
      >
        {/* Left: Job Number, Model Title, Material Badge & Quantity */}
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <span
            className="px-2.5 py-1 text-xs font-semibold rounded-md shadow-2xs"
            style={{ backgroundColor: settings.accentColor, color: accentTextColor }}
          >
            Job {index + 1}
          </span>

          <div className="flex items-center gap-1.5 min-w-0">
            <Box className="w-4 h-4 text-neutral-400 shrink-0" />
            <span className={`text-sm font-semibold truncate ${
              isDark ? 'text-white' : 'text-neutral-900'
            }`}>
              {job.modelData ? job.modelData.name : 'Upload 3D Model'}
            </span>
          </div>

          {/* Material & Color Tag */}
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-200/70 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
            <span
              className="w-2.5 h-2.5 rounded-full border border-black/15 shrink-0"
              style={{ backgroundColor: job.selectedMaterial.colorHex }}
            />
            <span>{job.selectedMaterial.type} {job.selectedMaterial.colorName}</span>
          </div>

          {/* Quantity Badge */}
          <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-neutral-200/60 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
            {job.quantity}x
          </span>

          {/* Subtotal */}
          {job.estimate && (
            <span className={`text-xs font-mono font-bold ${
              isDark ? 'text-emerald-400' : 'text-emerald-600'
            }`}>
              ${jobSubtotal.toFixed(2)}
            </span>
          )}
        </div>

        {/* Right: Duplicate, Delete & Accordion Actions */}
        <div
          className="flex items-center gap-1 shrink-0 ml-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onDuplicateJob(job.id)}
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
              isDark
                ? 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
            }`}
            title="Duplicate this job (keeps model, material & slicer settings)"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Duplicate</span>
          </button>

          {totalJobs > 1 && (
            <button
              type="button"
              onClick={() => onRemoveJob(job.id)}
              className="p-1.5 rounded-lg text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors flex items-center gap-1"
              title="Remove this job"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Remove</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onToggleCollapse(job.id)}
            className={`p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors ml-1`}
            title={isCollapsed ? 'Expand job details' : 'Collapse job details'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Job Content */}
      {!isCollapsed && (
        <div className="p-4 sm:p-6 space-y-5">
          {/* Quantity Selector Bar */}
          <div className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
            isDark ? 'bg-neutral-850/60 border-neutral-800' : 'bg-neutral-50/70 border-neutral-200'
          }`}>
            <div className="flex items-center gap-3">
              <span className={`font-medium ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>
                Copies to Print:
              </span>
              <div className="inline-flex items-center rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden shadow-2xs">
                <button
                  type="button"
                  disabled={job.quantity <= 1}
                  onClick={() => handleQuantityChange(-1)}
                  className="px-2.5 py-1 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 py-1 font-mono font-bold text-xs min-w-8 text-center text-neutral-900 dark:text-white">
                  {job.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(1)}
                  className="px-2.5 py-1 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {job.estimate && (
              <div className="text-right text-neutral-500 font-mono text-[11px]">
                {job.quantity > 1 ? (
                  <span>
                    ${unitPrice.toFixed(2)} each × {job.quantity} = <strong className={`text-xs ${isDark ? 'text-white' : 'text-neutral-900'}`}>${jobSubtotal.toFixed(2)}</strong>
                  </span>
                ) : (
                  <span>
                    Subtotal: <strong className={`text-xs ${isDark ? 'text-white' : 'text-neutral-900'}`}>${jobSubtotal.toFixed(2)}</strong>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Model Upload, 3D Viewer & Slicer Configuration */}
          <Section2ModelSlicer
            modelData={job.modelData}
            isLoading={!!job.isLoadingModel}
            error={job.modelError || null}
            onFileUpload={(file) => onFileUpload(job.id, file)}
            onSelectSample={(sampleId) => onSelectSample(job.id, sampleId)}
            slicerSettings={job.slicerSettings}
            onUpdateSettings={(settings) =>
              onUpdateJob(job.id, {
                slicerSettings: { ...job.slicerSettings, ...settings }
              })
            }
            estimate={job.estimate}
            selectedMaterial={job.selectedMaterial}
            printMode={job.printMode}
            onChangePrintMode={(mode) => onUpdateJob(job.id, { printMode: mode })}
            onBatchFiles={(files) => onBatchFiles && onBatchFiles(job.id, files)}
          />

          {/* Material & Colour Selection */}
          <Section3MaterialsColours
            selectedMaterial={job.selectedMaterial}
            onSelectMaterial={(mat) => onUpdateJob(job.id, { selectedMaterial: mat })}
            estimate={job.estimate}
          />

          {/* Custom Instructions (Auto-adapting height) */}
          <div className={`p-4 sm:p-5 rounded-xl border shadow-xs space-y-2 transition-colors ${
            isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200/90'
          }`}>
            <div className="flex items-center justify-between">
              <label className={`text-sm font-medium flex items-center gap-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                <MessageSquare className="w-4 h-4 text-neutral-400" />
                <span>Custom Instructions</span>
              </label>
              <span className="text-[11px] text-neutral-400">
                Optional
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Add any specific requirements for this print (e.g. critical tolerances, orientation preference, surface finish, thread inserts).
            </p>
            <textarea
              ref={textareaRef}
              rows={3}
              value={job.instructions || ''}
              onChange={(e) => onUpdateJob(job.id, { instructions: e.target.value })}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = `${Math.max(96, el.scrollHeight)}px`;
              }}
              placeholder="e.g. Please print with the flat face on the build plate. Keep top surface clean for visible assembly..."
              className={`w-full p-3.5 rounded-xl border text-xs outline-none transition-all resize-none min-h-[96px] leading-relaxed ${
                isDark
                  ? 'bg-neutral-800/80 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-neutral-500'
                  : 'bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-400'
              }`}
              style={{
                fieldSizing: 'content' as any
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

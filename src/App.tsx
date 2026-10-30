import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { Section1PersonalDetails } from './components/Section1PersonalDetails';
import { JobCard } from './components/JobCard';
import { OrderSummaryModal } from './components/OrderSummaryModal';
import {
  CustomerDetails,
  Material,
  ModelData,
  PrintEstimate,
  PrintJob,
  SlicerSettings
} from './types';
import { estimatePrintCost } from './utils/slicerEngine';
import { loadModelFromFile, loadSampleModel } from './utils/modelLoaders';
import { useAdminSettings } from './context/AdminSettingsContext';
import { RotateCw, Plus, AlertCircle } from 'lucide-react';
import { sanitizeFormattedText } from './utils/sanitizeText';
import { DemoNotice } from './components/DemoNotice';

const defaultFilament: Material = {
  id: 'pla-black',
  name: 'Standard PLA',
  type: 'PLA',
  colorName: 'Matte Black',
  colorHex: '#1E1E1E',
  finish: 'Matte',
  density: 1.24,
  hourlyMachineRate: 4.50,
  costPerKg: 28.00,
  gramRate: 0.028,
  description: 'Standard PLA',
  features: []
};

export const App: React.FC = () => {
  const { settings, accentTextColor, harmonizedBg } = useAdminSettings();
  const isDark = settings.theme === 'dark';

  // Section 1: Customer Details State
  const [customer, setCustomer] = useState<CustomerDetails>({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });
  const [touched, setTouched] = useState<{ name?: boolean; phone?: boolean }>({});
  const [validationErrors, setValidationErrors] = useState<{ name?: string; phone?: string }>({});

  // Helper to construct a fresh default job
  const createJob = useCallback((id: string, initialModel: ModelData | null = null): PrintJob => {
    const mat = settings.filaments[0] || defaultFilament;
    const defaultPreset = settings.presets.find(p => p.nozzleSize === 0.4 && p.name.toLowerCase() === 'standard')
      || settings.presets.find(p => p.nozzleSize === 0.4)
      || settings.presets[0]
      || {
        id: 'preset-04-standard',
        name: 'Standard',
        nozzleSize: 0.4,
        layerHeight: 0.20,
        infillPercent: 20,
        infillPattern: 'Grid' as const,
        wallLoops: 3,
        supportType: 'none' as const
      };

    const initialSettings: SlicerSettings = {
      nozzleSize: defaultPreset.nozzleSize || 0.4,
      layerHeight: defaultPreset.layerHeight,
      infillPercent: defaultPreset.infillPercent,
      infillPattern: defaultPreset.infillPattern,
      wallLoops: defaultPreset.wallLoops,
      supportType: defaultPreset.supportType,
      bedAdhesion: 'skirt',
      speedPreset: 'standard'
    };

    let est: PrintEstimate | null = null;
    if (initialModel) {
      est = estimatePrintCost(
        initialModel.volume * 1000,
        initialModel.surfaceArea * 100,
        initialModel.dimensions,
        initialSettings,
        mat,
        settings.pricing.setupFee,
        settings.pricing.additionalHourlyRate
      );
    }

    return {
      id,
      modelData: initialModel,
      isLoadingModel: false,
      modelError: null,
      slicerSettings: initialSettings,
      printMode: defaultPreset.id,
      selectedMaterial: mat,
      quantity: 1,
      estimate: est,
      instructions: '',
      isCollapsed: false
    };
  }, [settings]);

  // Section 2: Multi-Job State
  const [jobs, setJobs] = useState<PrintJob[]>(() => [createJob('job-1', null)]);
  const [generalJobError, setGeneralJobError] = useState<string | null>(null);

  // Auto-load sample model into Job 1 on initial mount for immediate interactive experience
  useEffect(() => {
    let isMounted = true;
    const initDefaultModel = async () => {
      setJobs((prev) =>
        prev.map((j, idx) => (idx === 0 ? { ...j, isLoadingModel: true } : j))
      );
      try {
        const defaultSample = await loadSampleModel('sample-gear');
        if (isMounted) {
          setJobs((prev) =>
            prev.map((j, idx) => {
              if (idx !== 0) return j;
              const est = estimatePrintCost(
                defaultSample.volume * 1000,
                defaultSample.surfaceArea * 100,
                defaultSample.dimensions,
                j.slicerSettings,
                j.selectedMaterial,
                settings.pricing.setupFee,
                settings.pricing.additionalHourlyRate
              );
              return {
                ...j,
                modelData: defaultSample,
                isLoadingModel: false,
                modelError: null,
                estimate: est
              };
            })
          );
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn('Initial model load:', err);
          setJobs((prev) =>
            prev.map((j, idx) => (idx === 0 ? { ...j, isLoadingModel: false } : j))
          );
        }
      }
    };

    initDefaultModel();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync pricing changes from Admin across existing jobs
  useEffect(() => {
    setJobs((prevJobs) =>
      prevJobs.map((j) => {
        const currentMat = settings.filaments.find((m) => m.id === j.selectedMaterial.id) || settings.filaments[0] || j.selectedMaterial;
        let est = j.estimate;
        if (j.modelData) {
          est = estimatePrintCost(
            j.modelData.volume * 1000,
            j.modelData.surfaceArea * 100,
            j.modelData.dimensions,
            j.slicerSettings,
            currentMat,
            settings.pricing.setupFee,
            settings.pricing.additionalHourlyRate
          );
        }
        return {
          ...j,
          selectedMaterial: currentMat,
          estimate: est
        };
      })
    );
  }, [settings.pricing, settings.filaments]);

  // Submission & Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [orderId, setOrderId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Recalculate cost helper for an individual job
  const recalculateJob = (job: PrintJob): PrintJob => {
    if (!job.modelData) {
      return { ...job, estimate: null };
    }
    const est = estimatePrintCost(
      job.modelData.volume * 1000,
      job.modelData.surfaceArea * 100,
      job.modelData.dimensions,
      job.slicerSettings,
      job.selectedMaterial,
      settings.pricing.setupFee,
      settings.pricing.additionalHourlyRate
    );
    return { ...job, estimate: est };
  };

  // Job Actions
  const handleAddJob = () => {
    const newId = `job-${Date.now()}`;
    // Collapse previous jobs to keep UI neat
    setJobs((prev) => [
      ...prev.map((j) => ({ ...j, isCollapsed: true })),
      createJob(newId, null)
    ]);
    setGeneralJobError(null);
  };

  const handleDuplicateJob = (jobId: string) => {
    const jobIdx = jobs.findIndex((j) => j.id === jobId);
    if (jobIdx === -1) return;

    const sourceJob = jobs[jobIdx];
    const newId = `job-${Date.now()}`;

    let clonedEst: PrintEstimate | null = null;
    if (sourceJob.modelData) {
      clonedEst = estimatePrintCost(
        sourceJob.modelData.volume * 1000,
        sourceJob.modelData.surfaceArea * 100,
        sourceJob.modelData.dimensions,
        sourceJob.slicerSettings,
        sourceJob.selectedMaterial,
        settings.pricing.setupFee,
        settings.pricing.additionalHourlyRate
      );
    }

    const duplicated: PrintJob = {
      ...sourceJob,
      id: newId,
      slicerSettings: { ...sourceJob.slicerSettings },
      estimate: clonedEst,
      isCollapsed: false
    };

    const nextJobs = [...jobs];
    nextJobs.splice(jobIdx + 1, 0, duplicated);
    setJobs(nextJobs);
  };

  const handleRemoveJob = (jobId: string) => {
    if (jobs.length <= 1) return;
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  };

  const handleToggleCollapse = (jobId: string) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, isCollapsed: !j.isCollapsed } : j))
    );
  };

  const handleUpdateJob = (jobId: string, updates: Partial<PrintJob>) => {
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== jobId) return j;
        const updated = { ...j, ...updates };
        return recalculateJob(updated);
      })
    );
  };

  // Handle file upload for a specific job
  const handleFileUpload = async (jobId: string, file: File) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, isLoadingModel: true, modelError: null } : j))
    );
    try {
      const parsedModel = await loadModelFromFile(file);
      setJobs((prev) =>
        prev.map((j) => {
          if (j.id !== jobId) return j;
          const updated = {
            ...j,
            modelData: parsedModel,
            isLoadingModel: false,
            modelError: null
          };
          return recalculateJob(updated);
        })
      );
    } catch (err: any) {
      console.error('File parsing error:', err);
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? {
                ...j,
                isLoadingModel: false,
                modelError: err?.message || 'Failed to process 3D file. Please verify file is a valid STL or STEP file.'
              }
            : j
        )
      );
    }
  };

  // Handle sample selection for a specific job
  const handleSelectSample = async (jobId: string, sampleId: string) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, isLoadingModel: true, modelError: null } : j))
    );
    try {
      const sample = await loadSampleModel(sampleId);
      setJobs((prev) =>
        prev.map((j) => {
          if (j.id !== jobId) return j;
          const updated = {
            ...j,
            modelData: sample,
            isLoadingModel: false,
            modelError: null
          };
          return recalculateJob(updated);
        })
      );
    } catch (err: any) {
      console.error('Sample loading error:', err);
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? { ...j, isLoadingModel: false, modelError: 'Failed to load sample model.' }
            : j
        )
      );
    }
  };

  // Handle batch file upload (e.g. user drags or selects multiple files at once)
  const handleBatchFiles = async (jobId: string, files: File[]) => {
    if (files.length === 0) return;
    await handleFileUpload(jobId, files[0]);

    for (let i = 1; i < files.length; i++) {
      const file = files[i];
      const newId = `job-${Date.now()}-${i}`;
      const newJob = createJob(newId, null);

      setJobs((prev) => [...prev, newJob]);
      handleFileUpload(newId, file);
    }
  };

  // Grand Totals Calculation across all jobs
  const grandTotalCost = useMemo(() => {
    return jobs.reduce((sum, j) => sum + (j.estimate ? j.estimate.totalCost * j.quantity : 0), 0);
  }, [jobs]);

  const totalCopiesCount = useMemo(() => {
    return jobs.reduce((sum, j) => sum + j.quantity, 0);
  }, [jobs]);

  const totalPrintHours = useMemo(() => {
    return jobs.reduce((sum, j) => sum + (j.estimate ? j.estimate.printTimeHours * j.quantity : 0), 0);
  }, [jobs]);

  const totalFilamentWeight = useMemo(() => {
    return jobs.reduce((sum, j) => sum + (j.estimate ? j.estimate.filamentWeightGrams * j.quantity : 0), 0);
  }, [jobs]);

  // Validate form fields
  const validateForm = useCallback((): boolean => {
    const errors: { name?: string; phone?: string } = {};

    if (!customer.name.trim()) {
      errors.name = 'This is a required question';
    } else if (customer.name.trim().length < 2) {
      errors.name = 'Please enter at least 2 characters';
    }

    if (!customer.phone.trim()) {
      errors.phone = 'This is a required question';
    } else {
      const digits = customer.phone.replace(/\D/g, '');
      if (digits.length < 7) {
        errors.phone = 'Please enter a valid phone number';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [customer]);

  const handleBlur = (field: 'name' | 'phone') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateForm();
  };

  // Form Submission
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setTouched({ name: true, phone: true });
    const isValid = validateForm();

    if (!isValid) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Check if any job is missing a 3D model
    const missingJobIndex = jobs.findIndex((j) => !j.modelData);
    if (missingJobIndex !== -1) {
      // Expand the missing job so user can see it
      setJobs((prev) =>
        prev.map((j, idx) => (idx === missingJobIndex ? { ...j, isCollapsed: false } : j))
      );
      setGeneralJobError(`Job ${missingJobIndex + 1} is missing a 3D model. Please upload an STL or STEP file.`);
      return;
    }

    setGeneralJobError(null);
    setIsSubmitting(true);
    setTimeout(() => {
      const generatedId = `3DP-${Math.floor(100000 + Math.random() * 900000)}`;
      setOrderId(generatedId);
      setIsSubmitting(false);
      setIsModalOpen(true);
    }, 350);
  };

  // Reset form (Clear form)
  const handleReset = () => {
    setCustomer({ name: '', phone: '', email: '', notes: '' });
    setTouched({});
    setValidationErrors({});
    setGeneralJobError(null);
    setIsModalOpen(false);
  };

  return (
    <div
      className={`min-h-screen pb-16 transition-colors duration-200 ${
        isDark ? 'text-neutral-100' : 'text-neutral-900'
      }`}
      style={{ backgroundColor: harmonizedBg }}
    >
      {/* Top Header with isolated print cost on its own */}
      <Header totalCost={grandTotalCost} />

      <main className="max-w-2xl sm:max-w-3xl mx-auto px-4 py-6 space-y-4">
        <DemoNotice />
        {/* Google Form Header Card */}
        <div className={`rounded-xl border shadow-xs overflow-hidden transition-colors ${
          isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200/90'
        }`}>
          {/* Dynamic Accent Color Stripe */}
          <div
            className="h-2.5 transition-colors"
            style={{ backgroundColor: settings.accentColor }}
          />
          <div className="p-6 sm:p-7">
            <h1 className={`text-2xl sm:text-3xl font-normal tracking-tight ${
              isDark ? 'text-white' : 'text-neutral-900'
            }`}>
              {settings.adminInfo.businessName || '3D Printing Request'}
            </h1>
            <div
              className={`text-xs sm:text-sm mt-2 leading-relaxed ${
                isDark ? 'text-neutral-400' : 'text-neutral-600'
              }`}
              style={{ whiteSpace: 'pre-wrap' }}
              dangerouslySetInnerHTML={{
                __html: sanitizeFormattedText(
                  settings.adminInfo.formDescription ||
                  'Submit one or multiple 3D models for automated slicing and instant quotation.'
                )
              }}
            />
            <div className={`border-t my-4 ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`} />
            <div className="text-xs text-red-500 font-medium">
              * Indicates required question
            </div>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Question 1: Personal Details */}
          <Section1PersonalDetails
            customer={customer}
            onChange={(updated) => setCustomer((prev) => ({ ...prev, ...updated }))}
            errors={validationErrors}
            touched={touched}
            onBlur={handleBlur}
          />

          {/* Section 2: 3D Print Jobs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  Print Jobs ({jobs.length}) <span className="text-red-500">*</span>
                </h2>
                <p className="text-xs text-neutral-500">
                  Configure models, materials, quality presets, and quantities.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddJob}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-transform active:scale-95"
                style={{ backgroundColor: settings.accentColor, color: accentTextColor }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Job</span>
              </button>
            </div>

            {/* General Job Error Alert */}
            {generalJobError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{generalJobError}</span>
              </div>
            )}

            {/* List of Job Cards */}
            <div className="space-y-4">
              {jobs.map((job, index) => (
                <JobCard
                  key={job.id}
                  job={job}
                  index={index}
                  totalJobs={jobs.length}
                  onUpdateJob={handleUpdateJob}
                  onDuplicateJob={handleDuplicateJob}
                  onRemoveJob={handleRemoveJob}
                  onToggleCollapse={handleToggleCollapse}
                  onFileUpload={handleFileUpload}
                  onSelectSample={handleSelectSample}
                  onBatchFiles={handleBatchFiles}
                />
              ))}
            </div>

            {/* Add Another Job Action Button */}
            <button
              type="button"
              onClick={handleAddJob}
              className={`w-full py-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                isDark
                  ? 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/60 hover:bg-neutral-850 text-neutral-300'
                  : 'border-neutral-300 hover:border-neutral-400 bg-white/70 hover:bg-neutral-50 text-neutral-700'
              }`}
            >
              <Plus className="w-4 h-4" style={{ color: settings.accentColor }} />
              <span>Add Another 3D Print Job</span>
            </button>
          </div>

          {/* Combined Order Summary Card */}
          {grandTotalCost > 0 && (
            <div className={`p-4 sm:p-5 rounded-xl border shadow-xs space-y-3 ${
              isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200/90'
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
                <span className={`text-xs font-semibold ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>
                  Order Summary
                </span>
                <span className="text-[11px] font-mono text-neutral-500">
                  {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} • {totalCopiesCount} total {totalCopiesCount === 1 ? 'copy' : 'copies'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-neutral-500">
                <div>
                  <span className="block text-[10px] uppercase">Est. Total Time:</span>
                  <span className={`font-mono font-medium ${isDark ? 'text-neutral-200' : 'text-neutral-900'}`}>
                    {totalPrintHours.toFixed(1)} hrs
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase">Est. Total Material:</span>
                  <span className={`font-mono font-medium ${isDark ? 'text-neutral-200' : 'text-neutral-900'}`}>
                    {totalFilamentWeight.toFixed(0)} grams
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1 text-left sm:text-right">
                  <span className="block text-[10px] uppercase">Combined Total:</span>
                  <span className={`font-mono font-bold text-base ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    ${grandTotalCost.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Google Form Style Bottom Action Bar */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center px-6 py-2.5 disabled:opacity-50 rounded-md text-sm font-semibold shadow-xs transition-opacity hover:opacity-90 active:scale-98"
              style={{ backgroundColor: settings.accentColor, color: accentTextColor }}
            >
              {isSubmitting ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin mr-2" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit {jobs.length > 1 ? `(${jobs.length} Jobs)` : 'Request'}</span>
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isDark
                  ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
              }`}
            >
              Clear form
            </button>
          </div>
        </form>

        {/* Google Form Footer */}
        <div className="text-center pt-6 text-[11px] text-neutral-500 space-y-1">
          <p>Never submit passwords through 3D Print Request Forms.</p>
          <p className="text-neutral-400">
            Powered by Automated CAD Slicing Engine.
          </p>
        </div>
      </main>

      {/* Order Submission Confirmation Modal */}
      <OrderSummaryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={customer}
        jobs={jobs}
        orderId={orderId}
        onReset={handleReset}
      />
    </div>
  );
};

export default App;

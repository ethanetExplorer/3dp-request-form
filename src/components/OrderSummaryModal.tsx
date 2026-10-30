import React from 'react';
import {
  CheckCircle2,
  X,
  Printer,
  User,
  Phone,
  Mail,
  MapPin,
  Box
} from 'lucide-react';
import { CustomerDetails, PrintJob } from '../types';
import { useAdminSettings } from '../context/AdminSettingsContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerDetails;
  jobs: PrintJob[];
  orderId: string;
  onReset: () => void;
}

export const OrderSummaryModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  customer,
  jobs,
  orderId,
  onReset
}) => {
  const { settings, accentTextColor } = useAdminSettings();
  const isDark = settings.theme === 'dark';

  if (!isOpen || jobs.length === 0) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalCopies = jobs.reduce((sum, j) => sum + j.quantity, 0);
  const totalWeightGrams = jobs.reduce((sum, j) => sum + (j.estimate ? j.estimate.filamentWeightGrams * j.quantity : 0), 0);
  const totalHours = jobs.reduce((sum, j) => sum + (j.estimate ? j.estimate.printTimeHours * j.quantity : 0), 0);
  const grandTotal = jobs.reduce((sum, j) => sum + (j.estimate ? j.estimate.totalCost * j.quantity : 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className={`relative w-full max-w-xl rounded-2xl shadow-2xl border overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200 transition-colors ${
        isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
      }`}>
        {/* Header Bar */}
        <div className="p-6 bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
                3D Print Request Received
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Order Reference {orderId}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Customer Details Summary */}
          <div className={`p-3.5 rounded-xl border ${
            isDark ? 'bg-neutral-800/60 border-neutral-700' : 'bg-neutral-50 border-neutral-200/80'
          }`}>
            <div className={`font-semibold mb-2 flex items-center gap-1.5 ${
              isDark ? 'text-white' : 'text-neutral-900'
            }`}>
              <User className="w-3.5 h-3.5 text-neutral-400" />
              <span>Customer Information</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-neutral-500">
              <div>
                <span className="block text-[10px] uppercase">Name:</span>
                <span className={`font-medium ${isDark ? 'text-neutral-200' : 'text-neutral-900'}`}>
                  {customer.name}
                </span>
              </div>
              <div>
                <span className="block text-[10px] uppercase">Phone:</span>
                <span className={`font-mono font-medium ${isDark ? 'text-neutral-200' : 'text-neutral-900'}`}>
                  {customer.phone}
                </span>
              </div>
              {customer.email && (
                <div className="col-span-2">
                  <span className="block text-[10px] uppercase">Email:</span>
                  <span className={`font-medium ${isDark ? 'text-neutral-200' : 'text-neutral-900'}`}>
                    {customer.email}
                  </span>
                </div>
              )}
              {customer.notes && (
                <div className="col-span-2">
                  <span className="block text-[10px] uppercase">Notes / Instructions:</span>
                  <span className={`font-medium ${isDark ? 'text-neutral-200' : 'text-neutral-900'}`}>
                    {customer.notes}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Itemized Jobs List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-neutral-500 px-1 font-semibold uppercase tracking-wider text-[10px]">
              <span>Print Jobs ({jobs.length})</span>
              <span>{totalCopies} Total Copies</span>
            </div>

            {jobs.map((job, idx) => {
              const est = job.estimate;
              const subtotal = est ? est.totalCost * job.quantity : 0;

              return (
                <div
                  key={job.id}
                  className={`p-3.5 rounded-xl border space-y-2 ${
                    isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50/90 border-neutral-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-neutral-200 dark:bg-neutral-800 font-mono">
                        #{idx + 1}
                      </span>
                      <Box className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="font-semibold text-xs truncate">
                        {job.modelData ? job.modelData.name : '3D Model'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-neutral-200 dark:bg-neutral-800">
                        {job.quantity}x
                      </span>
                      <span className="font-mono font-bold text-xs text-emerald-500 dark:text-emerald-400">
                        ${subtotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Job Specs */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-500">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-black/15 shrink-0"
                        style={{ backgroundColor: job.selectedMaterial.colorHex }}
                      />
                      <span className="truncate">
                        {job.selectedMaterial.type} ({job.selectedMaterial.colorName})
                      </span>
                    </div>

                    <div className="truncate">
                      Mode: <span className="capitalize font-medium text-neutral-700 dark:text-neutral-300">
                        {settings.presets.find(p => p.id === job.printMode)?.name || job.printMode}
                      </span> ({job.slicerSettings.nozzleSize || 0.4}mm nozzle • {job.slicerSettings.layerHeight}mm)
                    </div>

                    {est && (
                      <>
                        <div className="text-neutral-400">
                          {est.formattedTime} each ({est.filamentWeightGrams}g)
                        </div>
                        <div className="text-right text-neutral-400 font-mono">
                          ${est.totalCost.toFixed(2)} / unit
                        </div>
                      </>
                    )}
                  </div>

                  {job.instructions && (
                    <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 text-[11px]">
                      <span className="text-neutral-400 block text-[10px] uppercase font-semibold tracking-wider">
                        Custom Instructions:
                      </span>
                      <p className="text-neutral-700 dark:text-neutral-300 italic whitespace-pre-wrap mt-0.5">
                        "{job.instructions}"
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Grand Total Summary */}
          <div className="p-3.5 bg-neutral-950 text-white rounded-xl border border-neutral-800 space-y-2">
            <div className="font-semibold text-neutral-200 pb-2 border-b border-neutral-800 flex items-center justify-between">
              <span>Order Summary & Quotation</span>
              <span className="text-[10px] font-mono text-neutral-400">
                {jobs.length} jobs • {totalCopies} items
              </span>
            </div>

            <div className="space-y-1 text-neutral-300 text-[11px]">
              <div className="flex justify-between">
                <span>Estimated Machine Time:</span>
                <span className="font-mono text-white font-medium">{totalHours.toFixed(1)} hours</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Total Filament:</span>
                <span className="font-mono text-white font-medium">{totalWeightGrams.toFixed(0)} grams</span>
              </div>
              <div className="pt-2 border-t border-neutral-800 flex justify-between items-baseline font-bold text-white text-sm">
                <span>Grand Total:</span>
                <span className="text-lg font-mono text-emerald-400">${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Admin Business & Payment Instructions */}
          {(settings.adminInfo.pickupLocation || settings.adminInfo.paymentInstructions || settings.adminInfo.contactEmail) && (
            <div className={`p-3.5 rounded-xl border space-y-2 ${
              isDark ? 'bg-neutral-800/40 border-neutral-700' : 'bg-neutral-50/90 border-neutral-200'
            }`}>
              <div className={`font-semibold flex items-center gap-1.5 ${
                isDark ? 'text-white' : 'text-neutral-900'
              }`}>
                <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                <span>Pickup & Payment Information</span>
              </div>

              {settings.adminInfo.pickupLocation && (
                <div className="text-neutral-500">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300 block text-[10px] uppercase">
                    Pickup Location:
                  </span>
                  <span>{settings.adminInfo.pickupLocation}</span>
                </div>
              )}

              {settings.adminInfo.paymentInstructions && (
                <div className="text-neutral-500">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300 block text-[10px] uppercase">
                    Payment Instructions:
                  </span>
                  <div className="p-2 bg-neutral-100 dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono text-[11px] whitespace-pre-wrap">
                    {settings.adminInfo.paymentInstructions}
                  </div>
                </div>
              )}

              <div className="pt-1 flex flex-wrap gap-4 text-neutral-500 text-[11px]">
                {settings.adminInfo.contactEmail && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-neutral-400" /> {settings.adminInfo.contactEmail}
                  </span>
                )}
                {settings.adminInfo.contactPhone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-neutral-400" /> {settings.adminInfo.contactPhone}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="text-[11px] text-neutral-400 text-center">
            Estimated turnaround: 24-48 business hours upon queue entry.
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className={`p-4 border-t flex items-center justify-between gap-2 ${
          isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
        }`}>
          <button
            type="button"
            onClick={onReset}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
              isDark
                ? 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200/60'
            }`}
          >
            Submit Another Request
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all shadow-xs ${
                isDark
                  ? 'bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700'
                  : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Quote</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl shadow-xs transition-opacity hover:opacity-90"
              style={{ backgroundColor: settings.accentColor, color: accentTextColor }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

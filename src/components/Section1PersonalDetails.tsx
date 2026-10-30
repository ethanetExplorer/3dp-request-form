import React from 'react';
import { AlertCircle } from 'lucide-react';
import { CustomerDetails } from '../types';
import { useAdminSettings } from '../context/AdminSettingsContext';

interface Section1Props {
  customer: CustomerDetails;
  onChange: (updated: Partial<CustomerDetails>) => void;
  errors: {
    name?: string;
    phone?: string;
  };
  touched: {
    name?: boolean;
    phone?: boolean;
  };
  onBlur: (field: 'name' | 'phone') => void;
}

export const Section1PersonalDetails: React.FC<Section1Props> = ({
  customer,
  onChange,
  errors,
  touched,
  onBlur
}) => {
  const { settings } = useAdminSettings();
  const isDark = settings.theme === 'dark';

  return (
    <div className={`rounded-xl border p-5 sm:p-6 shadow-xs space-y-5 transition-colors ${
      isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200/90'
    }`}>
      {/* Question Header */}
      <div>
        <h2 className={`text-base font-medium ${isDark ? 'text-white' : 'text-neutral-900'}`}>
          Personal Details
        </h2>
      </div>

      <div className="space-y-4">
        {/* Name Question */}
        <div>
          <label htmlFor="customer-name" className={`block text-sm font-medium mb-1.5 ${
            isDark ? 'text-neutral-200' : 'text-neutral-800'
          }`}>
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="customer-name"
            type="text"
            required
            value={customer.name}
            onChange={(e) => onChange({ name: e.target.value })}
            onBlur={() => onBlur('name')}
            placeholder="Your answer"
            className={`w-full max-w-md px-3.5 py-2 text-sm placeholder:text-neutral-400 rounded-md border transition-all outline-none ${
              isDark
                ? 'bg-neutral-800 text-white border-neutral-700'
                : 'bg-white text-neutral-900 border-neutral-300'
            } ${
              touched.name && errors.name
                ? 'border-red-400 focus:border-red-500'
                : 'focus:border-(--accent-color)'
            }`}
          />
          {touched.name && errors.name && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.name}</span>
            </p>
          )}
        </div>

        {/* Phone Question */}
        <div>
          <label htmlFor="customer-phone" className={`block text-sm font-medium mb-1.5 ${
            isDark ? 'text-neutral-200' : 'text-neutral-800'
          }`}>
            Phone number <span className="text-red-500">*</span>
          </label>
          <input
            id="customer-phone"
            type="tel"
            required
            value={customer.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            onBlur={() => onBlur('phone')}
            placeholder="Your answer"
            className={`w-full max-w-md px-3.5 py-2 text-sm placeholder:text-neutral-400 rounded-md border transition-all outline-none ${
              isDark
                ? 'bg-neutral-800 text-white border-neutral-700'
                : 'bg-white text-neutral-900 border-neutral-300'
            } ${
              touched.phone && errors.phone
                ? 'border-red-400 focus:border-red-500'
                : 'focus:border-(--accent-color)'
            }`}
          />
          {touched.phone && errors.phone && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.phone}</span>
            </p>
          )}
        </div>

        {/* Email Question (Optional) */}
        <div>
          <label htmlFor="customer-email" className={`block text-sm font-medium mb-1.5 ${
            isDark ? 'text-neutral-200' : 'text-neutral-800'
          }`}>
            Email <span className="text-xs text-neutral-400 font-normal">(optional)</span>
          </label>
          <input
            id="customer-email"
            type="email"
            value={customer.email || ''}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="Your answer"
            className={`w-full max-w-md px-3.5 py-2 text-sm placeholder:text-neutral-400 rounded-md border transition-all outline-none ${
              isDark
                ? 'bg-neutral-800 text-white border-neutral-700'
                : 'bg-white text-neutral-900 border-neutral-300'
            } focus:border-(--accent-color)`}
          />
        </div>

        {/* Project Notes Question (Optional) */}
        <div>
          <label htmlFor="customer-notes" className={`block text-sm font-medium mb-1.5 ${
            isDark ? 'text-neutral-200' : 'text-neutral-800'
          }`}>
            Notes & requirements <span className="text-xs text-neutral-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="customer-notes"
            rows={2}
            value={customer.notes || ''}
            onChange={(e) => onChange({ notes: e.target.value })}
            placeholder="Your answer"
            className={`w-full max-w-md px-3.5 py-2 text-sm placeholder:text-neutral-400 rounded-md border transition-all outline-none ${
              isDark
                ? 'bg-neutral-800 text-white border-neutral-700'
                : 'bg-white text-neutral-900 border-neutral-300'
            } focus:border-(--accent-color)`}
          />
        </div>
      </div>
    </div>
  );
};

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  RemoveFormatting,
  Eye,
  Code
} from 'lucide-react';
import { sanitizeFormattedText } from '../utils/sanitizeText';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  isDark?: boolean;
  accentColor?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter description...',
  isDark = false,
  accentColor = '#673ab7'
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');
  const [showPreview, setShowPreview] = useState(true);

  // Sync external value to contentEditable when not currently editing
  useEffect(() => {
    if (editorRef.current && document.activeElement !== editorRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  // Update active formatting button states based on selection
  const updateActiveStates = useCallback(() => {
    try {
      setIsBold(document.queryCommandState('bold'));
      setIsItalic(document.queryCommandState('italic'));
      setIsUnderline(document.queryCommandState('underline'));
    } catch {
      // Ignored if selection not in document
    }
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
      updateActiveStates();
    }
  };

  const executeCommand = (command: 'bold' | 'italic' | 'underline' | 'removeFormat') => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false);
      handleInput();
      updateActiveStates();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.metaKey || e.ctrlKey) {
      const key = e.key.toLowerCase();
      if (key === 'b') {
        e.preventDefault();
        executeCommand('bold');
      } else if (key === 'i') {
        e.preventDefault();
        executeCommand('italic');
      } else if (key === 'u') {
        e.preventDefault();
        executeCommand('underline');
      }
    }
  };

  return (
    <div className="space-y-2">
      {/* Container with Toolbar & Editor */}
      <div
        className={`rounded-xl border transition-colors overflow-hidden ${
          isDark
            ? 'bg-neutral-800/80 border-neutral-700'
            : 'bg-white border-neutral-300'
        }`}
      >
        {/* Formatting Toolbar */}
        <div
          className={`px-3 py-1.5 border-b flex items-center justify-between gap-1 flex-wrap ${
            isDark
              ? 'bg-neutral-850 border-neutral-700/80 text-neutral-300'
              : 'bg-neutral-50 border-neutral-200 text-neutral-700'
          }`}
        >
          {/* Action Buttons: Bold, Italic, Underline, Clear */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              title="Bold (Ctrl+B / ⌘B)"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('bold');
              }}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                isBold
                  ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs'
                  : 'hover:bg-neutral-200/60 dark:hover:bg-neutral-750 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              <Bold className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              title="Italic (Ctrl+I / ⌘I)"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('italic');
              }}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                isItalic
                  ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs'
                  : 'hover:bg-neutral-200/60 dark:hover:bg-neutral-750 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              <Italic className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              title="Underline (Ctrl+U / ⌘U)"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('underline');
              }}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                isUnderline
                  ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs'
                  : 'hover:bg-neutral-200/60 dark:hover:bg-neutral-750 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              <Underline className="w-3.5 h-3.5" />
            </button>

            <div className={`h-4 w-px mx-1 ${isDark ? 'bg-neutral-700' : 'bg-neutral-200'}`} />

            <button
              type="button"
              title="Clear formatting"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand('removeFormat');
              }}
              className="p-1.5 rounded-md text-xs hover:bg-neutral-200/60 dark:hover:bg-neutral-750 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
            >
              <RemoveFormatting className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right Toolbar: View Mode & Preview Toggles */}
          <div className="flex items-center gap-1 text-[11px]">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'visual' ? 'code' : 'visual')}
              className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${
                viewMode === 'code'
                  ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white font-medium'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
              title="Toggle HTML Source"
            >
              <Code className="w-3.5 h-3.5" />
              <span>{viewMode === 'visual' ? 'HTML' : 'Visual'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${
                showPreview
                  ? 'text-neutral-700 dark:text-neutral-300 font-medium'
                  : 'text-neutral-400 hover:text-neutral-600'
              }`}
              title="Toggle live card preview"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          </div>
        </div>

        {/* Editor Body */}
        {viewMode === 'visual' ? (
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onKeyUp={updateActiveStates}
            onMouseUp={updateActiveStates}
            onKeyDown={handleKeyDown}
            data-placeholder={placeholder}
            className={`p-3.5 min-h-[100px] text-xs leading-relaxed outline-none focus:ring-0 ${
              isDark ? 'text-white' : 'text-neutral-900'
            }`}
            style={{
              whiteSpace: 'pre-wrap'
            }}
          />
        ) : (
          <textarea
            rows={4}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full p-3.5 text-xs font-mono outline-none resize-none min-h-[100px] leading-relaxed ${
              isDark
                ? 'bg-neutral-850 text-emerald-400 placeholder:text-neutral-600'
                : 'bg-neutral-50 text-neutral-800 placeholder:text-neutral-400'
            }`}
            placeholder="Type HTML tags directly: e.g. <b>bold</b>, <i>italic</i>, <u>underline</u>"
          />
        )}
      </div>

      {/* Live Form Card Preview */}
      {showPreview && (
        <div
          className={`p-3.5 rounded-xl border text-xs transition-colors ${
            isDark
              ? 'bg-neutral-900/60 border-neutral-800 text-neutral-300'
              : 'bg-neutral-50/80 border-neutral-200/80 text-neutral-600'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400">
              Form Header Live Preview
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{
                backgroundColor: isDark ? '#262626' : '#e5e5e5',
                color: isDark ? '#a3a3a3' : '#525252'
              }}
            >
              Customer View
            </span>
          </div>

          <div
            className="leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{
              __html: sanitizeFormattedText(value || '<span class="text-neutral-400 italic">No description set</span>')
            }}
          />
        </div>
      )}
    </div>
  );
};


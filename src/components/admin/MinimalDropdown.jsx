import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Minimalist Custom Dropdown
 * Replaces native OS <select> popups with modern, sleek, styled floating menus
 */
export default function MinimalDropdown({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  disabled = false,
  className = '',
  menuWidth = 'w-60',
  align = 'left',
  title = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  return (
    <div className={`relative ${className} ${isOpen ? 'z-50' : 'z-20'}`} ref={containerRef} title={title}>
      <button
        type="button"
        disabled={disabled || options.length === 0}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full h-9 px-3 py-2 text-xs font-semibold rounded-xl border border-sand-200 bg-sand-50/70 hover:bg-sand-100/70 text-ink-800 flex items-center justify-between gap-2 transition-all cursor-pointer select-none ${
          isOpen ? 'ring-2 ring-primary-500/15 border-sand-300 bg-white shadow-2xs' : ''
        } ${disabled || options.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className="truncate text-left">{displayLabel}</span>
        <ChevronDown
          size={13}
          className={`text-ink-400 shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180 text-ink-700' : ''}`}
        />
      </button>

      {isOpen && !disabled && options.length > 0 && (
        <div
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-1.5 ${menuWidth} max-w-[90vw] bg-white rounded-xl shadow-2xl border border-sand-200/90 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100`}
        >
          <div className="max-h-64 overflow-y-auto px-1 space-y-0.5">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between gap-2.5 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-950 font-semibold'
                      : 'text-ink-700 hover:bg-sand-100/75 hover:text-ink-900 font-medium'
                  }`}
                >
                  <div className="flex flex-col min-w-0 pr-1">
                    <span className="truncate">{opt.label}</span>
                    {opt.sublabel && (
                      <span className="text-[10px] text-ink-400 font-normal leading-tight">
                        {opt.sublabel}
                      </span>
                    )}
                  </div>
                  {isSelected && <Check size={13} className="text-emerald-700 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

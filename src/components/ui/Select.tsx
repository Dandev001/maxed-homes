import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  value?: string;
  onChange: (value: string) => void;
  options?: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Select({
  value = '',
  onChange,
  options = [],
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  label,
  size = 'md',
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options?.find(opt => opt.value === value) || null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    if (disabled) return;
    onChange(optionValue);
    setIsOpen(false);
  };

  const sizeClasses = {
    sm: 'px-2 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-base',
  };

  // Calculate dropdown position when open
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    if (isOpen && selectRef.current) {
      const rect = selectRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    } else {
      setDropdownPosition(null);
    }
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between
          ${sizeClasses[size]}
          border border-gray-200 rounded-xl
          bg-gray-50/50 hover:bg-white
          focus:ring-2 focus:ring-gray-900 focus:border-gray-900
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isOpen ? 'ring-2 ring-gray-900 border-gray-900 bg-white' : ''}
        `}
      >
        <span className={`truncate ${selectedOption ? 'text-gray-900' : 'text-gray-500'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && dropdownPosition && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => setIsOpen(false)}
          />
          {/* Dropdown Menu - Using fixed positioning to escape parent containers */}
          <div 
            className="fixed z-[101] bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-auto"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
            }}
          >
            {options.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No options available
              </div>
            ) : (
              <ul className="py-1">
                {options.map((option) => {
                  const isSelected = option.value === value;
                  const isDisabled = option.disabled || disabled;
                  const textSizeClass = size === 'sm' ? 'text-xs' : 'text-sm';
                  
                  return (
                    <li key={option.value}>
                      <button
                        type="button"
                        onClick={() => !isDisabled && handleSelect(option.value)}
                        disabled={isDisabled}
                        className={`
                          w-full flex items-center justify-between px-4 py-2.5 ${textSizeClass}
                          transition-colors duration-150
                          ${
                            isSelected
                              ? 'bg-gray-50 text-gray-900 font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                          }
                          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                      >
                        <span className="truncate">{option.label}</span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-gray-900 flex-shrink-0 ml-2" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}


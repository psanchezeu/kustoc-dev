import React, { useState, useRef, useEffect } from 'react';
import { Input } from './Input';
import { Label } from './Label';

export interface AutocompleteOption {
  id: string;
  name: string;
}

interface AutocompleteProps {
  options: AutocompleteOption[];
  value: string;
  onChange: (value: string) => void;
  onSelect: (option: AutocompleteOption) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}

export const Autocomplete: React.FC<AutocompleteProps> = ({
  options,
  value,
  onChange,
  onSelect,
  placeholder = 'Buscar...',
  label,
  error,
  className = '',
  disabled = false,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<AutocompleteOption[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Filter options based on input value
  useEffect(() => {
    if (!value) {
      setFilteredOptions(options.slice(0, 10)); // Show first 10 options when empty
    } else {
      const filtered = options.filter(option =>
        option.name.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 10); // Limit to 10 results
      setFilteredOptions(filtered);
    }
  }, [value, options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsOpen(true);
  };

  const handleOptionClick = (option: AutocompleteOption) => {
    onSelect(option);
    onChange(option.name);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <Input
        id={id}
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        onFocus={() => setIsOpen(true)}
        disabled={disabled}
      />
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md py-1 overflow-auto border border-gray-200">
          {filteredOptions.map(option => (
            <div
              key={option.id}
              className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
              onClick={() => handleOptionClick(option)}
            >
              {option.name}
            </div>
          ))}
        </div>
      )}
      
      {isOpen && filteredOptions.length === 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md py-1 border border-gray-200">
          <div className="px-4 py-2 text-sm text-gray-500">No se encontraron resultados</div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { Input } from './Input';
import { Label } from './Label';
import { X } from 'lucide-react';

export interface MultiSelectOption {
  id: string;
  name: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selectedOptions: MultiSelectOption[];
  onChange: (options: MultiSelectOption[]) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selectedOptions,
  onChange,
  placeholder = 'Seleccionar...',
  label,
  error,
  className = '',
  disabled = false,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<MultiSelectOption[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search input and already selected items
  useEffect(() => {
    const selectedIds = new Set(selectedOptions.map(option => option.id));
    const filtered = options
      .filter(option => 
        !selectedIds.has(option.id) && 
        option.name.toLowerCase().includes(searchValue.toLowerCase())
      )
      .slice(0, 10); // Limit to 10 results
    setFilteredOptions(filtered);
  }, [searchValue, options, selectedOptions]);

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    setIsOpen(true);
  };

  const handleOptionClick = (option: MultiSelectOption) => {
    const newSelectedOptions = [...selectedOptions, option];
    onChange(newSelectedOptions);
    setSearchValue('');
    inputRef.current?.focus();
  };

  const handleRemoveOption = (optionId: string) => {
    const newSelectedOptions = selectedOptions.filter(option => option.id !== optionId);
    onChange(newSelectedOptions);
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      {label && <Label htmlFor={id}>{label}</Label>}
      
      <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-white min-h-[42px]">
        {selectedOptions.map(option => (
          <div 
            key={option.id} 
            className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-sm"
          >
            <span>{option.name}</span>
            <button
              type="button"
              onClick={() => handleRemoveOption(option.id)}
              className="text-gray-500 hover:text-gray-700"
              disabled={disabled}
            >
              <X size={14} />
            </button>
          </div>
        ))}
        
        <Input
          ref={inputRef}
          type="text"
          value={searchValue}
          onChange={handleSearchChange}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedOptions.length === 0 ? placeholder : ''}
          disabled={disabled}
          className="flex-1 min-w-[120px] border-none p-0 h-6 focus-visible:ring-0"
        />
      </div>
      
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
      
      {isOpen && searchValue && filteredOptions.length === 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md py-1 border border-gray-200">
          <div className="px-4 py-2 text-sm text-gray-500">No se encontraron resultados</div>
        </div>
      )}
    </div>
  );
};

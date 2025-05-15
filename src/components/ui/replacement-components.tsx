import React from 'react';
import { Label } from './Label';
import { Input } from './Input';

// Tipos compartidos
export interface AutocompleteOption {
  id: string;
  name: string;
}

export interface MultiSelectOption {
  id: string;
  name: string;
}

// Interfaces de props
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

// Componentes simplificados para producción
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
  return (
    <div className={`relative ${className}`}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <Input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
};

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
  return (
    <div className={`relative ${className}`}>
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
              onClick={() => onChange(selectedOptions.filter(o => o.id !== option.id))}
              className="text-gray-500 hover:text-gray-700"
              disabled={disabled}
            >
              ×
            </button>
          </div>
        ))}
        
        <Input
          type="text"
          placeholder={selectedOptions.length === 0 ? placeholder : ''}
          disabled={disabled}
          className="flex-1 min-w-[120px] border-none p-0 h-6 focus-visible:ring-0"
        />
      </div>
      
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
};

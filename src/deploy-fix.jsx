// Este archivo proporciona implementaciones mínimas de componentes
// que no existen o tienen problemas de importación en producción
import React from 'react';

// Componentes simulados para producción
export const Autocomplete = ({ value, onChange, onSelect, label, placeholder }) => (
  <div className="autocomplete-wrapper">
    {label && <label>{label}</label>}
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || "Buscar..."}
    />
  </div>
);

export const MultiSelect = ({ selectedOptions, onChange, label, placeholder }) => (
  <div className="multi-select-wrapper">
    {label && <label>{label}</label>}
    <div className="selected-options">
      {selectedOptions?.map?.(option => (
        <span key={option.id} className="selected-option">
          {option.name}
          <button onClick={() => onChange(selectedOptions.filter(o => o.id !== option.id))}>×</button>
        </span>
      ))}
      <input placeholder={placeholder || "Seleccionar..."} />
    </div>
  </div>
);

// Tipos para ayudar en la compilación
export const AutocompleteOption = {
  id: '',
  name: ''
};

export const MultiSelectOption = {
  id: '',
  name: ''
};

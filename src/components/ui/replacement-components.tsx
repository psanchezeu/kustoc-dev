import React, { useState } from 'react';
import { Label } from './Label';
import { Input } from './Input';
import { cn } from '../../lib/utils';

// Tipos compartidos
export interface AutocompleteOption {
  id: string;
  name: string;
}

export interface MultiSelectOption {
  id: string;
  name: string;
}

// Interfaces para los componentes de Tabs
interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

interface TabsListProps {
  className?: string;
  children: React.ReactNode;
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  value: string;
  children: React.ReactNode;
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  value: string;
  children: React.ReactNode;
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

// Crear un contexto para compartir el estado de las pestañas
type TabsContextValue = {
  selectedValue: string;
  onValueChange: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

// Hook para utilizar el contexto de las pestañas
function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a TabsProvider");
  }
  return context;
}

// Implementación de los componentes de Tabs
export function Tabs({
  defaultValue,
  value,
  onValueChange,
  className,
  children,
  ...props
}: TabsProps) {
  const [selectedTab, setSelectedTab] = useState<string>(value || defaultValue || "");

  const handleValueChange = (newValue: string) => {
    if (!value) {
      setSelectedTab(newValue);
    }
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  // Crear el valor de contexto
  const contextValue: TabsContextValue = {
    selectedValue: value || selectedTab,
    onValueChange: handleValueChange,
  };

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={cn("tabs", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children, ...props }: TabsListProps) {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  className,
  value,
  children,
  ...props
}: TabsTriggerProps) {
  // Usar el contexto para acceder al valor seleccionado
  const { selectedValue, onValueChange } = useTabsContext();
  const isActive = selectedValue === value;
  
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? "active" : "inactive"}
      onClick={() => onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive && "bg-background text-foreground shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  className,
  value,
  children,
  ...props
}: TabsContentProps) {
  // Usar el contexto para acceder al valor seleccionado
  const { selectedValue } = useTabsContext();
  const isActive = selectedValue === value;
  
  if (!isActive) return null;
  
  return (
    <div
      role="tabpanel"
      data-state={isActive ? "active" : "inactive"}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

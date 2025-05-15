import * as React from "react";
import { useState } from "react";
import { cn } from "../../lib/utils";

interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

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

  // Pass the selected value to children
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<any>, {
        selectedValue: value || selectedTab,
        onValueChange: handleValueChange,
      });
    }
    return child;
  });

  return (
    <div className={cn("tabs", className)} {...props}>
      {childrenWithProps}
    </div>
  );
}

export interface TabsListProps {
  className?: string;
  children: React.ReactNode;
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

export interface TabsTriggerProps {
  className?: string;
  value: string;
  children: React.ReactNode;
  selectedValue?: string;
  onValueChange?: (value: string) => void;
}

export function TabsTrigger({
  className,
  value,
  children,
  selectedValue,
  onValueChange,
  ...props
}: TabsTriggerProps) {
  const isActive = selectedValue === value;
  
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? "active" : "inactive"}
      onClick={() => onValueChange && onValueChange(value)}
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

export interface TabsContentProps {
  className?: string;
  value: string;
  children: React.ReactNode;
  selectedValue?: string;
}

export function TabsContent({
  className,
  value,
  children,
  selectedValue,
  ...props
}: TabsContentProps) {
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



import { forwardRef } from "react";
import { cn } from "../../lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

/**
 * Select component for forms
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = "Select";

export interface SelectOptionProps extends React.OptionHTMLAttributes<HTMLOptionElement> {}

/**
 * Option for Select component
 */
const SelectOption = forwardRef<HTMLOptionElement, SelectOptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <option
        className={cn("text-sm", className)}
        ref={ref}
        {...props}
      >
        {children}
      </option>
    );
  }
);

SelectOption.displayName = "SelectOption";

export { Select, SelectOption };

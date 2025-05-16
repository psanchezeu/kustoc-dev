import { forwardRef } from "react";
import { cn } from "../../lib/utils";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  optional?: boolean;
}

/**
 * Label component for form fields
 */
const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, optional, ...props }, ref) => {
    return (
      <label
        className={cn(
          "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
        {optional && <span className="ml-1 text-sm text-muted-foreground">(opcional)</span>}
      </label>
    );
  }
);

Label.displayName = "Label";

export { Label };

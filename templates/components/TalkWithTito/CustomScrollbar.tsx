import React, { forwardRef } from "react";

interface CustomScrollbarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const CustomScrollbar = forwardRef<HTMLDivElement, CustomScrollbarProps>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`scrollbar-thin overflow-y-auto ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CustomScrollbar.displayName = "CustomScrollbar";

export default CustomScrollbar;

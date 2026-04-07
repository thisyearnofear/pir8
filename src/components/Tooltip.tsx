import React from "react";

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: "top" | "bottom";
}

export function Tooltip({ children, content, position = "top" }: TooltipProps) {
  return (
    <div className="relative group">
      {children}
      <div
        className={`absolute ${position === "top" ? "bottom-full mb-2" : "top-full mt-2"} 
                       left-1/2 -translate-x-1/2 px-3 py-2 bg-slate-800 border border-slate-600 
                       rounded-lg text-xs text-gray-200 whitespace-nowrap opacity-0 
                       group-hover:opacity-100 transition-opacity pointer-events-none z-50
                       shadow-lg`}
      >
        {content}
        <div
          className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-slate-600 
                        rotate-45 ${position === "top" ? "top-full -mt-1 border-b border-r" : "bottom-full -mb-1 border-t border-l"}`}
        />
      </div>
    </div>
  );
}

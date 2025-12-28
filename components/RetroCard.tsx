import React from 'react';

interface RetroCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  accent?: 'sage' | 'rust' | 'paper';
}

export const RetroCard: React.FC<RetroCardProps> = ({ title, children, className = "", accent = 'sage' }) => {
  const borderColors = {
    sage: 'border-sage-700',
    rust: 'border-rust',
    paper: 'border-paper',
  };

  const textColors = {
    sage: 'text-sage-300',
    rust: 'text-orange-300',
    paper: 'text-amber-100',
  };

  return (
    <div className={`relative p-1 ${className}`}>
        {/* Top decorations */}
        <div className="flex justify-between items-center mb-1 select-none text-[10px] opacity-50 font-mono">
            <span>+</span>
            <span className="tracking-[0.2em]">................................</span>
            <span>+</span>
        </div>

        <fieldset className={`border ${borderColors[accent]} border-dashed p-4 relative bg-void-deep/50`}>
            {title && (
                <legend className={`px-2 font-mono text-sm uppercase tracking-widest ${textColors[accent]} font-bold bg-void`}>
                    ★ {title}
                </legend>
            )}
            {children}
        </fieldset>
    </div>
  );
};
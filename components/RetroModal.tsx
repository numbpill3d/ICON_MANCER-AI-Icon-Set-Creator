import React from 'react';
import { RetroCard } from './RetroCard';

interface Props {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
}

export const RetroModal: React.FC<Props> = ({ isOpen, title, children, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-void-deep/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md animate-in zoom-in-95 duration-300">
        <RetroCard title={title} accent="rust">
          {onClose && (
            <button 
              onClick={onClose}
              className="absolute top-2 right-2 text-sage-dim hover:text-rust font-mono text-xl"
            >
              ×
            </button>
          )}
          <div className="pt-2">
            {children}
          </div>
        </RetroCard>
      </div>
    </div>
  );
};
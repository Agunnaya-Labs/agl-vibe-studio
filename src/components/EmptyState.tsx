import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = ''
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center w-full h-full min-h-96 text-center py-12 px-4 ${className}`}>
      {/* Icon */}
      {Icon && (
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-purple/10 border border-brand-purple/20">
            <Icon className="w-8 h-8 text-brand-purple" strokeWidth={1.5} />
          </div>
        </div>
      )}

      {/* Title */}
      <h3 className="text-lg font-semibold text-white mb-2">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-zinc-400 max-w-sm mb-6">
          {description}
        </p>
      )}

      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-brand-purple/10 hover:bg-brand-purple/20 border border-brand-purple/30 hover:border-brand-purple/50 text-brand-purple font-medium text-sm transition-all duration-200"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

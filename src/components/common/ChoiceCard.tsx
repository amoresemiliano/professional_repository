import React from 'react';
import { IconCheck } from './Icons';

interface ChoiceCardProps {
  id?: string;
  title: string;
  subtitle?: string;
  selected: boolean;
  type?: 'checkbox' | 'radio';
  badge?: React.ReactNode;
  onToggle: () => void;
  actionButton?: React.ReactNode;
  disabled?: boolean;
}

export function ChoiceCard({
  id,
  title,
  subtitle,
  selected,
  type = 'checkbox',
  badge,
  onToggle,
  actionButton,
  disabled = false,
}: ChoiceCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === ' ' || e.key === 'Enter') && !disabled) {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <div
      id={id}
      role={type === 'radio' ? 'radio' : 'checkbox'}
      aria-checked={selected}
      tabIndex={disabled ? -1 : 0}
      className={`choice-card ${selected ? 'selected' : ''}`}
      onClick={() => {
        if (!disabled) onToggle();
      }}
      onKeyDown={handleKeyDown}
      style={{ opacity: disabled ? 0.6 : 1 }}
    >
      <div className={`choice-indicator ${type === 'radio' ? 'radio' : ''}`}>
        {selected && (
          type === 'radio' ? (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
              }}
            />
          ) : (
            <IconCheck size={13} />
          )
        )}
      </div>

      <div className="choice-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span className="choice-title">{title}</span>
          {badge}
        </div>
        {subtitle && <p className="choice-subtitle">{subtitle}</p>}
      </div>

      {actionButton && (
        <div
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {actionButton}
        </div>
      )}
    </div>
  );
}

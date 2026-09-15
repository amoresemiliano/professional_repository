import React from 'react';

interface ScaleOption {
  value: number;
  label: string;
}

interface ScaleSelectorProps {
  id?: string;
  value: number | null;
  isUncertain?: boolean;
  options: ScaleOption[];
  uncertainLabel?: string;
  onChange: (value: number | null, isUncertain: boolean) => void;
  disabled?: boolean;
}

export function ScaleSelector({
  id,
  value,
  isUncertain = false,
  options,
  uncertainLabel = 'No estoy seguro',
  onChange,
  disabled = false,
}: ScaleSelectorProps) {
  return (
    <div id={id} className="scale-selector-container">
      <div className="scale-options">
        {options.map((opt) => {
          const isSelected = !isUncertain && value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              className={`scale-btn ${isSelected ? 'selected' : ''}`}
              onClick={() => onChange(opt.value, false)}
              disabled={disabled}
              aria-pressed={isSelected}
            >
              <span className="scale-num">{opt.value}</span>
              <span className="scale-label">{opt.label}</span>
            </button>
          );
        })}
      </div>

      <div className="scale-uncertain">
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={isUncertain}
            onChange={(e) => {
              if (e.target.checked) {
                onChange(null, true);
              } else {
                onChange(options[2]?.value ?? 3, false);
              }
            }}
            disabled={disabled}
            style={{ accentColor: 'var(--color-brand)' }}
          />
          <span>{uncertainLabel}</span>
        </label>
      </div>
    </div>
  );
}

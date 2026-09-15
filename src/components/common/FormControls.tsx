import React from 'react';
import { IconAlertCircle } from './Icons';

interface FormGroupProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function FormGroup({ children, className = '', style }: FormGroupProps) {
  return <div className={`form-group ${className}`} style={style}>{children}</div>;
}

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  optional?: boolean;
  htmlFor?: string;
}

export function FormLabel({ children, optional = false, htmlFor, ...props }: FormLabelProps) {
  return (
    <label htmlFor={htmlFor} className="form-label" {...props}>
      {children}
      {optional && <span className="form-label-optional">(opcional)</span>}
    </label>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  hint?: string;
}

export function Input({ error, hint, className = '', id, ...props }: InputProps) {
  return (
    <div>
      <input
        id={id}
        className={`form-control ${className}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        {...props}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="form-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="form-error" role="alert">
          <IconAlertCircle size={14} />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  hint?: string;
}

export function Textarea({ error, hint, className = '', id, ...props }: TextareaProps) {
  return (
    <div>
      <textarea
        id={id}
        className={`form-control ${className}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        {...props}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="form-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="form-error" role="alert">
          <IconAlertCircle size={14} />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
}

export function Select({ options, error, hint, className = '', id, ...props }: SelectProps) {
  return (
    <div>
      <select
        id={id}
        className={`form-control ${className}`}
        aria-invalid={error ? 'true' : 'false'}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && !error && <p className="form-hint">{hint}</p>}
      {error && (
        <p className="form-error" role="alert">
          <IconAlertCircle size={14} />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

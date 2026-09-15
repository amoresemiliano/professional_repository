import React from 'react';

interface BadgeProps {
  variant?: 'brand' | 'neutral' | 'priority' | 'success' | 'warning' | 'danger';
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Badge({
  variant = 'neutral',
  icon,
  children,
  className = '',
}: BadgeProps) {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {icon}
      <span>{children}</span>
    </span>
  );
}

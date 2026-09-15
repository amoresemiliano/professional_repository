import React from 'react';

interface BadgeProps {
  variant?: 'brand' | 'neutral' | 'priority' | 'success' | 'warning' | 'danger';
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Badge({
  variant = 'neutral',
  icon,
  children,
  className = '',
  style,
}: BadgeProps) {
  return (
    <span className={`badge badge-${variant} ${className}`} style={style}>
      {icon}
      <span>{children}</span>
    </span>
  );
}

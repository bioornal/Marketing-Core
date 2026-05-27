import React from 'react';

const VARIANTS = {
  primary: 'sc-btn--primary',
  ghost:   'sc-btn--ghost',
  quiet:   'sc-btn--quiet',
  danger:  'sc-btn--danger',
};

const SIZES = {
  sm: 'sc-btn--sm',
  md: 'sc-btn--md',
  lg: 'sc-btn--lg',
};

export function Button({
  as: Tag = 'button',
  variant = 'ghost',
  size = 'md',
  icon = false,
  loading = false,
  disabled,
  className = '',
  children,
  ...rest
}) {
  const classes = [
    'sc-btn',
    VARIANTS[variant] || VARIANTS.ghost,
    SIZES[size] || SIZES.md,
    icon ? 'sc-btn--icon' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <Tag
      className={classes}
      disabled={Tag === 'button' ? (disabled || loading) : undefined}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className="sc-btn__spinner" aria-hidden="true" /> : children}
    </Tag>
  );
}

export default Button;

import React from 'react';

export function SegmentedControl({
  value,
  onChange,
  options = [],
  ariaLabel,
  className = '',
  disabled = false,
  size = 'md',
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`sc-segmented sc-segmented--${size} ${className}`.trim()}
    >
      {options.map((opt) => {
        const optValue   = typeof opt === 'string' ? opt : opt.value;
        const optLabel   = typeof opt === 'string' ? opt : opt.label;
        const optIcon    = typeof opt === 'object' ? opt.icon : null;
        const optCounter = typeof opt === 'object' ? opt.counter : null;
        const optDone    = typeof opt === 'object' ? !!opt.done : false;
        const optDisabled = (typeof opt === 'object' && opt.disabled) || disabled;
        const pressed = value === optValue;
        return (
          <button
            type="button"
            key={optValue}
            role="radio"
            aria-checked={pressed}
            aria-pressed={pressed}
            disabled={optDisabled}
            className={`sc-segmented__option ${optDone ? 'sc-segmented__option--done' : ''}`.trim()}
            onClick={() => onChange?.(optValue)}
          >
            {optIcon ? <span className="sc-segmented__icon" aria-hidden="true">{optIcon}</span> : null}
            <span className="sc-segmented__label">{optLabel}</span>
            {optCounter != null ? <span className="sc-segmented__counter">{optCounter}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;

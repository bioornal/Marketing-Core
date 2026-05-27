import React, { useState } from 'react';

/**
 * Disclosure — sección colapsable con header consistente.
 * Controlado o no controlado. Header con chevron animado.
 */
export function Disclosure({
  eyebrow,
  title,
  hint,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  actions,
  className = '',
  children,
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = typeof controlledOpen === 'boolean';
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const toggle = () => {
    const next = !isOpen;
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  return (
    <section
      className={[
        'sc-disclosure',
        isOpen ? 'sc-disclosure--open' : 'sc-disclosure--closed',
        className,
      ].filter(Boolean).join(' ')}
    >
      <header className="sc-disclosure__header">
        <button
          type="button"
          className="sc-disclosure__trigger"
          aria-expanded={isOpen}
          onClick={toggle}
        >
          <span className="sc-disclosure__chevron" aria-hidden="true">
            <i className="ph-bold ph-caret-right" />
          </span>
          <span className="sc-disclosure__heading">
            {eyebrow && <span className="sc-disclosure__eyebrow">{eyebrow}</span>}
            {title && <span className="sc-disclosure__title">{title}</span>}
            {hint && <span className="sc-disclosure__hint">{hint}</span>}
          </span>
        </button>
        {actions && <div className="sc-disclosure__actions">{actions}</div>}
      </header>
      {isOpen && (
        <div className="sc-disclosure__panel">
          {children}
        </div>
      )}
    </section>
  );
}

export default Disclosure;

import React from 'react';

export function Panel({
  eyebrow,
  title,
  actions,
  footer,
  flush = false,
  className = '',
  children,
}) {
  return (
    <section className={`sc-panel ${className}`.trim()}>
      {(eyebrow || title || actions) ? (
        <header className="sc-panel__header">
          <div className="sc-panel__heading">
            {eyebrow ? <span className="sc-panel__eyebrow">{eyebrow}</span> : null}
            {title ? <h2 className="sc-panel__title">{title}</h2> : null}
          </div>
          {actions ? <div className="sc-panel__actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className={`sc-panel__body ${flush ? 'sc-panel__body--flush' : ''}`.trim()}>
        {children}
      </div>
      {footer ? <footer className="sc-panel__footer">{footer}</footer> : null}
    </section>
  );
}

export default Panel;

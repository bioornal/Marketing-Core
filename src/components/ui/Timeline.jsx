import React from 'react';

/**
 * Timeline — vista vertical cronológica con dots, conectores y thumbnails.
 *
 * items: [{
 *   id, number, title, subtitle, date, thumbnail, state,
 *   pills: [{label, tone}], onClick
 * }]
 */
export function Timeline({ items = [], activeId, className = '' }) {
  return (
    <ol className={`sc-timeline ${className}`.trim()}>
      {items.map((it, i) => {
        const isActive = activeId === it.id;
        const isLast = i === items.length - 1;
        return (
          <li
            key={it.id}
            className={[
              'sc-timeline__item',
              `sc-timeline__item--${it.state || 'empty'}`,
              isActive ? 'sc-timeline__item--active' : '',
              isLast ? 'sc-timeline__item--last' : '',
            ].filter(Boolean).join(' ')}
          >
            <span className="sc-timeline__rail" aria-hidden="true">
              <span className="sc-timeline__dot" />
              {!isLast && <span className="sc-timeline__line" />}
            </span>

            <button
              type="button"
              className="sc-timeline__btn"
              onClick={it.onClick}
              aria-current={isActive ? 'true' : undefined}
            >
              {it.thumbnail ? (
                <span
                  className="sc-timeline__thumb"
                  style={{ backgroundImage: `url(${it.thumbnail})` }}
                  aria-hidden="true"
                />
              ) : (
                <span className="sc-timeline__thumb sc-timeline__thumb--empty" aria-hidden="true">
                  <span>{String(it.number ?? i + 1).padStart(2, '0')}</span>
                </span>
              )}

              <span className="sc-timeline__body">
                <span className="sc-timeline__head">
                  {it.number != null && (
                    <span className="sc-timeline__num">{String(it.number).padStart(2, '0')}</span>
                  )}
                  {it.date && <span className="sc-timeline__date">{it.date}</span>}
                </span>
                {it.title && <span className="sc-timeline__title">{it.title}</span>}
                {it.subtitle && <span className="sc-timeline__subtitle">{it.subtitle}</span>}
                {it.pills?.length > 0 && (
                  <span className="sc-timeline__pills">
                    {it.pills.map((p, j) => (
                      <span
                        key={j}
                        className={`sc-timeline__pill ${p.tone ? `sc-timeline__pill--${p.tone}` : ''}`.trim()}
                      >
                        {p.label}
                      </span>
                    ))}
                  </span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export default Timeline;

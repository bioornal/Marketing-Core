import React, { forwardRef } from 'react';

export const TextArea = forwardRef(function TextArea(
  {
    invalid = false,
    className = '',
    maxLength,
    showCounter = false,
    value,
    ...rest
  },
  ref,
) {
  const classes = [
    'sc-textarea',
    invalid ? 'sc-textarea--invalid' : '',
    className,
  ].filter(Boolean).join(' ');

  const len = typeof value === 'string' ? value.length : 0;
  const over = maxLength != null && len > maxLength;

  return (
    <div className="sc-textarea__wrap">
      <textarea
        ref={ref}
        className={classes}
        value={value}
        maxLength={maxLength}
        {...rest}
      />
      {showCounter ? (
        <div className="sc-textarea__footer">
          <span className={`sc-textarea__counter ${over ? 'sc-textarea__counter--over' : ''}`.trim()}>
            {len}{maxLength != null ? ` / ${maxLength}` : ''}
          </span>
        </div>
      ) : null}
    </div>
  );
});

export default TextArea;

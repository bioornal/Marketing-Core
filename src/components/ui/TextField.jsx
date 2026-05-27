import React, { forwardRef } from 'react';

export const TextField = forwardRef(function TextField(
  { invalid = false, className = '', type = 'text', ...rest },
  ref,
) {
  const classes = [
    'sc-input',
    invalid ? 'sc-input--invalid' : '',
    className,
  ].filter(Boolean).join(' ');
  return <input ref={ref} type={type} className={classes} {...rest} />;
});

export default TextField;

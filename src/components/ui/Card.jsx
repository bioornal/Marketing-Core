import React from 'react';

export function Card({
  as: Tag = 'div',
  raised = false,
  interactive = false,
  selected = false,
  className = '',
  children,
  ...rest
}) {
  const classes = [
    'sc-card',
    raised ? 'sc-card--raised' : '',
    interactive ? 'sc-card--interactive' : '',
    selected ? 'sc-card--selected' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}

export default Card;

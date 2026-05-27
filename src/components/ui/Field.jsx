import React, { useId } from 'react';

export function Field({
  label,
  hint,
  error,
  required = false,
  htmlFor,
  className = '',
  children,
}) {
  const reactId = useId();
  const inputId = htmlFor || reactId;

  let childWithId = children;
  if (React.Children.count(children) === 1 && React.isValidElement(children) && !children.props.id) {
    childWithId = React.cloneElement(children, {
      id: inputId,
      'aria-invalid': error ? 'true' : undefined,
      'aria-describedby': hint || error ? `${inputId}-help` : undefined,
    });
  }

  return (
    <div className={`sc-field ${className}`.trim()}>
      {label ? (
        <label
          className={`sc-field__label ${required ? 'sc-field__label--required' : ''}`.trim()}
          htmlFor={inputId}
        >
          {label}
        </label>
      ) : null}
      {childWithId}
      {error ? (
        <div id={`${inputId}-help`} className="sc-field__error" role="alert">
          {error}
        </div>
      ) : hint ? (
        <div id={`${inputId}-help`} className="sc-field__hint">
          {hint}
        </div>
      ) : null}
    </div>
  );
}

export default Field;

import React from 'react';

const Input = React.forwardRef(({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder = '',
  required = false,
  error = null,
  className = '',
  min,
  max,
  step,
  autoComplete,
  disabled,
  onBlur,
  onFocus,
  onKeyDown,
  onKeyUp
}, ref) => {
  const labelClasses = "mb-1 block text-sm font-manrope font-medium text-theme-secondary";
  const inputClasses = `w-full rounded-[10px] border px-4 py-3 text-[15px] font-inter transition-all duration-150 outline-none
    bg-surface border-theme text-theme-primary placeholder-slate-400 dark:placeholder-slate-500
    focus:border-accent focus:ring-2 focus:ring-accent/20
    ${error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/10' : ''}
    ${className}`;

  return (
    <div className="w-full text-left">
      {label && (
        <label htmlFor={name} className={labelClasses}>
          {label} {required && <span className="text-accent">*</span>}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={inputClasses}
        min={min}
        max={max}
        step={step}
        autoComplete={autoComplete}
        disabled={disabled}
        onBlur={onBlur}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
      />
      {error && (
        <p className="mt-1 text-xs text-red-400 font-inter">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;

import React from 'react';

const Button = ({
  children,
  type = 'button',
  variant = 'primary', // primary, secondary, outline, danger
  className = '',
  disabled = false,
  loading = false,
  onClick,
  id,
  name,
  value,
  title,
  tabIndex,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  'aria-label': ariaLabel,
  'aria-expanded': ariaExpanded,
  'aria-controls': ariaControls
}) => {
  const baseClasses = "inline-flex items-center justify-center font-cabin font-medium text-[16px] rounded-[10px] py-3.5 px-6 transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-accent/50 select-none";
  
  const variants = {
    primary: "bg-accent text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:pointer-events-none hover:scale-[1.02] shadow-btn",
    secondary: "bg-[var(--card2)] text-[var(--text-primary)] hover:bg-[var(--border)] border border-[var(--border)] disabled:opacity-50 disabled:pointer-events-none hover:scale-[1.02]",
    outline: "bg-transparent border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--accent-subtle)] hover:border-[var(--accent-border)] disabled:opacity-50 disabled:pointer-events-none hover:scale-[1.02]",
    danger: "bg-danger text-white hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none hover:scale-[1.02]"
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      id={id}
      name={name}
      value={value}
      title={title}
      tabIndex={tabIndex}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
};

export default Button;

import React from 'react';

/**
 * Reusable Button Component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Button label/content
 * @param {string} [props.type='button'] - Button type (button, submit, reset)
 * @param {'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'} [props.variant='primary'] - Visual style variant
 * @param {boolean} [props.fullWidth=false] - Whether button takes full container width
 * @param {boolean} [props.loading=false] - Loading state spinner
 * @param {boolean} [props.disabled=false] - Disabled state
 * @param {function} [props.onClick] - Click handler
 * @param {React.ReactNode} [props.icon] - Icon to display before text
 * @param {string} [props.className] - Extra Tailwind classes
 */
const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  fullWidth = false,
  loading = false,
  disabled = false,
  onClick,
  icon = null,
  className = '',
  ...rest
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold text-sm rounded-xl px-5 py-2.5 transition-all duration-200 cursor-pointer active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none select-none shadow-xs';
  
  const variants = {
    primary: 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:from-indigo-800 active:to-violet-800 text-white shadow-indigo-500/25 shadow-md hover:shadow-lg hover:shadow-indigo-500/35',
    secondary: 'bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900',
    outline: 'border border-indigo-200 dark:border-slate-700 bg-transparent hover:bg-indigo-50/50 dark:hover:bg-slate-800 text-indigo-900 dark:text-indigo-200',
    ghost: 'bg-transparent hover:bg-indigo-50/60 dark:hover:bg-slate-800 text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20 shadow-md',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${widthStyle} ${className}`}
      {...rest}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : (
        <span className="flex items-center gap-2">
          {icon && <span className="text-lg">{icon}</span>}
          {children}
        </span>
      )}
    </button>
  );
};

export default Button;

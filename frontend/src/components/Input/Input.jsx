import React from 'react';
const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder = '',
  error = '',
  icon = null,
  required = false,
  className = '',
  ...rest
}) => {
  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={name} className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between">
          <span>
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </span>
        </label>
      )}

      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
            {icon}
          </div>
        )}

        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full px-4 py-2.5 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border text-sm rounded-xl transition-all duration-200 outline-none
            ${icon ? 'pl-10' : ''}
            ${error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
              : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-slate-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-400/20'
            }
            placeholder:text-slate-400 dark:placeholder:text-slate-500
          `}
          {...rest}
        />
      </div>

      {error && (
        <p className="text-xs text-rose-500 font-medium mt-0.5 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
};

export default Input;

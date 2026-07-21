import React from 'react';

/**
 * Reusable Input Component
 * @param {Object} props
 * @param {string} props.label - Input label text
 * @param {string} props.type - Input type (text, email, password, etc.)
 * @param {string} props.name - Field name
 * @param {string} props.value - Field value
 * @param {function} props.onChange - Change handler
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} [props.error] - Error message to display
 * @param {React.ReactNode} [props.icon] - Optional left icon element
 * @param {boolean} [props.required] - Is field required
 * @param {string} [props.className] - Additional wrapper container class
 */
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
        <label htmlFor={name} className="text-sm font-semibold text-slate-200 flex items-center justify-between">
          <span>
            {label}
            {required && <span className="text-rose-400 ml-1">*</span>}
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
          className={`w-full px-4 py-2.5 text-white bg-slate-800/90 border text-sm rounded-xl transition-all duration-200 outline-none
            ${icon ? 'pl-10' : ''}
            ${error 
              ? 'border-rose-500 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/20' 
              : 'border-slate-700/80 hover:border-slate-600 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20'
            }
            placeholder:text-slate-400
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

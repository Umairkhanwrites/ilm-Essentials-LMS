/**
 * Input — Form input with label, validation, and icon support for Ilm Essentials LMS.
 *
 * @module components/ui/Input
 *
 * @example
 * <Input
 *   label="Email Address"
 *   type="email"
 *   placeholder="you@example.com"
 *   icon={<Mail />}
 *   error="Please enter a valid email"
 * />
 *
 * <Input label="Password" type="password" helperText="At least 8 characters" />
 */

import React, { useState, useId } from 'react';
import clsx from 'clsx';
import { Eye, EyeOff } from 'lucide-react';

/**
 * @param {object} props
 * @param {string} [props.label] — Input label text
 * @param {'text'|'email'|'password'|'number'|'tel'|'url'|'search'} [props.type='text'] — Input type
 * @param {string} [props.placeholder] — Placeholder text
 * @param {string} [props.error] — Error message (triggers error state)
 * @param {string} [props.helperText] — Helper text below the input
 * @param {React.ReactNode} [props.icon] — Left icon inside the input
 * @param {boolean} [props.disabled=false] — Disable the input
 * @param {boolean} [props.required=false] — Mark as required
 * @param {'stacked'|'floating'} [props.labelStyle='stacked'] — Label positioning
 * @param {string} [props.className] — Additional CSS classes for the wrapper
 * @param {string} [props.inputClassName] — Additional CSS classes for the input element
 * @param {React.Ref} ref — Forwarded ref to the <input> element
 */
const Input = React.forwardRef(
  (
    {
      label,
      type = 'text',
      placeholder,
      error,
      helperText,
      icon,
      disabled = false,
      required = false,
      labelStyle = 'stacked',
      className,
      inputClassName,
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      ...rest
    },
    ref
  ) => {
    const inputId = useId();

    /** Password visibility toggle */
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const resolvedType = isPassword && showPassword ? 'text' : type;

    /** Floating label: track focus & filled state */
    const [isFocused, setIsFocused] = useState(false);
    const isFloating = labelStyle === 'floating';

    /** Determine if the input has a value (for floating label positioning) */
    const hasValue =
      value !== undefined ? String(value).length > 0 : undefined;

    const handleFocus = (e) => {
      setIsFocused(true);
      onFocus?.(e);
    };
    const handleBlur = (e) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    /** Whether floating label should be raised */
    const floatUp = isFloating && (isFocused || hasValue || !!placeholder);

    return (
      <div className={clsx('w-full', className)}>
        {/* Stacked label */}
        {label && !isFloating && (
          <label
            htmlFor={inputId}
            className={clsx(
              'block mb-1.5 text-sm font-medium font-body',
              error ? 'text-red-600' : 'text-ink-800'
            )}
          >
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative">
          {/* Left icon */}
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 h-4.5 w-4.5 pointer-events-none">
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            type={resolvedType}
            disabled={disabled}
            required={required}
            placeholder={isFloating && !isFocused ? ' ' : placeholder}
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            aria-invalid={!!error || undefined}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                  ? `${inputId}-helper`
                  : undefined
            }
            className={clsx(
              'peer w-full rounded-lg border bg-white font-body text-sm text-ink-900 transition-all duration-200 outline-none',
              // Padding: accommodate icon on left and/or toggle on right
              icon ? 'pl-10' : 'pl-3.5',
              isPassword ? 'pr-10' : 'pr-3.5',
              'py-2.5',
              // Border & focus
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                : 'border-sand-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100',
              // Disabled
              disabled && 'bg-sand-100 text-ink-400 cursor-not-allowed',
              // Floating label extra top padding
              isFloating && 'pt-5 pb-2',
              inputClassName
            )}
            {...rest}
          />

          {/* Floating label */}
          {label && isFloating && (
            <label
              htmlFor={inputId}
              className={clsx(
                'absolute left-3.5 transition-all duration-200 pointer-events-none font-body',
                icon && 'left-10',
                floatUp
                  ? 'top-1.5 text-xs font-medium'
                  : 'top-1/2 -translate-y-1/2 text-sm',
                error
                  ? 'text-red-500'
                  : isFocused
                    ? 'text-primary-600'
                    : 'text-ink-400'
              )}
            >
              {label}
              {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
          )}

          {/* Password toggle */}
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 transition-colors cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-4.5 w-4.5" />
              ) : (
                <Eye className="h-4.5 w-4.5" />
              )}
            </button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-xs font-medium text-red-600 font-body"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Helper text */}
        {!error && helperText && (
          <p
            id={`${inputId}-helper`}
            className="mt-1.5 text-xs text-ink-500 font-body"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export default Input;

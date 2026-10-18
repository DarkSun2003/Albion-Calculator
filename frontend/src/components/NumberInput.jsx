import React, { useState, useEffect, useRef } from 'react';

/**
 * NumberInput - High-precision Albion Artisan numeric input
 * 
 * Solves standard browser <input type="number"> flaws:
 * 1. Prevents the "stuck 0 / undeletable final digit" bug when backspacing to empty.
 * 2. Allows fluid editing of the first digit (e.g., 1000 -> 2000) without caret jumps or resets.
 * 3. Preserves decimal typing (e.g., "4.") without premature stripping.
 * 4. Normalizes to valid number bounds (min/max) smoothly on blur without trapping user keystrokes.
 */
export default function NumberInput({
  value,
  onChange,
  onBlur,
  onFocus,
  onKeyDown,
  min,
  max,
  step = 1,
  className = '',
  placeholder = '0',
  disabled = false,
  allowDecimals = true,
  type = 'number', // Accepted for backward compatibility with <input type="number">
  ...rest
}) {
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  // Convert incoming value to string representation
  const formatPropValue = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '';
    return String(val);
  };

  const [text, setText] = useState(() => formatPropValue(value));

  // Synchronize incoming value changes when external props change
  useEffect(() => {
    if (!isFocused) {
      setText(formatPropValue(value));
    } else {
      // While focused, only update if the numerical value significantly changed from outside
      // (e.g. live price fetch, preset button clicked, or item switch)
      const currentNum = text === '' ? 0 : parseFloat(text);
      const propNum = value === '' || value === null || value === undefined ? 0 : parseFloat(value);
      
      // If external value changed to something genuinely different from user's parsed number
      if (!isNaN(propNum) && !isNaN(currentNum) && propNum !== currentNum) {
        setText(formatPropValue(value));
      }
    }
  }, [value, isFocused]);

  const handleChange = (e) => {
    const rawValue = e.target.value;

    // Allow empty string so user can delete all characters freely without snapping to 0
    if (rawValue === '') {
      setText('');
      if (onChange) {
        onChange({
          ...e,
          target: {
            ...e.target,
            value: '',
            valueAsNumber: 0,
          },
        });
      }
      return;
    }

    // Filter characters: allow digits and at most one decimal point (if allowDecimals)
    let sanitized = rawValue;
    if (allowDecimals) {
      sanitized = rawValue.replace(/[^0-9.]/g, '');
      const parts = sanitized.split('.');
      if (parts.length > 2) {
        sanitized = parts[0] + '.' + parts.slice(1).join('');
      }
    } else {
      sanitized = rawValue.replace(/[^0-9]/g, '');
    }

    // Preserve strings like "000" or "0" while typing so user can edit prefix digits smoothly
    setText(sanitized);

    if (onChange) {
      // Pass synthetic event with the sanitized value so existing handlers can parse it
      onChange({
        ...e,
        target: {
          ...e.target,
          value: sanitized,
          valueAsNumber: parseFloat(sanitized) || 0,
        },
      });
    }
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);

    let finalVal = text.trim();
    let num = parseFloat(finalVal);

    if (finalVal === '' || isNaN(num)) {
      // If left blank, default to min if defined and >= 0, else 0
      const defaultMin = min !== undefined && !isNaN(Number(min)) ? Number(min) : 0;
      num = defaultMin;
      finalVal = String(num);
    } else {
      // Clamp to min/max if specified
      if (min !== undefined && !isNaN(Number(min)) && num < Number(min)) {
        num = Number(min);
        finalVal = String(num);
      }
      if (max !== undefined && !isNaN(Number(max)) && num > Number(max)) {
        num = Number(max);
        finalVal = String(num);
      }
      // Clean up multiple leading zeros like "000" or "0200" into normalized "0" or "200"
      finalVal = String(num);
    }

    setText(finalVal);

    if (onChange) {
      onChange({
        ...e,
        target: {
          ...e.target,
          value: finalVal,
          valueAsNumber: num,
        },
      });
    }

    if (onBlur) onBlur(e);
  };

  const handleKeyDown = (e) => {
    // Enable ArrowUp / ArrowDown stepping
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const current = parseFloat(text) || 0;
      const stepVal = Number(step) || 1;
      let next = e.key === 'ArrowUp' ? current + stepVal : current - stepVal;

      if (min !== undefined && !isNaN(Number(min))) {
        next = Math.max(Number(min), next);
      }
      if (max !== undefined && !isNaN(Number(max))) {
        next = Math.min(Number(max), next);
      }

      const nextStr = String(next);
      setText(nextStr);

      if (onChange) {
        onChange({
          ...e,
          target: {
            ...e.target,
            value: nextStr,
            valueAsNumber: next,
          },
        });
      }
      return;
    }

    if (onKeyDown) onKeyDown(e);
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode={allowDecimals ? 'decimal' : 'numeric'}
      value={text}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      autoComplete="off"
      spellCheck="false"
      {...rest}
    />
  );
}

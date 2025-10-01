import React from 'react';

interface EvaluationInputProps {
  type?: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  isLocked?: boolean;
  className?: string;
  as?: 'input' | 'textarea' | 'select';
  children?: React.ReactNode;
}

const EvaluationInput: React.FC<EvaluationInputProps> = ({
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  isLocked = false,
  className = '',
  as = 'input',
  children
}) => {
  const isDisabled = disabled || isLocked;

  const baseClass = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const lockedClass = isLocked ? "bg-gray-100 text-gray-600 cursor-not-allowed" : "bg-white";
  const fullClassName = `${baseClass} ${lockedClass} ${className}`;

  if (as === 'textarea') {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={fullClassName}
        placeholder={placeholder}
        required={required}
        disabled={isDisabled}
        rows={3}
      />
    );
  }

  if (as === 'select') {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={fullClassName}
        required={required}
        disabled={isDisabled}
      >
        {children}
      </select>
    );
  }

  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={fullClassName}
      placeholder={placeholder}
      required={required}
      disabled={isDisabled}
    />
  );
};

export default EvaluationInput;

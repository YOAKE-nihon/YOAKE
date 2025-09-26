import React from 'react';

interface FormFieldProps {
  label: string;
  name?: string;
  type?: 'text' | 'email' | 'tel' | 'date' | 'select' | 'checkbox' | 'radio' | 'textarea';
  value?: string | string[];
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  onChange?: (name: string, value: any) => void;
  multiple?: boolean;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode; // 子要素サポートを追加
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  name = '',
  type = 'text',
  value = '',
  options = [],
  placeholder,
  required = false,
  error,
  onChange,
  multiple = false,
  className = '',
  disabled = false,
  children, // 子要素を受け取る
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!onChange || !name) return;
    
    const target = e.target;
    
    if (type === 'checkbox' && multiple) {
      const checkboxTarget = target as HTMLInputElement;
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = checkboxTarget.checked
        ? [...currentValues, checkboxTarget.value]
        : currentValues.filter(v => v !== checkboxTarget.value);
      onChange(name, newValues);
    } else if (type === 'checkbox') {
      const checkboxTarget = target as HTMLInputElement;
      onChange(name, checkboxTarget.checked);
    } else {
      onChange(name, target.value);
    }
  };

  const renderField = () => {
    // 子要素が渡された場合はそれを使用
    if (children) {
      return children;
    }

    // 従来の内部レンダリング
    switch (type) {
      case 'select':
        return (
          <select
            name={name}
            value={Array.isArray(value) ? value[0] || '' : value}
            onChange={handleInputChange}
            disabled={disabled}
            className={`form-input ${error ? 'error' : ''}`}
          >
            <option value="">{placeholder || `${label}を選択してください`}</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            name={name}
            value={Array.isArray(value) ? value.join('\n') : value}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            className={`form-input ${error ? 'error' : ''}`}
            rows={4}
          />
        );

      case 'checkbox':
        if (multiple) {
          return (
            <div className="checkbox-group">
              {options.map(option => (
                <label key={option.value} className="checkbox-label">
                  <input
                    type="checkbox"
                    name={name}
                    value={option.value}
                    checked={Array.isArray(value) ? value.includes(option.value) : false}
                    onChange={handleInputChange}
                    disabled={disabled}
                  />
                  <span className="checkbox-text">{option.label}</span>
                </label>
              ))}
            </div>
          );
        }
        return (
          <label className="checkbox-label">
            <input
              type="checkbox"
              name={name}
              checked={Boolean(value)}
              onChange={handleInputChange}
              disabled={disabled}
            />
            <span className="checkbox-text">{label}</span>
          </label>
        );

      case 'radio':
        return (
          <div className="radio-group">
            {options.map(option => (
              <label key={option.value} className="radio-label">
                <input
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={handleInputChange}
                  disabled={disabled}
                />
                <span className="radio-text">{option.label}</span>
              </label>
            ))}
          </div>
        );

      default:
        return (
          <input
            type={type}
            name={name}
            value={Array.isArray(value) ? value.join(', ') : value}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            className={`form-input ${error ? 'error' : ''}`}
          />
        );
    }
  };

  return (
    <div className={`form-group ${className} ${error ? 'has-error' : ''}`}>
      {type !== 'checkbox' && (
        <label className="form-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      
      {renderField()}
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
};

export default FormField;
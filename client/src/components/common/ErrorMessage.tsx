import React from 'react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  onRetry,
  className = '' 
}) => {
  return (
    <div className={`error-message ${className}`}>
      <p>{message}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="text-link mt-2 underline cursor-pointer"
        >
          再試行
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
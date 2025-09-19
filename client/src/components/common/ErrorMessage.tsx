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
    <div className={`error-message-container ${className}`}>
      <div className="error-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2"/>
          <line x1="15" y1="9" x2="9" y2="15" stroke="#ef4444" strokeWidth="2"/>
          <line x1="9" y1="9" x2="15" y2="15" stroke="#ef4444" strokeWidth="2"/>
        </svg>
      </div>
      
      <p className="error-text">{message}</p>
      
      {onRetry && (
        <button 
          className="btn btn-outline retry-button"
          onClick={onRetry}
        >
          再試行
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
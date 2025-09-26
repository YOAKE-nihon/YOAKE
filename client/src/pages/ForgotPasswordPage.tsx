import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { useApi } from '../hooks';
import { validateEmail } from '../utils';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import FormField from '../components/common/FormField';

const ForgotPasswordPage: React.FC = () => {
  const { loading, error, execute } = useApi();
  
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);
    if (validationError) {
      setValidationError('');
    }
  }, [validationError]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    if (!email || !validateEmail(email)) {
      setValidationError('有効なメールアドレスを入力してください');
      return;
    }

    setMessage('');

    try {
      const result = await execute(() =>
        authApi.requestPasswordReset({ email })
      );

      if (result) {
        setMessage('パスワード再設定用のメールを送信しました。メールをご確認ください。');
        setEmail(''); // Clear form on success
      }
    } catch (error) {
      console.error('Password reset request error:', error);
    }
  }, [email, execute]);

  return (
    <div className="form-container">
      <h2 className="form-title">パスワードをお忘れですか？</h2>
      <p className="form-description">
        ご登録のメールアドレスを入力してください。パスワード再設定用のリンクをお送りします。
      </p>
      
      <form onSubmit={handleSubmit} className="form-content">
        <FormField 
          label="メールアドレス" 
          required
          error={validationError}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            className={validationError ? 'input-error' : ''}
            placeholder="example@email.com"
            required
            disabled={loading}
          />
        </FormField>
        
        <div className="form-navigation" style={{ justifyContent: 'center' }}>
          <button 
            type="submit" 
            className="submit-btn" 
            disabled={loading}
          >
            {loading ? (
              <LoadingSpinner size="small" message="" />
            ) : (
              '再設定メールを送信'
            )}
          </button>
        </div>
        
        {/* Success message */}
        {message && (
          <div className="liff-message success" style={{ marginTop: '20px' }}>
            {message}
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <ErrorMessage message={error} className="mt-4" />
        )}
        
        {/* Back to register link */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link to="/" className="text-link">
            登録ページに戻る
          </Link>
        </div>
      </form>
      
      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        fontSize: '0.9em',
        color: '#666'
      }}>
        <p style={{ margin: 0 }}>
          <strong>注意:</strong> メールが届かない場合は、迷惑メールフォルダもご確認ください。
          それでも届かない場合は、入力したメールアドレスが登録時のものと同じか確認してください。
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
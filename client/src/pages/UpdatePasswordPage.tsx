import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../services/api';
import { useApi } from '../hooks';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import FormField from '../components/common/FormField';

const UpdatePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading, error, execute } = useApi();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setMessage('無効なリンクです。パスワード再設定を最初からやり直してください。');
    } else {
      setMessage('新しいパスワードを入力してください。');
    }
  }, [token]);

  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};

    if (!password) {
      errors.password = 'パスワードを入力してください';
    } else if (password.length < 6) {
      errors.password = 'パスワードは6文字以上で入力してください';
    }

    if (!confirmPassword) {
      errors.confirmPassword = '確認用パスワードを入力してください';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'パスワードが一致しません';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [password, confirmPassword]);

  const handleInputChange = useCallback((field: string, value: string) => {
    if (field === 'password') {
      setPassword(value);
    } else if (field === 'confirmPassword') {
      setConfirmPassword(value);
    }

    // Clear validation errors when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [validationErrors]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !token) {
      return;
    }

    try {
      const result = await execute(() =>
        authApi.updatePassword({
          token,
          newPassword: password,
        })
      );

      if (result) {
        setMessage('パスワードが更新されました！');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (error) {
      console.error('Password update error:', error);
    }
  }, [validateForm, token, password, execute, navigate]);

  const togglePasswordVisibility = useCallback((field: 'password' | 'confirmPassword') => {
    if (field === 'password') {
      setShowPassword(prev => !prev);
    } else {
      setShowConfirmPassword(prev => !prev);
    }
  }, []);

  if (!token) {
    return (
      <div className="form-container">
        <h2 className="form-title">パスワード再設定</h2>
        <ErrorMessage message="無効なリンクです。パスワード再設定を最初からやり直してください。" />
        <div className="form-navigation" style={{ justifyContent: 'center', marginTop: '20px' }}>
          <button 
            onClick={() => navigate('/forgot-password')} 
            className="submit-btn"
          >
            パスワード再設定に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="form-container">
      <h2 className="form-title">新しいパスワードの設定</h2>
      
      {message && !error && (
        <div className={`liff-message ${message.includes('更新されました') ? 'success' : ''}`}>
          {message}
        </div>
      )}
      
      {error && <ErrorMessage message={error.message} />}
      
      <form onSubmit={handleSubmit} className="form-content">
        <FormField 
          label="新しいパスワード" 
          required
          error={validationErrors.password}
        >
          <div className="password-group">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={validationErrors.password ? 'input-error' : ''}
              required
              minLength={6}
              disabled={loading}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => togglePasswordVisibility('password')}
              tabIndex={-1}
            >
              {showPassword ? '隠す' : '表示'}
            </button>
          </div>
          <div style={{ fontSize: '0.8em', color: '#666', marginTop: '5px' }}>
            6文字以上で入力してください
          </div>
        </FormField>

        <FormField 
          label="パスワード確認" 
          required
          error={validationErrors.confirmPassword}
        >
          <div className="password-group">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className={validationErrors.confirmPassword ? 'input-error' : ''}
              required
              disabled={loading}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => togglePasswordVisibility('confirmPassword')}
              tabIndex={-1}
            >
              {showConfirmPassword ? '隠す' : '表示'}
            </button>
          </div>
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
              'パスワードを更新'
            )}
          </button>
        </div>
      </form>
      
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        fontSize: '0.9em',
        color: '#666'
      }}>
        <p style={{ margin: 0 }}>
          <strong>セキュリティのため:</strong>
          <br />
          • 他人に推測されにくいパスワードを設定してください
          <br />
          • 他のサービスと同じパスワードは避けてください
        </p>
      </div>
    </div>
  );
};

export default UpdatePasswordPage;
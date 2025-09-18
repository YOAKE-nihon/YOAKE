import React, { useState, useCallback } from 'react';
import { useLiff, useApi } from '../hooks';
import { authApi } from '../services/api';
import { validateEmail, closeLiffWindow } from '../utils';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import FormField from '../components/common/FormField';

type LinkingStatus = 'idle' | 'processing' | 'success' | 'error';

const AccountLinkerPage: React.FC = () => {
  const {
    isLoggedIn,
    profile,
    error: liffError,
    loading: liffLoading,
    login
  } = useLiff(process.env.REACT_APP_LIFF_ID_LINKING!);

  const { loading: linking, error: linkError, execute } = useApi();

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<LinkingStatus>('idle');
  const [validationError, setValidationError] = useState('');

  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);
    if (validationError) {
      setValidationError('');
    }
  }, [validationError]);

  const handleLink = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    if (!email || !validateEmail(email)) {
      setValidationError('有効なメールアドレスを入力してください');
      return;
    }

    if (!profile?.userId) {
      setValidationError('LINE認証情報が取得できませんでした');
      return;
    }

    setStatus('processing');

    try {
      const result = await execute(() =>
        authApi.linkLineAccount({
          email,
          lineUserId: profile.userId,
        })
      );

      if (result) {
        setStatus('success');
        // Auto-close window after success
        setTimeout(() => {
          closeLiffWindow();
        }, 3000);
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Account linking error:', error);
      setStatus('error');
    }
  }, [email, profile, execute]);

  // Loading state
  if (liffLoading) {
    return (
      <div className="form-container">
        <LoadingSpinner message="LIFFを初期化しています..." />
      </div>
    );
  }

  // LIFF error state
  if (liffError) {
    return (
      <div className="form-container">
        <h2 className="form-title">LINEアカウント連携</h2>
        <ErrorMessage message={liffError} />
      </div>
    );
  }

  // Not logged in state
  if (!isLoggedIn) {
    return (
      <div className="form-container">
        <h2 className="form-title">LINEアカウント連携</h2>
        <LoadingSpinner message="LINEログインを確認しています..." />
      </div>
    );
  }

  // Success state
  if (status === 'success') {
    return (
      <div className="form-container">
        <h2 className="form-title">LINEアカウント連携</h2>
        <div className="liff-message success">
          アカウントの連携が完了しました！
          <br />
          このウィンドウは自動的に閉じられます。
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="form-container">
      <h2 className="form-title">LINEアカウント連携</h2>
      
      {/* Profile confirmation */}
      {profile && (
        <div className="profile-header">
          {profile.pictureUrl && (
            <img 
              src={profile.pictureUrl} 
              alt="LINE Profile" 
              className="profile-icon" 
            />
          )}
          <p>
            <strong>{profile.displayName}</strong> として連携します
          </p>
        </div>
      )}

      <p className="form-description">
        会員登録時に使用したメールアドレスを入力してください。
      </p>
      
      {/* Errors */}
      {linkError && <ErrorMessage message={linkError.message} />}
      {status === 'error' && (
        <ErrorMessage message="アカウント連携に失敗しました。メールアドレスを確認してください。" />
      )}
      
      <form onSubmit={handleLink} className="form-content">
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
            disabled={linking}
          />
        </FormField>
        
        <div className="form-navigation" style={{ justifyContent: 'center' }}>
          <button 
            type="submit" 
            className="submit-btn" 
            disabled={linking || status === 'processing'}
          >
            {linking || status === 'processing' ? (
              <LoadingSpinner size="small" message="" />
            ) : (
              '連携する'
            )}
          </button>
        </div>
      </form>
      
      <div style={{ 
        marginTop: '20px', 
        textAlign: 'center', 
        fontSize: '0.9em', 
        color: '#666' 
      }}>
        <p>
          ※ 会員登録時に入力したメールアドレスと同じものを入力してください
        </p>
      </div>
    </div>
  );
};

export default AccountLinkerPage;
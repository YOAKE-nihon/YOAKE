import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const response = await axios.post('/api/request-password-reset', { email });
      setMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">パスワードをお忘れですか？</h2>
      <p className="form-description">
        ご登録のメールアドレスを入力してください。パスワード再設定用のリンクをお送りします。
      </p>
      <form onSubmit={handleSubmit} className="form-content">
        <div className="form-group">
          <label htmlFor="email">メールアドレス</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-navigation" style={{ justifyContent: 'center' }}>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? '送信中...' : '再設定メールを送信'}
          </button>
        </div>
        {message && <p className="liff-message success" style={{ marginTop: '20px' }}>{message}</p>}
        {error && <p className="error-message" style={{ marginTop: '20px' }}>{error}</p>}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link to="/" className="text-link">登録ページに戻る</Link>
        </div>
      </form>
    </div>
  );
}

export default ForgotPasswordPage;

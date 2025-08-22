import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// このコンポーネントはまだ未完成です。
// Supabaseの `onAuthStateChange` を使って、
// パスワード更新セッションを検知するロジックが必要です。

function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // ここでSupabaseクライアントを初期化し、
    // onAuthStateChangeイベントをリッスンするロジックを後で追加します。
    setMessage('新しいパスワードを入力してください。');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // ここでSupabaseの `updateUser` メソッドを呼び出すロジックを後で追加します。
    alert('（未実装）パスワードが更新されました！');
    navigate('/'); // 仮にトップページに戻る
  };
  
  return (
    <div className="form-container">
      <h2 className="form-title">新しいパスワードの設定</h2>
      <p className="form-description">{message}</p>
      <form onSubmit={handleSubmit} className="form-content">
        <div className="form-group">
          <label htmlFor="new-password">新しいパスワード</label>
          <input
            type="password"
            id="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <div className="form-navigation" style={{ justifyContent: 'center' }}>
          <button type="submit" className="submit-btn">
            パスワードを更新
          </button>
        </div>
      </form>
    </div>
  );
}

export default UpdatePasswordPage;

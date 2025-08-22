import React, { useState, useEffect } from 'react';
import axios from 'axios';

// LIFF SDKはindex.htmlで読み込まれるグローバルな `window.liff` を使用します

function AccountLinkerPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('initializing'); // 'initializing', 'idle', 'processing', 'success', 'error'
  const [message, setMessage] = useState('LIFFを初期化しています...');
  
  useEffect(() => {
    const initializeLiff = async () => {
      try {
        const liff = window.liff;
        if (!liff) throw new Error('LIFF SDKの読み込みに失敗しました。');

        await liff.init({ liffId: process.env.REACT_APP_LIFF_ID_LINKING });

        if (liff.isLoggedIn()) {
          setStatus('idle');
          setMessage('会員登録時に使用したメールアドレスを入力してください。');
        } else {
          // 未ログインなら、ログインを促す
          liff.login({ redirectUri: window.location.href });
        }
      } catch (err) {
        console.error("LIFF Init Error:", err);
        setStatus('error');
        setMessage('LIFFの初期化に失敗しました。');
      }
    };
    initializeLiff();
  }, []);

  const handleLink = async (e) => {
    e.preventDefault();
    if (!email) {
      setStatus('error');
      setMessage('メールアドレスを入力してください。');
      return;
    }
    setStatus('processing');
    setMessage('アカウントを連携しています...');
    try {
      const liff = window.liff;
      const profile = await liff.getProfile();
      const lineUserId = profile.userId;

      await axios.post('/api/link-line-account', { email, lineUserId });

      setStatus('success');
      setMessage('アカウントの連携が完了しました！');
      
      if (liff.isInClient()) {
        setTimeout(() => liff.closeWindow(), 3000);
      }
    } catch (err) {
      console.error("Linking Error:", err);
      setStatus('error');
      setMessage(err.response?.data?.message || '連携処理中にエラーが発生しました。');
    }
  };
  
  // 画面に表示する内容
  const renderContent = () => {
    if (status === 'initializing') {
      return <p className="liff-message">{message}</p>;
    }
    if (status === 'error') {
      return <p className="liff-message error">{message}</p>;
    }
    if (status === 'success') {
      return <p className="liff-message success">{message}</p>;
    }
    if (status === 'processing') {
      return <p className="liff-message">{message}</p>;
    }
    // status === 'idle' の場合、入力フォームを表示
    return (
      <form onSubmit={handleLink} className="form-content">
        <p className="form-description">{message}</p>
        <div className="form-group">
          <label htmlFor="email">メールアドレス</label>
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-navigation" style={{justifyContent: 'center'}}>
          <button type="submit" className="submit-btn" disabled={status === 'processing'}>
            連携する
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="form-container">
      <h2 className="form-title">LINEアカウント連携</h2>
      {renderContent()}
    </div>
  );
}

export default AccountLinkerPage;

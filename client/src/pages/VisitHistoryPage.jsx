import React, { useState, useEffect } from 'react';
import axios from 'axios'; // ★★★ この行をファイルの先頭に移動しました ★★★
import { Link } from 'react-router-dom'; // 戻るボタンでLinkを使うためインポート

function VisitHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const liff = window.liff;
        if (!liff) throw new Error('LIFF SDKが見つかりません。');
        await liff.init({ liffId: process.env.REACT_APP_LIFF_ID_HISTORY }); // ★ .envに履歴用LIFF IDを追加してください

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const profile = await liff.getProfile();
        const response = await axios.get('/api/visit-history', {
          params: { lineUserId: profile.userId }
        });

        if (response.data.success) {
          setHistory(response.data.data);
        } else {
          throw new Error(response.data.message);
        }
      } catch (err) {
        console.error('Visit History Error:', err);
        setError(err.message || '履歴の取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const renderContent = () => {
    if (loading) {
      return <p className="liff-message">来店履歴を読み込んでいます...</p>;
    }
    if (error) {
      return <p className="liff-message error">{error}</p>;
    }
    if (history.length === 0) {
        return <p className="liff-message">来店履歴はまだありません。</p>;
    }
    return (
        <ul className="history-list">
            {history.map(visit => (
                <li key={visit.id} className="history-item">
                    <div className="history-date">{new Date(visit.check_in_at).toLocaleDateString('ja-JP')}</div>
                    <div className="history-details">
                        <span className="history-store">{visit.store_name}</span>
                        <span className="history-purpose">{visit.visit_purpose || '目的未設定'}</span>
                    </div>
                </li>
            ))}
        </ul>
    );
  };


  return (
    <div className="form-container" style={{maxWidth: '800px'}}>
      <h2 className="form-title">全来店履歴</h2>
      {renderContent()}
       <div className="form-navigation" style={{justifyContent: 'center', marginTop: '20px', borderTop: 'none'}}>
        <Link to="/membership-card" className="prev-btn" style={{textDecoration: 'none'}}>会員証に戻る</Link>
      </div>
    </div>
  );
}

export default VisitHistoryPage;
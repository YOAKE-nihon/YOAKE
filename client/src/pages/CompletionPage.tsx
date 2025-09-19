import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const CompletionPage: React.FC = () => {
  useEffect(() => {
    // 5秒後に自動的にLIFF画面を閉じる（LIFF環境の場合）
    const timer = setTimeout(() => {
      if (window.liff && window.liff.isInClient()) {
        window.liff.closeWindow();
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    if (window.liff && window.liff.isInClient()) {
      window.liff.closeWindow();
    } else {
      // LIFF外の場合は履歴を戻る
      window.history.back();
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">完了しました！</h2>
      
      <div className="completion-content" style={{ textAlign: 'center', padding: '20px' }}>
        <div style={{ fontSize: '60px', marginBottom: '20px' }}>✅</div>
        
        <p style={{ fontSize: '18px', marginBottom: '20px' }}>
          処理が正常に完了しました。<br />
          LINEメニューからサービスをご利用ください。
        </p>
        
        <div className="form-navigation" style={{ justifyContent: 'center', marginTop: '30px' }}>
          <button 
            className="submit-btn"
            onClick={handleClose}
            style={{ minWidth: '200px' }}
          >
            LINEに戻る
          </button>
          
          <Link 
            to="/membership-card" 
            className="prev-btn"
            style={{ 
              minWidth: '200px', 
              textAlign: 'center',
              display: 'inline-block',
              marginTop: '10px'
            }}
          >
            会員証を確認
          </Link>
        </div>
        
        <p style={{ 
          fontSize: '14px', 
          color: '#666', 
          marginTop: '20px' 
        }}>
          5秒後に自動的に閉じます...
        </p>
      </div>
    </div>
  );
};

export default CompletionPage;
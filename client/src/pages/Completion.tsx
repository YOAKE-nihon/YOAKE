import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLiff } from '../hooks';

const CompletionPage: React.FC = () => {
  const { closeWindow } = useLiff();

  useEffect(() => {
    // 5秒後に自動的にLIFF画面を閉じる
    const timer = setTimeout(() => {
      if (closeWindow) {
        closeWindow();
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [closeWindow]);

  const handleClose = () => {
    if (closeWindow) {
      closeWindow();
    }
  };

  return (
    <div className="completion-page">
      <div className="completion-container">
        <div className="completion-content">
          <div className="success-icon">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="40" fill="#4CAF50"/>
              <path 
                d="M25 40L35 50L55 30" 
                stroke="white" 
                strokeWidth="4" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
          
          <h1 className="completion-title">
            完了しました！
          </h1>
          
          <p className="completion-message">
            処理が正常に完了しました。<br />
            LINEメニューからサービスをご利用ください。
          </p>
          
          <div className="completion-actions">
            <button 
              className="btn btn-primary"
              onClick={handleClose}
            >
              LINEに戻る
            </button>
            
            <Link 
              to="/membership-card" 
              className="btn btn-secondary"
            >
              会員証を確認
            </Link>
          </div>
          
          <p className="auto-close-message">
            5秒後に自動的に閉じます...
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompletionPage;
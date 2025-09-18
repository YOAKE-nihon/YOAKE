import React from 'react';

const CompletionPage: React.FC = () => {
  // LINE公式アカウントの友だち追加URL（必要に応じて設定）
  const lineOfficialAccountUrl = 'https://lin.ee/YOUR_LINE_OA_ID';

  return (
    <div className="form-container">
      <h2 className="form-title">会員登録ありがとうございます！</h2>
      <div className="completion-message">
        <p>会員登録と決済手続きが完了いたしました。</p>
        <p style={{ fontWeight: 'bold', margin: '20px 0' }}>
          あなたのLINEに、アカウント連携のご案内メッセージをお送りしました。
        </p>
        <p>
          LINEアプリを開き、メッセージ内の「アカウント連携に進む」ボタンをタップして、
          最後のステップを完了してください。
        </p>
        <div style={{ 
          marginTop: '30px', 
          padding: '20px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px' 
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>次のステップ</h4>
          <ol style={{ margin: 0, paddingLeft: '20px' }}>
            <li>LINEアプリを開く</li>
            <li>YOAKEからのメッセージを確認</li>
            <li>「アカウント連携に進む」をタップ</li>
            <li>登録したメールアドレスを入力</li>
            <li>連携完了！</li>
          </ol>
        </div>
      </div>
      
      {/* 
      メッセージが届かない場合のフォールバック
      <div className="form-navigation" style={{ justifyContent: 'center', marginTop: '30px' }}>
        <a 
          href={lineOfficialAccountUrl} 
          className="prev-btn" 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ textDecoration: 'none' }}
        >
          メッセージが届かない場合
        </a>
      </div>
      */}
    </div>
  );
};

export default CompletionPage;
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage.jsx';
import PaymentPage from './pages/PaymentPage.jsx';
import AccountLinkerPage from './pages/AccountLinkerPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import UpdatePasswordPage from './pages/UpdatePasswordPage.jsx';
import StoreCheckinPage from './pages/StoreCheckinPage.jsx';
import MembershipCardPage from './pages/MembershipCardPage.jsx';
import VisitHistoryPage from './pages/VisitHistoryPage.jsx';
import './App.css';

const CompletionPage = () => {
  // ここには、ユーザーがメッセージを見逃した場合のフォールバックとして、
  // あなたのLINE公式アカウントの友だち追加URLを設定しておくと、より親切です。
  const lineOfficialAccountUrl = 'https://lin.ee/YOUR_LINE_OA_ID'; 

  return (
    <div className="form-container">
      <h2 className="form-title">会員登録ありがとうございます！</h2>
      <div className="completion-message">
        <p>会員登録と決済手続きが完了いたしました。</p>
        <p style={{fontWeight: 'bold', margin: '20px 0'}}>あなたのLINEに、アカウント連携のご案内メッセージをお送りしました。</p>
        <p>LINEアプリを開き、メッセージ内の「アカウント連携に進む」ボタンをタップして、最後のステップを完了してください。</p>
      </div>
      {/*<div className="form-navigation" style={{justifyContent: 'center', marginTop: '30px'}}>
        <a href={lineOfficialAccountUrl} className="prev-btn" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          メッセージが届かない場合
        </a>
      </div>*/}
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="back-img-container">
        <img className="back-img" src="/cafe-back-1.jpg" alt="cafe-background" />
      </div>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<RegisterPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/completion" element={<CompletionPage />} />
          <Route path="/link-account" element={<AccountLinkerPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/update-password" element={<UpdatePasswordPage />} />
          <Route path="/check-in" element={<StoreCheckinPage />} />
          <Route path="/membership-card" element={<MembershipCardPage />} />
          <Route path="/visit-history" element={<VisitHistoryPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

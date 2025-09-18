import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import PaymentPage from './pages/PaymentPage';
import AccountLinkerPage from './pages/AccountLinkerPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import UpdatePasswordPage from './pages/UpdatePasswordPage';
import StoreCheckinPage from './pages/StoreCheckinPage';
import MembershipCardPage from './pages/MembershipCardPage';
import VisitHistoryPage from './pages/VisitHistoryPage';
import CompletionPage from './pages/CompletionPage';
import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <div className="back-img-container">
        <img 
          className="back-img" 
          src="/cafe-back-1.jpg" 
          alt="cafe-background" 
        />
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
};

export default App;
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useLiff, useApi } from '../hooks';
import { userApi } from '../services/api';
import { Visit } from '../types';
import { formatDate } from '../utils';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

const VisitHistoryPage: React.FC = () => {
  const {
    isLoggedIn,
    profile,
    error: liffError,
    loading: liffLoading,
    login
  } = useLiff(process.env.REACT_APP_LIFF_ID_HISTORY!);

  const { loading, error, execute } = useApi<{ visits: Visit[] }>();
  
  // ローカルstateでhistoryを管理
  const [history, setHistory] = useState<Visit[]>([]);

  const fetchHistory = useCallback(async () => {
    if (!profile?.userId) return;

    const result = await execute(() =>
      userApi.getVisitHistory({ lineUserId: profile.userId })
    );

    if (result?.visits) {
      setHistory(result.visits);
    }
  }, [profile, execute]);

  useEffect(() => {
    if (isLoggedIn && profile?.userId) {
      fetchHistory();
    }
  }, [isLoggedIn, profile, fetchHistory]);

  // 以下は既存のコードと同じ
  // Loading state
  if (liffLoading) {
    return (
      <div className="form-container" style={{ maxWidth: '800px' }}>
        <LoadingSpinner message="アプリを初期化しています..." />
      </div>
    );
  }

  // LIFF error state
  if (liffError) {
    return (
      <div className="form-container" style={{ maxWidth: '800px' }}>
        <h2 className="form-title">全来店履歴</h2>
        <ErrorMessage message={liffError} />
      </div>
    );
  }

  // Not logged in state
  if (!isLoggedIn) {
    return (
      <div className="form-container" style={{ maxWidth: '800px' }}>
        <h2 className="form-title">全来店履歴</h2>
        <LoadingSpinner message="LINEログインを確認しています..." />
      </div>
    );
  }

  const renderContent = () => {
    if (loading) {
      return <LoadingSpinner message="来店履歴を読み込んでいます..." />;
    }

    if (error) {
      return (
        <ErrorMessage 
          message={error}
          onRetry={fetchHistory}
        />
      );
    }

    if (!history || history.length === 0) {
      return (
        <div className="liff-message">
          来店履歴はまだありません。
          <br />
          店舗をご利用いただくと、こちらに履歴が表示されます。
        </div>
      );
    }

    return (
      <ul className="history-list">
        {history.map(visit => (
          <li key={visit.id} className="history-item">
            <div className="history-date">
              {formatDate(visit.checkInAt)}
            </div>
            <div className="history-details">
              <span className="history-store">{visit.storeName}</span>
              <span className="history-purpose">
                {visit.visitPurpose || '目的未設定'}
              </span>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="form-container" style={{ maxWidth: '800px' }}>
      <h2 className="form-title">全来店履歴</h2>
      
      {/* Stats Summary */}
      {history && history.length > 0 && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, fontSize: '1.1em', fontWeight: 'bold' }}>
            総来店回数: <span style={{ color: 'var(--primary-color)' }}>
              {history.length}回
            </span>
          </p>
        </div>
      )}
      
      {renderContent()}
      
      <div className="form-navigation" style={{ 
        justifyContent: 'center', 
        marginTop: '20px', 
        borderTop: 'none' 
      }}>
        <Link 
          to="/membership-card" 
          className="prev-btn" 
          style={{ textDecoration: 'none' }}
        >
          会員証に戻る
        </Link>
      </div>
      
      {/* Help text */}
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        fontSize: '0.9em',
        color: '#666'
      }}>
        <p style={{ margin: 0 }}>
          <strong>ヒント:</strong> 店舗でQRコードをスキャンしてチェックインすると、
          来店履歴に自動的に記録されます。アンケートにお答えいただくと、
          より詳細な分析データが会員証に反映されます。
        </p>
      </div>
    </div>
  );
};

export default VisitHistoryPage;
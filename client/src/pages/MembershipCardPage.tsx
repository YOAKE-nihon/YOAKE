import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { useLiff, useApi } from '../hooks';
import { userApi } from '../services/api';
import { MembershipCardData } from '../types';
import { formatChartData, chartOptions, formatDate } from '../utils';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const MembershipCardPage: React.FC = () => {
  const {
    isLoggedIn,
    profile,
    error: liffError,
    loading: liffLoading,
    login
  } = useLiff(process.env.REACT_APP_LIFF_ID_CARD!);

  const { loading, error, execute } = useApi<MembershipCardData>();

  const [cardData, setCardData] = useState<MembershipCardData | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  const fetchCardData = useCallback(async () => {
    if (!profile?.userId) return;

    const result = await execute(() =>
      userApi.getMembershipCard({ lineUserId: profile.userId })
    );

    if (result) {
      setCardData(result);
    }
  }, [profile, execute]);

  useEffect(() => {
    if (isLoggedIn && profile?.userId) {
      fetchCardData();
    }
  }, [isLoggedIn, profile, fetchCardData]);

  const handleCardClick = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  // Loading state
  if (liffLoading) {
    return (
      <div className="form-container">
        <LoadingSpinner message="会員証を準備しています..." />
      </div>
    );
  }

  // LIFF error state
  if (liffError) {
    return (
      <div className="form-container">
        <h2 className="form-title">デジタル会員証</h2>
        <ErrorMessage message={liffError} />
      </div>
    );
  }

  // Not logged in state
  if (!isLoggedIn) {
    return (
      <div className="form-container">
        <h2 className="form-title">デジタル会員証</h2>
        <LoadingSpinner message="LINEログインを確認しています..." />
      </div>
    );
  }

  // Loading card data
  if (loading) {
    return (
      <div className="form-container">
        <LoadingSpinner message="会員証データを読み込んでいます..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="form-container">
        <h2 className="form-title">デジタル会員証</h2>
        <ErrorMessage 
          message={error.message}
          onRetry={fetchCardData}
        />
      </div>
    );
  }

  // No card data
  if (!cardData) {
    return (
      <div className="form-container">
        <h2 className="form-title">デジタル会員証</h2>
        <div className="liff-message">
          会員証データが見つかりませんでした。
          <br />
          店舗を利用してデータを蓄積してください。
        </div>
        <div className="form-navigation" style={{ justifyContent: 'center', marginTop: '20px' }}>
          <Link to="/check-in" className="submit-btn" style={{ textDecoration: 'none' }}>
            店舗チェックインに進む
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card-scene" onClick={handleCardClick}>
      <div className={`card-object ${isFlipped ? 'is-flipped' : ''}`}>
        
        {/* Card Front */}
        <div className="card-face card-face-front">
          <div className="card-header">
            <img 
              src={cardData.profile.avatarUrl} 
              alt="avatar" 
              className="card-avatar" 
            />
            <h3 className="card-name">{cardData.profile.name}</h3>
          </div>
          
          <p className="card-section-title">同行者の属性</p>
          
          <div className="card-chart-container">
            <div className="chart-wrapper">
              <Pie 
                data={formatChartData(cardData.charts.companionIndustry, '業界')} 
                options={chartOptions} 
              />
              <p className="chart-label">業界</p>
            </div>
            <div className="chart-wrapper">
              <Pie 
                data={formatChartData(cardData.charts.companionJobType, '職種')} 
                options={chartOptions} 
              />
              <p className="chart-label">職種</p>
            </div>
          </div>
          
          <div className="card-tap-indicator">タップして詳細を見る</div>
        </div>

        {/* Card Back */}
        <div className="card-face card-face-back">
          <div className="card-back-left">
            <p className="card-section-title">来店目的</p>
            <div className="chart-wrapper-full">
              <Pie 
                data={formatChartData(cardData.charts.visitPurpose, '目的')} 
                options={chartOptions} 
              />
            </div>
          </div>
          
          <div className="card-back-right">
            <div className="stats-box">
              <div className="stat-item">
                <span className="stat-label">Total Visits</span>
                <span className="stat-value">{cardData.stats.totalVisits}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Favorite</span>
                <span className="stat-value">{cardData.stats.favoriteStore}</span>
              </div>
            </div>
            
            <p className="card-section-title" style={{ marginTop: '15px' }}>
              最近の来店
            </p>
            
            <ul className="visit-history-list">
              {cardData.stats.recentVisits.map((visit, index) => (
                <li key={index}>
                  <span className="visit-date">
                    {formatDate(visit.date)}
                  </span>
                  <span className="visit-store">{visit.storeName}</span>
                </li>
              ))}
            </ul>
            
            <Link to="/visit-history" className="see-more-link">
              {'>> すべての履歴を見る'}
            </Link>
          </div>
          
          <div className="card-footer">
            <img 
              src={cardData.profile.avatarUrl} 
              alt="avatar" 
              className="card-avatar-small" 
            />
            <span>{cardData.profile.name}</span>
          </div>
          
          <div className="card-tap-indicator">タップして戻る</div>
        </div>

      </div>
    </div>
  );
};

export default MembershipCardPage;
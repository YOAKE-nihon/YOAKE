import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

// Chart.jsに必要なコンポーネントを登録
ChartJS.register(ArcElement, Tooltip, Legend);

// --- メインの会員証コンポーネント ---
function MembershipCardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cardData, setCardData] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);

  // LIFFの初期化とデータ取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        const liff = window.liff;
        if (!liff) throw new Error('LIFF SDKが見つかりません。');
        await liff.init({ liffId: process.env.REACT_APP_LIFF_ID_CARD }); // ★ .envに会員証用LIFF IDを追加してください

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const profile = await liff.getProfile();
        const response = await axios.get('/api/membership-card', {
          params: { lineUserId: profile.userId }
        });

        if (response.data.success) {
          setCardData(response.data.data);
        } else {
          throw new Error(response.data.message);
        }
      } catch (err) {
        console.error('Membership Card Error:', err);
        setError(err.message || 'データの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // グラフ描画用のデータ整形ヘルパー
  const formatChartData = (chartData, label) => {
    const labels = Object.keys(chartData);
    const data = Object.values(chartData);
    return {
      labels,
      datasets: [{
        label,
        data,
        backgroundColor: [
          'rgba(184, 117, 0, 0.7)', 'rgba(108, 117, 125, 0.7)', 'rgba(214, 164, 73, 0.7)',
          'rgba(248, 249, 250, 0.7)', 'rgba(52, 58, 64, 0.7)', 'rgba(255, 193, 7, 0.7)'
        ],
        borderColor: [
          '#b87500', '#6c757d', '#d6a449', '#f8f9fa', '#343a40', '#ffc107'
        ],
        borderWidth: 1,
      }]
    };
  };

  const chartOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#333', font: { size: 10 } }
      }
    }
  };


  if (loading) {
    return <div className="form-container"><p className="liff-message">会員証を読み込んでいます...</p></div>;
  }
  if (error) {
    return <div className="form-container"><p className="liff-message error">{error}</p></div>;
  }
  if (!cardData) {
    return <div className="form-container"><p className="liff-message">会員証データを表示できませんでした。</p></div>;
  }


  return (
    <div className="card-scene" onClick={() => setIsFlipped(!isFlipped)}>
      <div className={`card-object ${isFlipped ? 'is-flipped' : ''}`}>
        
        {/* --- カード表面 --- */}
        <div className="card-face card-face-front">
            <div className="card-header">
              <img src={cardData.profile.avatarUrl} alt="avatar" className="card-avatar" />
              <h3 className="card-name">{cardData.profile.name}</h3>
            </div>
            <p className="card-section-title">同行者の属性</p>
            <div className="card-chart-container">
              <div className="chart-wrapper">
                <Pie data={formatChartData(cardData.charts.companionIndustry, '業界')} options={chartOptions} />
                <p className="chart-label">業界</p>
              </div>
              <div className="chart-wrapper">
                <Pie data={formatChartData(cardData.charts.companionJobType, '職種')} options={chartOptions} />
                <p className="chart-label">職種</p>
              </div>
            </div>
            <div className="card-tap-indicator">タップして詳細を見る</div>
        </div>

        {/* --- カード裏面 --- */}
        <div className="card-face card-face-back">
            <div className="card-back-left">
                <p className="card-section-title">来店目的</p>
                <div className="chart-wrapper-full">
                  <Pie data={formatChartData(cardData.charts.visitPurpose, '目的')} options={chartOptions} />
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
                <p className="card-section-title" style={{marginTop: '15px'}}>最近の来店</p>
                <ul className="visit-history-list">
                    {cardData.stats.recentVisits.map((visit, index) => (
                        <li key={index}>
                            <span className="visit-date">{new Date(visit.date).toLocaleDateString()}</span>
                            <span className="visit-store">{visit.storeName}</span>
                        </li>
                    ))}
                </ul>
                <Link to="/visit-history" className="see-more-link">{'>>'} すべての履歴を見る</Link>
            </div>
            <div className="card-footer">
                <img src={cardData.profile.avatarUrl} alt="avatar" className="card-avatar-small" />
                <span>{cardData.profile.name}</span>
            </div>
            <div className="card-tap-indicator">タップして戻る</div>
        </div>

      </div>
    </div>
  );
}

export default MembershipCardPage;

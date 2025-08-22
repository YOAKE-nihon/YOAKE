import React, { useState, useEffect } from 'react';
import axios from 'axios';

// --- アンケートの選択肢データを定義 ---
// RegisterPage.jsxと重複しますが、コンポーネント単体で完結させるために再度定義します。
const INDUSTRY_OPTIONS = ['IT・通信', 'メーカー', '商社', '小売・外食', '金融・保険', '不動産・建設', 'サービス・インフラ', '広告・メディア', '医療・福祉', '教育', '公務員', 'その他'];
const JOB_TYPE_OPTIONS = ['経営・役員', '企画・管理', '営業・販売', 'コンサルタント', '専門職', 'クリエイティブ職', '技術職（IT）', '技術職（その他）', '事務', 'その他'];
const VISIT_PURPOSE_OPTIONS = ['作業・勉強', '商談・ミーティング', '友人との歓談', '休憩・リラックス', 'その他'];


function StoreCheckinPage() {
  // 'scan', 'coupon', 'survey', 'success', 'error' の状態を管理
  const [view, setView] = useState('scan'); 
  const [liffError, setLiffError] = useState('');
  const [visitId, setVisitId] = useState(null); // 来店記録IDを保持
  const [currentTime, setCurrentTime] = useState(new Date()); // クーポンの時刻表示用

  // アンケートフォーム用の状態
  const [surveyData, setSurveyData] = useState({
    visitType: '複数人です', // デフォルト
    companionIndustries: [],
    companionJobTypes: [],
    visitPurpose: '',
  });

  // LIFFの初期化
  useEffect(() => {
    const initializeLiff = async () => {
      try {
        const liff = window.liff;
        if (!liff) throw new Error('LIFF SDKが見つかりません。');
        await liff.init({ liffId: process.env.REACT_APP_LIFF_ID_CHECKIN }); // ★ .envにチェックイン用LIFF IDを追加してください
        if (!liff.isInClient()) {
            setLiffError('この機能はLINEアプリ内でご利用ください。');
        }
      } catch (err) {
        console.error('LIFF Init Error:', err);
        setLiffError('LIFFの初期化に失敗しました。');
      }
    };
    initializeLiff();
  }, []);

  // クーポン画面の時計をリアルタイムで更新
  useEffect(() => {
    if (view === 'coupon') {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
      return () => clearInterval(timer); // コンポーネントが非表示になる際にタイマーを停止
    }
  }, [view]);

  // QRコードスキャン処理
  const handleScanQr = async () => {
    try {
      const liff = window.liff;
      const result = await liff.scanCodeV2();
      if (result && result.value) {
        // QRコードの内容をパース（今回は単純なstoreIdを想定）
        const qrData = JSON.parse(result.value);
        if (qrData.app !== 'yoake' || qrData.type !== 'check-in' || !qrData.store_id) {
            throw new Error('無効なQRコードです。');
        }

        const profile = await liff.getProfile();
        // バックエンドに来店記録を作成するリクエストを送信
        const response = await axios.post('/api/check-in', {
          lineUserId: profile.userId,
          storeId: qrData.store_id
        });

        if (response.data.success) {
          setVisitId(response.data.visitId); // 返ってきたvisitIdを保存
          setView('coupon'); // クーポン表示画面に切り替え
        } else {
          throw new Error(response.data.message || '来店記録の作成に失敗しました。');
        }
      }
    } catch (err) {
      console.error('QR Scan/Check-in Error:', err);
      setLiffError(err.message);
    }
  };

  // アンケートの入力内容を更新
  const handleSurveyChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
        const currentValues = surveyData[name] || [];
        const newValues = checked ? [...currentValues, value] : currentValues.filter(item => item !== value);
        setSurveyData(prev => ({ ...prev, [name]: newValues }));
    } else {
        setSurveyData(prev => ({ ...prev, [name]: value }));
    }
  };

  // アンケートの送信処理
  const handleSurveySubmit = async (e) => {
    e.preventDefault();
    try {
        const response = await axios.post('/api/submit-visit-survey', {
            visitId: visitId,
            visitType: surveyData.visitType,
            visitPurpose: surveyData.visitPurpose,
            companionIndustries: surveyData.visitType === '１人です' ? [] : surveyData.companionIndustries,
            companionJobTypes: surveyData.visitType === '１人です' ? [] : surveyData.companionJobTypes,
        });
        if (response.data.success) {
            setView('success'); // 成功画面に切り替え
            setTimeout(() => window.liff.closeWindow(), 3000);
        } else {
            throw new Error(response.data.message || 'アンケートの送信に失敗しました。');
        }
    } catch (err) {
        console.error('Survey Submit Error:', err);
        setLiffError(err.message);
    }
  };
  
  // 表示するコンテンツのメイン部分
  const renderContent = () => {
    if (liffError) {
      return <p className="liff-message error">{liffError}</p>;
    }

    switch (view) {
      case 'scan':
        return (
          <>
            <p className="form-description">店舗のQRコードをスキャンしてチェックインしてください。</p>
            <div className="form-navigation" style={{justifyContent: 'center'}}><button onClick={handleScanQr} className="submit-btn">QRコードをスキャン</button></div>
          </>
        );

      case 'coupon':
        return (
          <>
            <h3 className="coupon-title">特典クーポン</h3>
            <div className="coupon-box">
              <p className="coupon-text">お好きなドリンク1杯無料</p>
              <p className="coupon-time">{currentTime.toLocaleTimeString('ja-JP')}</p>
            </div>
            <p className="form-description">この画面を店員にお見せください。</p>
            <div className="form-navigation" style={{justifyContent: 'center'}}><button onClick={() => setView('survey')} className="submit-btn">ドリンクを注文したら、アンケートに進む</button></div>
          </>
        );

      case 'survey':
        return (
          <form onSubmit={handleSurveySubmit}>
            <div className="form-group radio-group">
                <label>本日はお一人でのご来店ですか？</label>
                <label className="radio-label"><input type="radio" name="visitType" value="複数人です" checked={surveyData.visitType === '複数人です'} onChange={handleSurveyChange} /><span className="radio-custom"></span>いいえ、複数人です</label>
                <label className="radio-label"><input type="radio" name="visitType" value="１人です" checked={surveyData.visitType === '１人です'} onChange={handleSurveyChange} /><span className="radio-custom"></span>はい、１人です</label>
            </div>

            {surveyData.visitType === '複数人です' && (
                <div className="conditional-form-section">
                    <div className="form-group checkbox-group"><label>同行者の業界（複数可）</label>{INDUSTRY_OPTIONS.map(o => (<label key={o} className="checkbox-label"><input type="checkbox" name="companionIndustries" value={o} checked={surveyData.companionIndustries.includes(o)} onChange={handleSurveyChange} /><span className="checkbox-custom"></span>{o}</label>))}</div>
                    <div className="form-group checkbox-group"><label>同行者の職種（複数可）</label>{JOB_TYPE_OPTIONS.map(o => (<label key={o} className="checkbox-label"><input type="checkbox" name="companionJobTypes" value={o} checked={surveyData.companionJobTypes.includes(o)} onChange={handleSurveyChange} /><span className="checkbox-custom"></span>{o}</label>))}</div>
                </div>
            )}
            
            <div className="form-group"><label>本日の来店目的</label><select name="visitPurpose" value={surveyData.visitPurpose} onChange={handleSurveyChange} required><option value="">選択してください</option>{VISIT_PURPOSE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select></div>

            <div className="form-navigation" style={{justifyContent: 'center'}}><button type="submit" className="submit-btn">アンケートを送信</button></div>
          </form>
        );

      case 'success':
        return <p className="liff-message success">ご協力ありがとうございました！</p>;
        
      default:
        return <p>準備中...</p>;
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">店舗チェックイン</h2>
      {renderContent()}
    </div>
  );
}

export default StoreCheckinPage;

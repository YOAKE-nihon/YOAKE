import React, { useState, useCallback } from 'react';
import { useLiff, useApi, useTimer } from '../hooks';
import { userApi } from '../services/api';
import { 
  INDUSTRY_OPTIONS, 
  JOB_TYPE_OPTIONS, 
  VISIT_PURPOSE_OPTIONS 
} from '../types';
import { parseQRCode, closeLiffWindow } from '../utils';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import FormField from '../components/common/FormField';

type CheckinView = 'scan' | 'coupon' | 'survey' | 'success';

interface SurveyData {
  visitType: string;
  companionIndustries: string[];
  companionJobTypes: string[];
  visitPurpose: string;
}

const StoreCheckinPage: React.FC = () => {
  const {
    isLoggedIn,
    profile,
    error: liffError,
    loading: liffLoading
  } = useLiff(process.env.REACT_APP_LIFF_ID_CHECKIN!);

  const { loading: checking, error: checkinError, execute: executeCheckin } = useApi<{ visitId: string }>();
  const { loading: submitting, error: surveyError, execute: executeSurvey } = useApi();

  const [view, setView] = useState<CheckinView>('scan');
  const [visitId, setVisitId] = useState<string | null>(null);
  const [surveyData, setSurveyData] = useState<SurveyData>({
    visitType: '複数人です',
    companionIndustries: [],
    companionJobTypes: [],
    visitPurpose: '',
  });

  // Timer for coupon display
  const { time, start: startTimer, stop: stopTimer } = useTimer();

  const handleScanQr = useCallback(async () => {
    if (!window.liff) {
      return;
    }

    try {
      const result = await window.liff.scanCodeV2();
      if (!result?.value) {
        throw new Error('QRコードの読み取りに失敗しました');
      }

      const qrData = parseQRCode(result.value);
      if (!qrData) {
        throw new Error('無効なQRコードです');
      }

      if (!profile?.userId) {
        throw new Error('LINE認証情報が取得できませんでした');
      }

      const checkinResult = await executeCheckin(() =>
        userApi.checkIn({
          lineUserId: profile.userId,
          storeId: qrData.store_id,
        })
      );

      if (checkinResult?.visitId) {
        setVisitId(checkinResult.visitId);
        setView('coupon');
        startTimer(); // Start the timer for coupon display
      }
    } catch (error) {
      console.error('QR scan/check-in error:', error);
    }
  }, [profile, executeCheckin, startTimer]);

  const handleSurveyChange = useCallback((name: string, value: any, checked?: boolean) => {
    setSurveyData(prev => {
      if (name === 'companionIndustries' || name === 'companionJobTypes') {
        const currentValues = prev[name as keyof SurveyData] as string[];
        const newValues = checked 
          ? [...currentValues, value]
          : currentValues.filter(item => item !== value);
        return { ...prev, [name]: newValues };
      } else {
        return { ...prev, [name]: value };
      }
    });
  }, []);

  const handleSurveySubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!visitId) {
      return;
    }

    try {
      const result = await executeSurvey(() =>
        userApi.submitVisitSurvey({
          visitId,
          visitType: surveyData.visitType,
          visitPurpose: surveyData.visitPurpose,
          companionIndustries: surveyData.visitType === '１人です' ? [] : surveyData.companionIndustries,
          companionJobTypes: surveyData.visitType === '１人です' ? [] : surveyData.companionJobTypes,
        })
      );

      if (result) {
        setView('success');
        stopTimer(); // Stop the timer
        setTimeout(() => {
          closeLiffWindow();
        }, 3000);
      }
    } catch (error) {
      console.error('Survey submit error:', error);
    }
  }, [visitId, surveyData, executeSurvey, stopTimer]);

  // Loading state
  if (liffLoading) {
    return (
      <div className="form-container">
        <LoadingSpinner message="アプリを初期化しています..." />
      </div>
    );
  }

  // LIFF error state
  if (liffError) {
    return (
      <div className="form-container">
        <h2 className="form-title">店舗チェックイン</h2>
        <ErrorMessage message={liffError} />
      </div>
    );
  }

  // Not in LINE client
  if (!isLoggedIn || !window.liff?.isInClient()) {
    return (
      <div className="form-container">
        <h2 className="form-title">店舗チェックイン</h2>
        <ErrorMessage message="この機能はLINEアプリ内でご利用ください" />
      </div>
    );
  }

  const renderContent = () => {
    switch (view) {
      case 'scan':
        return (
          <>
            <p className="form-description">
              店舗のQRコードをスキャンしてチェックインしてください。
            </p>
            <div className="form-navigation" style={{ justifyContent: 'center' }}>
              <button 
                onClick={handleScanQr} 
                className="submit-btn"
                disabled={checking}
              >
                {checking ? (
                  <LoadingSpinner size="small" message="" />
                ) : (
                  'QRコードをスキャン'
                )}
              </button>
            </div>
            {checkinError && (
              <ErrorMessage message={checkinError} className="mt-4" />
            )}
          </>
        );

      case 'coupon':
        return (
          <>
            <h3 className="coupon-title">特典クーポン</h3>
            <div className="coupon-box">
              <p className="coupon-text">お好きなドリンク1杯無料</p>
              <p className="coupon-time">{time.toLocaleTimeString('ja-JP')}</p>
            </div>
            <p className="form-description">
              この画面を店員にお見せください。
            </p>
            <div className="form-navigation" style={{ justifyContent: 'center' }}>
              <button 
                onClick={() => setView('survey')} 
                className="submit-btn"
              >
                ドリンクを注文したら、アンケートに進む
              </button>
            </div>
          </>
        );

      case 'survey':
        return (
          <form onSubmit={handleSurveySubmit}>
            <p className="form-description">
              簡単なアンケートにご協力ください。
            </p>

            <FormField label="本日はお一人でのご来店ですか？">
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="visitType"
                    value="複数人です"
                    checked={surveyData.visitType === '複数人です'}
                    onChange={(e) => handleSurveyChange('visitType', e.target.value)}
                  />
                  <span className="radio-custom"></span>
                  いいえ、複数人です
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="visitType"
                    value="１人です"
                    checked={surveyData.visitType === '１人です'}
                    onChange={(e) => handleSurveyChange('visitType', e.target.value)}
                  />
                  <span className="radio-custom"></span>
                  はい、１人です
                </label>
              </div>
            </FormField>

            {surveyData.visitType === '複数人です' && (
              <div className="conditional-form-section">
                <FormField label="同行者の業界（複数可）">
                  <div className="checkbox-group">
                    {INDUSTRY_OPTIONS.map(option => (
                      <label key={option} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={surveyData.companionIndustries.includes(option)}
                          onChange={(e) => handleSurveyChange('companionIndustries', option, e.target.checked)}
                        />
                        <span className="checkbox-custom"></span>
                        {option}
                      </label>
                    ))}
                  </div>
                </FormField>

                <FormField label="同行者の職種（複数可）">
                  <div className="checkbox-group">
                    {JOB_TYPE_OPTIONS.map(option => (
                      <label key={option} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={surveyData.companionJobTypes.includes(option)}
                          onChange={(e) => handleSurveyChange('companionJobTypes', option, e.target.checked)}
                        />
                        <span className="checkbox-custom"></span>
                        {option}
                      </label>
                    ))}
                  </div>
                </FormField>
              </div>
            )}
            
            <FormField label="本日の来店目的">
              <select
                value={surveyData.visitPurpose}
                onChange={(e) => handleSurveyChange('visitPurpose', e.target.value)}
                required
              >
                <option value="">選択してください</option>
                {VISIT_PURPOSE_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </FormField>

            <div className="form-navigation" style={{ justifyContent: 'center' }}>
              <button 
                type="submit" 
                className="submit-btn"
                disabled={submitting}
              >
                {submitting ? (
                  <LoadingSpinner size="small" message="" />
                ) : (
                  'アンケートを送信'
                )}
              </button>
            </div>

            {surveyError && (
              <ErrorMessage message={surveyError} className="mt-4" />
            )}
          </form>
        );

      case 'success':
        return (
          <div className="liff-message success">
            ご協力ありがとうございました！
            <br />
            このウィンドウは自動的に閉じられます。
          </div>
        );

      default:
        return <LoadingSpinner message="準備中..." />;
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">店舗チェックイン</h2>
      {renderContent()}
    </div>
  );
};

export default StoreCheckinPage;
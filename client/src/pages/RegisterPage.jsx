import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// --- 選択肢の定義 ---
const GENDER_OPTIONS = ['男性', '女性', 'その他', '回答しない'];
const EXPERIENCE_YEARS_OPTIONS = ['1年未満', '1〜3年', '3〜5年', '5〜10年', '10年以上'];
const SIDE_JOB_INTEREST_OPTIONS = [ { value: 'high', label: '強い関心がある' }, { value: 'medium', label: '興味はあるがまだ踏み出せていない' }, { value: 'low', label: 'あまり興味はないが、必要性を感じている' }, { value: 'none', label: '副業には全く関心がない' }, ];
const SIDE_JOB_TIME_OPTIONS = ['10時間未満', '10〜20時間', '20〜30時間', '30時間以上'];
const SIDE_JOB_FIELDS_OPTIONS = ['マーケティング', 'デザイン', 'ライティング', 'IT・プログラミング', 'ビジネス・コンサルティング', 'その他'];
const SIDE_JOB_PURPOSE_OPTIONS = ['副収入を得るため', 'スキルやキャリアを成長させるため', '新しい人脈を作るため', '自分らしいライフスタイルを作るため', '社会貢献を目指すため'];
const SIDE_JOB_CHALLENGE_OPTIONS = ['時間管理', '資金調達', '経験不足', '人脈不足', 'スキルや知識の不足', 'その他'];
const MEET_PEOPLE_OPTIONS = ['同じ業界の専門家', '副業をしている人', '起業家や経営者', '自己成長を目指している人', '他業種の人と広くつながりたい'];
const SERVICE_BENEFIT_OPTIONS = ['無料のドリンク', '新しいビジネスパートナーとの出会い', '情報交換', '講座やセミナー', 'その他'];
const SERVICE_PRIORITY_OPTIONS = ['コストパフォーマンス', '他の会員との交流機会', '安定した挑戦環境', '知識やスキルの向上', 'サポートしてくれるコミュニティ'];
const INDUSTRY_OPTIONS = ['IT・通信', 'メーカー', '商社', '小売・外食', '金融・保険', '不動産・建設', 'サービス・インフラ', '広告・メディア', '医療・福祉', '教育', '公務員', 'その他'];
const JOB_TYPE_OPTIONS = ['経営・役員', '企画・管理', '営業・販売', 'コンサルタント', '専門職', 'クリエイティブ職', '技術職（IT）', '技術職（その他）', '事務', 'その他'];

function RegisterPage() {
  const [status, setStatus] = useState('initializing'); // 'initializing', 'form', 'submitting', 'error'
  const [lineProfile, setLineProfile] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const [formData, setFormData] = useState({
    email: '', phone: '', gender: '', birthDate: '',
    experienceYears: '', industry: '', jobType: '',
    interestInSideJob: '', sideJobTime: '', sideJobFields: [], sideJobFieldsOther: '',
    sideJobPurpose: '', sideJobChallenge: '', sideJobChallengeOther: '', meetPeople: [],
    serviceBenefit: '', serviceBenefitOther: '', servicePriority: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        const liff = window.liff;
        if (!liff) throw new Error('LIFF SDKが見つかりません。');
        
        await liff.init({ liffId: process.env.REACT_APP_LIFF_ID_REGISTER });
        
        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href });
          return;
        }

        const profile = await liff.getProfile();
        const token = liff.getIDToken();
        
        if (!token) throw new Error('IDトークンが取得できませんでした。LIFFのScope設定で`openid`が有効になっているか確認してください。');

        setLineProfile(profile);
        setIdToken(token);
        setStatus('form');

      } catch (err) {
        console.error('LIFF Init/Login Error:', err);
        setStatus('error');
        setError('LIFFの初期化またはログインに失敗しました。時間をおいて再度お試しください。');
      }
    };
    initializeLiff();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const [section, field] = name.split('.'); // surveys.interestInSideJob のような名前に対応

    if (section === 'surveys') {
      if (type === 'checkbox') {
        const currentValues = formData.surveys[field] || [];
        const newValues = checked ? [...currentValues, value] : currentValues.filter(item => item !== value);
        setFormData(prev => ({ ...prev, surveys: { ...prev.surveys, [field]: newValues } }));
      } else {
        setFormData(prev => ({ ...prev, surveys: { ...prev.surveys, [field]: value } }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    setError('');
    try {
      const response = await axios.post('/api/register', { idToken, surveyData: formData });
      if (response.data.success) {
        // emailを決済ページと、その後のLINE連携完了ページで使うために渡す
        navigate('/payment', { state: { email: formData.email, 
          stripeCustomerId: response.data.stripeCustomerId  } });
      }
    } catch (err) {
      setStatus('error');
      setError(err.response?.data?.message || '登録処理中にエラーが発生しました。');
    }
  };
  
  if (status === 'initializing') {
    return <div className="form-container"><h2 className="form-title">準備中...</h2><p className="form-description">ユーザー情報を読み込んでいます。</p></div>;
  }

  if (status === 'error') {
    return <div className="form-container"><h2 className="form-title">エラー</h2><p className="error-message">{error}</p></div>;
  }

  const showSideJobQuestions = ['high', 'medium'].includes(formData.interestInSideJob);

  return (
    <div className="form-container">
      <div className="profile-header">
        {lineProfile?.pictureUrl && <img src={lineProfile.pictureUrl} alt="LINE Profile" className="profile-icon" />}
        <p>こんにちは、<strong>{lineProfile?.displayName}</strong>さん！</p>
      </div>
      <p className="form-description">会員登録のため、以下の情報をご入力ください。</p>
      
      {error && <p className="error-message">{error}</p>}
      
      <form onSubmit={handleSubmit} className="form-content">
        <h3 className="form-subtitle">基本情報</h3>
        <div className="form-group"><label htmlFor="email">連絡先メールアドレス<span className="required-asterisk">*</span></label><input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required /></div>
        <div className="form-group"><label htmlFor="birthDate">生年月日<span className="required-asterisk">*</span></label><input type="date" id="birthDate" name="birthDate" value={formData.birthDate} onChange={handleChange} required /></div>
        <div className="form-group"><label htmlFor="gender">性別(任意)</label><select id="gender" name="gender" value={formData.gender} onChange={handleChange}><option value="">選択してください</option>{GENDER_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
        <div className="form-group"><label htmlFor="phone">電話番号(任意)</label><input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} /></div>

        <hr className="form-divider" />
        <h3 className="form-subtitle">プロフィール</h3>
        <div className="form-group"><label htmlFor="industry">業界<span className="required-asterisk">*</span></label><select id="industry" name="industry" value={formData.industry} onChange={handleChange} required><option value="">選択してください</option>{INDUSTRY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
        <div className="form-group"><label htmlFor="jobType">職種<span className="required-asterisk">*</span></label><select id="jobType" name="jobType" value={formData.jobType} onChange={handleChange} required><option value="">選択してください</option>{JOB_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
        <div className="form-group"><label htmlFor="experienceYears">経験年数<span className="required-asterisk">*</span></label><select id="experienceYears" name="experienceYears" value={formData.experienceYears} onChange={handleChange} required><option value="">選択してください</option>{EXPERIENCE_YEARS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select></div>

        <hr className="form-divider" />
        <h3 className="form-subtitle">コミュニティについて</h3>
        <div className="form-group radio-group"><label>副業へのご関心は？<span className="required-asterisk">*</span></label>{SIDE_JOB_INTEREST_OPTIONS.map(o => (<label key={o.value} className="radio-label"><input type="radio" name="interestInSideJob" value={o.value} checked={formData.interestInSideJob === o.value} onChange={handleChange} required /><span className="radio-custom"></span>{o.label}</label>))}</div>
        {showSideJobQuestions && (<div className="conditional-form-section">
            <div className="form-group"><label>月に副業に割ける時間は？<span className="required-asterisk">*</span></label><select name="sideJobTime" value={formData.sideJobTime} onChange={handleChange} required={showSideJobQuestions}><option value="">選択してください</option>{SIDE_JOB_TIME_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
            <div className="form-group radio-group"><label>主な目的は？<span className="required-asterisk">*</span></label>{SIDE_JOB_PURPOSE_OPTIONS.map(o => (<label key={o} className="radio-label"><input type="radio" name="sideJobPurpose" value={o} checked={formData.sideJobPurpose === o} onChange={handleChange} required={showSideJobQuestions} /><span className="radio-custom"></span>{o}</label>))}</div>
            <div className="form-group checkbox-group"><label>挑戦したい分野は？(複数可)</label>{SIDE_JOB_FIELDS_OPTIONS.map(o => (<label key={o} className="checkbox-label"><input type="checkbox" name="sideJobFields" value={o} checked={formData.sideJobFields.includes(o)} onChange={handleChange} /><span className="checkbox-custom"></span>{o}</label>))} {formData.sideJobFields.includes('その他') && (<div className="form-group sub-input"><label htmlFor="sideJobFieldsOther">分野(具体的に)</label><input type="text" id="sideJobFieldsOther" name="sideJobFieldsOther" value={formData.sideJobFieldsOther} onChange={handleChange} /></div>)}</div>
            <div className="form-group radio-group"><label>副業への課題は？<span className="required-asterisk">*</span></label>{SIDE_JOB_CHALLENGE_OPTIONS.map(o => (<label key={o} className="radio-label"><input type="radio" name="sideJobChallenge" value={o} checked={formData.sideJobChallenge === o} onChange={handleChange} required={showSideJobQuestions} /><span className="radio-custom"></span>{o}</label>))} {formData.sideJobChallenge === 'その他' && (<div className="form-group sub-input"><label htmlFor="sideJobChallengeOther">課題(具体的に)</label><input type="text" id="sideJobChallengeOther" name="sideJobChallengeOther" value={formData.sideJobChallengeOther} onChange={handleChange} /></div>)}</div>
            <div className="form-group checkbox-group"><label>どんな人と会いたい？(複数可)</label>{MEET_PEOPLE_OPTIONS.map(o => (<label key={o} className="checkbox-label"><input type="checkbox" name="meetPeople" value={o} checked={formData.meetPeople.includes(o)} onChange={handleChange} /><span className="checkbox-custom"></span>{o}</label>))}</div>
        </div>)}
        <div className="form-group radio-group"><label>最も楽しみな特典は？<span className="required-asterisk">*</span></label>{SERVICE_BENEFIT_OPTIONS.map(o => (<label key={o} className="radio-label"><input type="radio" name="serviceBenefit" value={o} checked={formData.serviceBenefit === o} onChange={handleChange} required /><span className="radio-custom"></span>{o}</label>))} {formData.serviceBenefit === 'その他' && (<div className="form-group sub-input"><label htmlFor="serviceBenefitOther">特典(具体的に)</label><input type="text" id="serviceBenefitOther" name="serviceBenefitOther" value={formData.serviceBenefitOther} onChange={handleChange} /></div>)}</div>
        <div className="form-group radio-group"><label>最も重視することは？<span className="required-asterisk">*</span></label>{SERVICE_PRIORITY_OPTIONS.map(o => (<label key={o} className="radio-label"><input type="radio" name="servicePriority" value={o} checked={formData.servicePriority === o} onChange={handleChange} required /><span className="radio-custom"></span>{o}</label>))}</div>
        
        <div className="form-navigation" style={{ justifyContent: 'center' }}>
          <button type="submit" disabled={status === 'submitting'} className="submit-btn">
            {status === 'submitting' ? '登録中...' : '入力完了・決済へ進む'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default RegisterPage;

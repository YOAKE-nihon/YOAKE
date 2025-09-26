import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiff, useApi } from '../hooks';
import { authApi } from '../services/api';
import { 
  SurveyData,
  GENDER_OPTIONS,
  EXPERIENCE_YEARS_OPTIONS,
  SIDE_JOB_INTEREST_OPTIONS,
  SIDE_JOB_TIME_OPTIONS,
  SIDE_JOB_FIELDS_OPTIONS,
  SIDE_JOB_PURPOSE_OPTIONS,
  SIDE_JOB_CHALLENGE_OPTIONS,
  MEET_PEOPLE_OPTIONS,
  SERVICE_BENEFIT_OPTIONS,
  SERVICE_PRIORITY_OPTIONS,
  INDUSTRY_OPTIONS,
  JOB_TYPE_OPTIONS
} from '../types';
import { validateSurveyData } from '../utils';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import FormField from '../components/common/FormField';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    isLoggedIn, 
    profile, 
    error: liffError, 
    loading: liffLoading, 
    login,
    getIdToken 
  } = useLiff(process.env.REACT_APP_LIFF_ID_REGISTER!);
  
  const { loading: registering, error: registerError, execute: executeRegister } = useApi();

  const [formData, setFormData] = useState<Partial<SurveyData>>({
    email: '',
    phone: '',
    gender: '',
    birthDate: '',
    experienceYears: '',
    industry: '',
    jobType: '',
    interestInSideJob: '',
    sideJobTime: '',
    sideJobFields: [],
    sideJobFieldsOther: '',
    sideJobPurpose: '',
    sideJobChallenge: '',
    sideJobChallengeOther: '',
    meetPeople: [],
    serviceBenefit: '',
    serviceBenefitOther: '',
    servicePriority: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleInputChange = useCallback((name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [validationErrors]);

  const handleCheckboxChange = useCallback((name: string, value: string, checked: boolean) => {
    setFormData(prev => {
      const currentValues = (prev[name as keyof SurveyData] as string[]) || [];
      const newValues = checked 
        ? [...currentValues, value]
        : currentValues.filter(item => item !== value);
      
      return { ...prev, [name]: newValues };
    });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validation = validateSurveyData(formData);
    if (!validation.isValid) {
      const errorObj: Record<string, string> = {};
      validation.errors.forEach((error, index) => {
        errorObj[`error${index}`] = error;
      });
      errorObj.form = validation.errors[0];
      setValidationErrors(errorObj);
      return;
    }

    // Get ID token
    const idToken = getIdToken();
    if (!idToken) {
      setValidationErrors({ form: 'LINE認証情報が取得できませんでした。再度お試しください。' });
      return;
    }

    try {
      const result = await executeRegister(() => 
        authApi.register({ 
          idToken, 
          surveyData: formData as SurveyData 
        })
      );

      if (result) {
        navigate('/payment', { 
          state: { 
            email: formData.email, 
            stripeCustomerId: result.stripeCustomerId 
          } 
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  }, [formData, getIdToken, executeRegister, navigate]);

  // Loading state
  if (liffLoading) {
    return (
      <div className="form-container">
        <LoadingSpinner message="ユーザー情報を読み込んでいます..." />
      </div>
    );
  }

  // LIFF error state
  if (liffError) {
    return (
      <div className="form-container">
        <h2 className="form-title">エラー</h2>
        <ErrorMessage message={liffError} />
      </div>
    );
  }

  // Not logged in state
  if (!isLoggedIn) {
    return (
      <div className="form-container">
        <h2 className="form-title">LINEログインが必要です</h2>
        <p className="form-description">
          サービスをご利用いただくにはLINEアカウントでのログインが必要です。
        </p>
        <div className="form-navigation" style={{ justifyContent: 'center' }}>
          <button onClick={() => login()} className="submit-btn">
            LINEでログイン
          </button>
        </div>
      </div>
    );
  }

  const showSideJobQuestions = ['high', 'medium'].includes(formData.interestInSideJob || '');

  return (
    <div className="form-container">
      {/* Profile Header */}
      <div className="profile-header">
        {profile?.pictureUrl && (
          <img 
            src={profile.pictureUrl} 
            alt="LINE Profile" 
            className="profile-icon" 
          />
        )}
        <p>
          こんにちは、<strong>{profile?.displayName}</strong>さん！
        </p>
      </div>
      
      <p className="form-description">
        会員登録のため、以下の情報をご入力ください。
      </p>
      
      {/* Form Errors */}
      {registerError && <ErrorMessage message={registerError} />}
      {validationErrors.form && <ErrorMessage message={validationErrors.form} />}
      
      <form onSubmit={handleSubmit} className="form-content">
        {/* Basic Information */}
        <h3 className="form-subtitle">基本情報</h3>
        
        <FormField 
          label="連絡先メールアドレス" 
          required
          error={validationErrors.email}
        >
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={validationErrors.email ? 'input-error' : ''}
            required
          />
        </FormField>

        <FormField 
          label="生年月日" 
          required
          error={validationErrors.birthDate}
        >
          <input
            type="date"
            value={formData.birthDate || ''}
            onChange={(e) => handleInputChange('birthDate', e.target.value)}
            className={validationErrors.birthDate ? 'input-error' : ''}
            required
          />
        </FormField>

        <FormField label="性別(任意)">
          <select
            value={formData.gender || ''}
            onChange={(e) => handleInputChange('gender', e.target.value)}
          >
            <option value="">選択してください</option>
            {GENDER_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </FormField>

        <FormField label="電話番号(任意)">
          <input
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => handleInputChange('phone', e.target.value)}
          />
        </FormField>

        <hr className="form-divider" />

        {/* Profile Information */}
        <h3 className="form-subtitle">プロフィール</h3>

        <FormField 
          label="業界" 
          required
          error={validationErrors.industry}
        >
          <select
            value={formData.industry || ''}
            onChange={(e) => handleInputChange('industry', e.target.value)}
            className={validationErrors.industry ? 'input-error' : ''}
            required
          >
            <option value="">選択してください</option>
            {INDUSTRY_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </FormField>

        <FormField 
          label="職種" 
          required
          error={validationErrors.jobType}
        >
          <select
            value={formData.jobType || ''}
            onChange={(e) => handleInputChange('jobType', e.target.value)}
            className={validationErrors.jobType ? 'input-error' : ''}
            required
          >
            <option value="">選択してください</option>
            {JOB_TYPE_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </FormField>

        <FormField 
          label="経験年数" 
          required
          error={validationErrors.experienceYears}
        >
          <select
            value={formData.experienceYears || ''}
            onChange={(e) => handleInputChange('experienceYears', e.target.value)}
            className={validationErrors.experienceYears ? 'input-error' : ''}
            required
          >
            <option value="">選択してください</option>
            {EXPERIENCE_YEARS_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </FormField>

        <hr className="form-divider" />

        {/* Community Information */}
        <h3 className="form-subtitle">コミュニティについて</h3>

        <FormField 
          label="副業へのご関心は？" 
          required
          error={validationErrors.interestInSideJob}
        >
          <div className={`radio-group ${validationErrors.interestInSideJob ? 'input-error' : ''}`}>
          {SIDE_JOB_INTEREST_OPTIONS.map(option => (
            <label key={option} className="radio-label">
              <input
                type="radio"
                name="interestInSideJob"
                value={option}
                checked={formData.interestInSideJob === option}
                onChange={(e) => handleInputChange('interestInSideJob', e.target.value)}
                required
              />
              <span className="radio-custom"></span>
              {option}
            </label>
          ))}
          </div>
        </FormField>

        {/* Conditional Side Job Questions */}
        {showSideJobQuestions && (
          <div className="conditional-form-section">
            <FormField 
              label="月に副業に割ける時間は？" 
              required
              error={validationErrors.sideJobTime}
            >
              <select
                value={formData.sideJobTime || ''}
                onChange={(e) => handleInputChange('sideJobTime', e.target.value)}
                className={validationErrors.sideJobTime ? 'input-error' : ''}
                required={showSideJobQuestions}
              >
                <option value="">選択してください</option>
                {SIDE_JOB_TIME_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </FormField>

            <FormField 
              label="主な目的は？" 
              required
              error={validationErrors.sideJobPurpose}
            >
              <div className={`radio-group ${validationErrors.sideJobPurpose ? 'input-error' : ''}`}>
                {SIDE_JOB_PURPOSE_OPTIONS.map(option => (
                  <label key={option} className="radio-label">
                    <input
                      type="radio"
                      name="sideJobPurpose"
                      value={option}
                      checked={formData.sideJobPurpose === option}
                      onChange={(e) => handleInputChange('sideJobPurpose', e.target.value)}
                      required={showSideJobQuestions}
                    />
                    <span className="radio-custom"></span>
                    {option}
                  </label>
                ))}
              </div>
            </FormField>

            <FormField label="挑戦したい分野は？(複数可)">
              <div className="checkbox-group">
                {SIDE_JOB_FIELDS_OPTIONS.map(option => (
                  <label key={option} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.sideJobFields?.includes(option) || false}
                      onChange={(e) => handleCheckboxChange('sideJobFields', option, e.target.checked)}
                    />
                    <span className="checkbox-custom"></span>
                    {option}
                  </label>
                ))}
                
                {formData.sideJobFields?.includes('その他') && (
                  <div className="form-group sub-input">
                    <label htmlFor="sideJobFieldsOther">分野(具体的に)</label>
                    <input
                      type="text"
                      id="sideJobFieldsOther"
                      value={formData.sideJobFieldsOther || ''}
                      onChange={(e) => handleInputChange('sideJobFieldsOther', e.target.value)}
                    />
                  </div>
                )}
              </div>
            </FormField>

            <FormField 
              label="副業への課題は？" 
              required
              error={validationErrors.sideJobChallenge}
            >
              <div className={`radio-group ${validationErrors.sideJobChallenge ? 'input-error' : ''}`}>
                {SIDE_JOB_CHALLENGE_OPTIONS.map(option => (
                  <label key={option} className="radio-label">
                    <input
                      type="radio"
                      name="sideJobChallenge"
                      value={option}
                      checked={formData.sideJobChallenge === option}
                      onChange={(e) => handleInputChange('sideJobChallenge', e.target.value)}
                      required={showSideJobQuestions}
                    />
                    <span className="radio-custom"></span>
                    {option}
                  </label>
                ))}
                
                {formData.sideJobChallenge === 'その他' && (
                  <div className="form-group sub-input">
                    <label htmlFor="sideJobChallengeOther">課題(具体的に)</label>
                    <input
                      type="text"
                      id="sideJobChallengeOther"
                      value={formData.sideJobChallengeOther || ''}
                      onChange={(e) => handleInputChange('sideJobChallengeOther', e.target.value)}
                    />
                  </div>
                )}
              </div>
            </FormField>

            <FormField label="どんな人と会いたい？(複数可)">
              <div className="checkbox-group">
                {MEET_PEOPLE_OPTIONS.map(option => (
                  <label key={option} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.meetPeople?.includes(option) || false}
                      onChange={(e) => handleCheckboxChange('meetPeople', option, e.target.checked)}
                    />
                    <span className="checkbox-custom"></span>
                    {option}
                  </label>
                ))}
              </div>
            </FormField>
          </div>
        )}

        <FormField 
          label="最も楽しみな特典は？" 
          required
          error={validationErrors.serviceBenefit}
        >
          <div className={`radio-group ${validationErrors.serviceBenefit ? 'input-error' : ''}`}>
            {SERVICE_BENEFIT_OPTIONS.map(option => (
              <label key={option} className="radio-label">
                <input
                  type="radio"
                  name="serviceBenefit"
                  value={option}
                  checked={formData.serviceBenefit === option}
                  onChange={(e) => handleInputChange('serviceBenefit', e.target.value)}
                  required
                />
                <span className="radio-custom"></span>
                {option}
              </label>
            ))}
            
            {formData.serviceBenefit === 'その他' && (
              <div className="form-group sub-input">
                <label htmlFor="serviceBenefitOther">特典(具体的に)</label>
                <input
                  type="text"
                  id="serviceBenefitOther"
                  value={formData.serviceBenefitOther || ''}
                  onChange={(e) => handleInputChange('serviceBenefitOther', e.target.value)}
                />
              </div>
            )}
          </div>
        </FormField>

        <FormField 
          label="最も重視することは？" 
          required
          error={validationErrors.servicePriority}
        >
          <div className={`radio-group ${validationErrors.servicePriority ? 'input-error' : ''}`}>
            {SERVICE_PRIORITY_OPTIONS.map(option => (
              <label key={option} className="radio-label">
                <input
                  type="radio"
                  name="servicePriority"
                  value={option}
                  checked={formData.servicePriority === option}
                  onChange={(e) => handleInputChange('servicePriority', e.target.value)}
                  required
                />
                <span className="radio-custom"></span>
                {option}
              </label>
            ))}
          </div>
        </FormField>
        
        {/* Submit Button */}
        <div className="form-navigation" style={{ justifyContent: 'center' }}>
          <button 
            type="submit" 
            disabled={registering} 
            className="submit-btn"
          >
            {registering ? (
              <LoadingSpinner size="small" message="" />
            ) : (
              '入力完了・決済へ進む'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterPage;
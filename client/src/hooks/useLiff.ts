import { useState, useEffect } from 'react';

interface Profile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

interface UseLiffReturn {
  isLoggedIn: boolean;
  profile: Profile | null;
  error: string | null;
  loading: boolean;
  login: () => Promise<void>;
  getIdToken: () => string | null; // getIdToken を追加
}

const useLiff = (liffId: string): UseLiffReturn => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initLiff = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!window.liff) {
          throw new Error('LIFF SDKが読み込まれていません');
        }

        await window.liff.init({ liffId });

        if (window.liff.isLoggedIn()) {
          setIsLoggedIn(true);
          const userProfile = await window.liff.getProfile();
          setProfile({
            userId: userProfile.userId,
            displayName: userProfile.displayName,
            pictureUrl: userProfile.pictureUrl,
            statusMessage: userProfile.statusMessage,
          });
        }
      } catch (err: any) {
        console.error('LIFF初期化エラー:', err);
        setError(err.message || 'LIFF初期化に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    initLiff();
  }, [liffId]);

  const login = async (): Promise<void> => {
    try {
      if (window.liff && !window.liff.isLoggedIn()) {
        window.liff.login();
      }
    } catch (err: any) {
      console.error('ログインエラー:', err);
      setError(err.message || 'ログインに失敗しました');
    }
  };

  const getIdToken = (): string | null => {
    try {
      if (window.liff && window.liff.isLoggedIn() && window.liff.getIDToken) {
        return window.liff.getIDToken();
      }
      return null;
    } catch (err: any) {
      console.error('IDトークン取得エラー:', err);
      return null;
    }
  };

  return {
    isLoggedIn,
    profile,
    error,
    loading,
    login,
    getIdToken, // getIdToken を戻り値に追加
  };
};

export default useLiff;
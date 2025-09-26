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
  getIdToken: () => string | null;
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

        // 型アサーションで型エラーを回避
        const liff = (window as any).liff;
        if (!liff) {
          throw new Error('LIFF SDKが読み込まれていません');
        }

        await liff.init({ liffId });

        if (liff.isLoggedIn()) {
          setIsLoggedIn(true);
          const userProfile = await liff.getProfile();
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
      const liff = (window as any).liff;
      if (liff && !liff.isLoggedIn()) {
        liff.login();
      }
    } catch (err: any) {
      console.error('ログインエラー:', err);
      setError(err.message || 'ログインに失敗しました');
    }
  };

  const getIdToken = (): string | null => {
    try {
      const liff = (window as any).liff;
      if (liff && liff.isLoggedIn() && liff.getIDToken) {
        return liff.getIDToken();
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
    getIdToken,
  };
};

export default useLiff;
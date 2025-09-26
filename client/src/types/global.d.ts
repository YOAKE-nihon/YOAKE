// グローバル型定義
declare global {
    interface Window {
      liff?: {
        init: (config: { liffId: string }) => Promise<void>;
        isInClient: () => boolean;
        isLoggedIn: () => boolean;
        login: () => void;
        logout: () => void;
        getProfile: () => Promise<{
          userId: string;
          displayName: string;
          pictureUrl?: string;
          statusMessage?: string;
        }>;
        getIDToken: () => string;
        closeWindow: () => void;
        sendMessages: (messages: any[]) => Promise<void>;
        scanCodeV2: () => Promise<{ value: string } | null>;
      };
    }
  }
  
  // 空のexportでモジュールとして認識させる
  export {};
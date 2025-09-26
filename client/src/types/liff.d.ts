// LIFF type extensions
declare global {
  interface Window {
    liff?: {
      // Core methods
      init: (config: { liffId: string }) => Promise<void>;
      isLoggedIn: () => boolean;
      isInClient: () => boolean;
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
      // Extended methods
      scanCodeV2?: () => Promise<{ value: string }>;
    };
  }
}
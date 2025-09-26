// LIFF type extensions for missing methods
declare global {
  interface Window {
    liff?: import('@line/liff').Liff & {
      scanCodeV2?: () => Promise<{ value: string }>;
    };
  }
}
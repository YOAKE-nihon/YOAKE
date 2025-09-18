import { Client, MessageAPIResponseBase, TextMessage, RichMenu } from '@line/bot-sdk';
import axios from 'axios';
import { lineConfig } from '../config';
import { AppError, LineProfile } from '../types';

class LineService {
  private client: Client;

  constructor() {
    if (!lineConfig.messagingApiToken) {
      throw new Error('LINE Messaging API token is required');
    }

    this.client = new Client({
      channelAccessToken: lineConfig.messagingApiToken,
    });
  }

  /**
   * Send a text message to a user
   */
  async sendTextMessage(userId: string, text: string): Promise<MessageAPIResponseBase> {
    try {
      const message: TextMessage = {
        type: 'text',
        text,
      };

      return await this.client.pushMessage(userId, message);
    } catch (error) {
      console.error('LINE send message error:', error);
      throw new AppError('メッセージの送信に失敗しました', 500);
    }
  }

  /**
   * Send account linking invitation message
   */
  async sendAccountLinkingMessage(userId: string): Promise<MessageAPIResponseBase> {
    try {
      const linkingUrl = `https://liff.line.me/${lineConfig.liffIds.linking}`;
      
      const message: TextMessage = {
        type: 'text',
        text: `🎉 YOAKE会員登録ありがとうございます！

最後のステップとして、LINEアカウントと会員情報を連携してください。

下記のボタンから連携画面に進み、登録時のメールアドレスを入力してください。

連携完了後、リッチメニューから各種機能をご利用いただけます。

▼ アカウント連携に進む
${linkingUrl}

※このメッセージは24時間以内にお手続きください。`,
      };

      return await this.client.pushMessage(userId, message);
    } catch (error) {
      console.error('LINE account linking message error:', error);
      throw new AppError('アカウント連携メッセージの送信に失敗しました', 500);
    }
  }

  /**
   * Send welcome message after account linking
   */
  async sendWelcomeMessage(userId: string): Promise<MessageAPIResponseBase> {
    try {
      const message: TextMessage = {
        type: 'text',
        text: `✅ アカウント連携が完了しました！

YOAKEへようこそ！🎊

下記の機能をご利用いただけます：

📱 デジタル会員証
🏪 店舗チェックイン
🎁 特典クーポン
📊 来店履歴・分析

メニューボタンから各機能にアクセスできます。
素敵なコワーキング体験をお楽しみください！`,
      };

      return await this.client.pushMessage(userId, message);
    } catch (error) {
      console.error('LINE welcome message error:', error);
      throw new AppError('ウェルカムメッセージの送信に失敗しました', 500);
    }
  }

  /**
   * Get user profile from LINE API
   */
  async getUserProfile(userId: string): Promise<LineProfile> {
    try {
      const profile = await this.client.getProfile(userId);
      return {
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
        statusMessage: profile.statusMessage,
      };
    } catch (error) {
      console.error('LINE get profile error:', error);
      throw new AppError('LINEプロフィールの取得に失敗しました', 500);
    }
  }

  /**
   * Set rich menu for user
   */
  async setUserRichMenu(userId: string, richMenuId: string): Promise<void> {
    try {
      await this.client.linkRichMenuToUser(userId, richMenuId);
    } catch (error) {
      console.error('LINE set rich menu error:', error);
      throw new AppError('リッチメニューの設定に失敗しました', 500);
    }
  }

  /**
   * Remove rich menu from user
   */
  async removeUserRichMenu(userId: string): Promise<void> {
    try {
      await this.client.unlinkRichMenuFromUser(userId);
    } catch (error) {
      console.error('LINE remove rich menu error:', error);
      // Don't throw error if rich menu is not set
    }
  }

  /**
   * Get all rich menus
   */
  async getRichMenus(): Promise<RichMenu[]> {
    try {
      const response = await axios.get('https://api.line.me/v2/bot/richmenu/list', {
        headers: {
          'Authorization': `Bearer ${lineConfig.messagingApiToken}`,
        },
      });

      return response.data.richmenus || [];
    } catch (error) {
      console.error('LINE get rich menus error:', error);
      throw new AppError('リッチメニューの取得に失敗しました', 500);
    }
  }

  /**
   * Create a rich menu
   */
  async createRichMenu(richMenuData: any): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.line.me/v2/bot/richmenu',
        richMenuData,
        {
          headers: {
            'Authorization': `Bearer ${lineConfig.messagingApiToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.richMenuId;
    } catch (error) {
      console.error('LINE create rich menu error:', error);
      throw new AppError('リッチメニューの作成に失敗しました', 500);
    }
  }

  /**
   * Upload rich menu image
   */
  async uploadRichMenuImage(richMenuId: string, imageBuffer: Buffer, contentType: string): Promise<void> {
    try {
      await axios.post(
        `https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`,
        imageBuffer,
        {
          headers: {
            'Authorization': `Bearer ${lineConfig.messagingApiToken}`,
            'Content-Type': contentType,
          },
        }
      );
    } catch (error) {
      console.error('LINE upload rich menu image error:', error);
      throw new AppError('リッチメニュー画像のアップロードに失敗しました', 500);
    }
  }

  /**
   * Delete a rich menu
   */
  async deleteRichMenu(richMenuId: string): Promise<void> {
    try {
      await axios.delete(`https://api.line.me/v2/bot/richmenu/${richMenuId}`, {
        headers: {
          'Authorization': `Bearer ${lineConfig.messagingApiToken}`,
        },
      });
    } catch (error) {
      console.error('LINE delete rich menu error:', error);
      throw new AppError('リッチメニューの削除に失敗しました', 500);
    }
  }

  /**
   * Set default rich menu
   */
  async setDefaultRichMenu(richMenuId: string): Promise<void> {
    try {
      await axios.post(
        `https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${lineConfig.messagingApiToken}`,
          },
        }
      );
    } catch (error) {
      console.error('LINE set default rich menu error:', error);
      throw new AppError('デフォルトリッチメニューの設定に失敗しました', 500);
    }
  }

  /**
   * Get default rich menu
   */
  async getDefaultRichMenu(): Promise<string | null> {
    try {
      const response = await axios.get('https://api.line.me/v2/bot/user/all/richmenu', {
        headers: {
          'Authorization': `Bearer ${lineConfig.messagingApiToken}`,
        },
      });

      return response.data.richMenuId || null;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // No default rich menu set
      }
      console.error('LINE get default rich menu error:', error);
      throw new AppError('デフォルトリッチメニューの取得に失敗しました', 500);
    }
  }

  /**
   * Broadcast message to all users
   */
  async broadcastMessage(message: TextMessage): Promise<MessageAPIResponseBase> {
    try {
      return await this.client.broadcast(message);
    } catch (error) {
      console.error('LINE broadcast message error:', error);
      throw new AppError('ブロードキャストメッセージの送信に失敗しました', 500);
    }
  }

  /**
   * Send push message with retry logic
   */
  async sendMessageWithRetry(
    userId: string, 
    message: TextMessage, 
    maxRetries: number = 3
  ): Promise<MessageAPIResponseBase> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.client.pushMessage(userId, message);
      } catch (error) {
        lastError = error as Error;
        console.warn(`Message send attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
      }
    }
    
    throw new AppError(`メッセージ送信に${maxRetries}回失敗しました: ${lastError!.message}`, 500);
  }

  /**
   * Validate LINE webhook signature
   */
  validateSignature(body: string, signature: string): boolean {
    try {
      const crypto = require('crypto');
      const channelSecret = lineConfig.loginChannelSecret;
      
      if (!channelSecret) {
        console.warn('LINE channel secret not configured');
        return false;
      }

      const hash = crypto
        .createHmac('SHA256', channelSecret)
        .update(body)
        .digest('base64');

      return hash === signature;
    } catch (error) {
      console.error('LINE signature validation error:', error);
      return false;
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhookEvent(event: any): Promise<void> {
    try {
      switch (event.type) {
        case 'message':
          await this.handleMessageEvent(event);
          break;
        case 'follow':
          await this.handleFollowEvent(event);
          break;
        case 'unfollow':
          await this.handleUnfollowEvent(event);
          break;
        case 'postback':
          await this.handlePostbackEvent(event);
          break;
        default:
          console.log('Unhandled event type:', event.type);
      }
    } catch (error) {
      console.error('Error handling webhook event:', error);
    }
  }

  /**
   * Handle message events
   */
  private async handleMessageEvent(event: any): Promise<void> {
    const userId = event.source.userId;
    const messageText = event.message.text;

    // Simple auto-reply logic
    if (messageText?.toLowerCase().includes('help') || messageText?.includes('ヘルプ')) {
      await this.sendTextMessage(userId, `
YOAKEへようこそ！

利用可能な機能：
📱 会員証表示
🏪 店舗チェックイン  
📊 来店履歴確認

メニューボタンからアクセスできます。
ご質問がございましたら、お気軽にお声がけください。
      `);
    }
  }

  /**
   * Handle follow events (new friend)
   */
  private async handleFollowEvent(event: any): Promise<void> {
    const userId = event.source.userId;
    
    await this.sendTextMessage(userId, `
YOAKEの公式LINEアカウントにご登録いただき、ありがとうございます！🎉

【初めての方】
まずは会員登録を行い、アカウント連携を完了してください。

【既に会員の方】  
メニューから各種機能をご利用いただけます。

何かご不明な点がございましたら、お気軽にメッセージをお送りください。
    `);
  }

  /**
   * Handle unfollow events
   */
  private async handleUnfollowEvent(event: any): Promise<void> {
    const userId = event.source.userId;
    console.log(`User ${userId} unfollowed the account`);
    
    // Log for analytics, but don't send messages to unfollowed users
  }

  /**
   * Handle postback events
   */
  private async handlePostbackEvent(event: any): Promise<void> {
    const userId = event.source.userId;
    const postbackData = event.postback.data;

    // Handle different postback actions
    switch (postbackData) {
      case 'get_help':
        await this.sendTextMessage(userId, 'サポートチームにお繋ぎします...');
        break;
      default:
        console.log('Unhandled postback:', postbackData);
    }
  }

  /**
   * Send check-in success notification
   */
  async sendCheckinNotification(userId: string, storeName: string): Promise<void> {
    try {
      const message: TextMessage = {
        type: 'text',
        text: `✅ ${storeName}へのチェックインが完了しました！

🎁 ドリンク無料クーポンをお受け取りください
📊 来店データが会員証に反映されます

いつもYOAKEをご利用いただき、ありがとうございます！`,
      };

      await this.client.pushMessage(userId, message);
    } catch (error) {
      console.error('Check-in notification error:', error);
      // Don't throw as this is not critical
    }
  }

  /**
   * Send monthly usage summary
   */
  async sendMonthlySummary(userId: string, visitCount: number): Promise<void> {
    try {
      const message: TextMessage = {
        type: 'text',
        text: `📊 今月の利用状況

今月の来店回数: ${visitCount}回

継続的なご利用ありがとうございます！
来月もYOAKEでお待ちしております。

詳細な統計は会員証からご確認いただけます。`,
      };

      await this.client.pushMessage(userId, message);
    } catch (error) {
      console.error('Monthly summary error:', error);
    }
  }
}

// Export singleton instance
export const lineService = new LineService();
export default lineService;
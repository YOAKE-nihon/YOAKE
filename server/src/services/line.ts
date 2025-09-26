import { Client, MessageAPIResponseBase, TextMessage } from '@line/bot-sdk';
import axios from 'axios';
import crypto from 'crypto';
import { lineConfig } from '../config';
import { AppError, LineProfile, LineIdTokenPayload } from '../types';

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
   * Verify LINE ID token (simplified version)
   */
  async verifyIdToken(idToken: string): Promise<LineIdTokenPayload | null> {
    try {
      if (!idToken || typeof idToken !== 'string') {
        return null;
      }

      // Parse the JWT token (simplified - should verify signature in production)
      const parts = idToken.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = Buffer.from(parts[1], 'base64url').toString();
      const parsed = JSON.parse(payload) as LineIdTokenPayload;

      // Basic validation
      if (!parsed.sub || !parsed.iss || !parsed.aud) {
        return null;
      }

      // Check if token is expired
      if (parsed.exp && Date.now() / 1000 > parsed.exp) {
        return null;
      }

      return parsed;
    } catch (error) {
      console.error('Failed to verify LINE ID token:', error);
      return null;
    }
  }

  /**
   * Get user profile from LINE API
   */
  async getUserProfile(userId: string): Promise<LineProfile> {
    try {
      const response = await axios.get(
        `https://api.line.me/v2/bot/profile/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${lineConfig.messagingApiToken}`,
          },
        }
      );

      return {
        userId: response.data.userId,
        displayName: response.data.displayName,
        pictureUrl: response.data.pictureUrl,
        statusMessage: response.data.statusMessage,
      };
    } catch (error) {
      console.error('LINE get profile error:', error);
      throw new AppError('LINEプロフィールの取得に失敗しました', 500);
    }
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
   * Validate webhook signature
   */
  validateSignature(body: string, signature: string): boolean {
    try {
      // Use Messaging API channel secret for webhook validation
      const channelSecret = lineConfig.messagingChannelSecret;
      
      if (!channelSecret) {
        console.warn('LINE Messaging API channel secret not configured');
        return false;
      }

      const hash = crypto
        .createHmac('sha256', channelSecret)
        .update(body)
        .digest('base64');

      return signature === hash;
    } catch (error) {
      console.error('Signature validation error:', error);
      return false;
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhookEvent(event: any): Promise<void> {
    try {
      console.log('Processing LINE webhook event:', event.type);
      
      switch (event.type) {
        case 'message':
          // Handle message events
          console.log('Message event received:', event.message);
          break;
        case 'follow':
          // Handle follow events
          console.log('Follow event received:', event.source);
          break;
        case 'unfollow':
          // Handle unfollow events
          console.log('Unfollow event received:', event.source);
          break;
        default:
          console.log('Unknown event type:', event.type);
      }
    } catch (error) {
      const err = error as Error;
      console.error('Webhook event handling error:', err.message);
      throw new AppError(`Webhook処理中にエラーが発生しました: ${err.message}`, 500);
    }
  }
}

export const lineService = new LineService();
export default lineService;
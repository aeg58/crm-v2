import webpush from 'web-push';
import { config } from '@crm/config';

// Notification Service Class
export class NotificationService {
  private vapidKeys: {
    publicKey: string;
    privateKey: string;
  };

  constructor() {
    // Initialize VAPID keys for push notifications
    this.vapidKeys = {
      publicKey: process.env.VAPID_PUBLIC_KEY || 'your-public-key',
      privateKey: process.env.VAPID_PRIVATE_KEY || 'your-private-key'
    };

    webpush.setVapidDetails(
      'mailto:admin@yourcompany.com',
      this.vapidKeys.publicKey,
      this.vapidKeys.privateKey
    );
  }

  // Send lead alert notification
  async sendLeadAlert(lead: any, user: any): Promise<void> {
    try {
      const notification = {
        title: 'New High-Value Lead',
        body: `New lead from ${lead.customer?.name} with score ${lead.score}`,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        data: {
          leadId: lead.id,
          customerId: lead.customerId,
          score: lead.score,
          url: `/leads/${lead.id}`
        },
        actions: [
          {
            action: 'view',
            title: 'View Lead',
            icon: '/view-icon.png'
          },
          {
            action: 'dismiss',
            title: 'Dismiss',
            icon: '/dismiss-icon.png'
          }
        ]
      };

      // Send push notification if user has subscription
      if (user.pushSubscription) {
        await this.sendPushNotification(user.pushSubscription, notification);
      }

      // Send email notification
      await this.sendEmailNotification(user.email, {
        subject: 'New High-Value Lead Alert',
        template: 'lead-alert',
        data: {
          leadName: lead.customer?.name,
          leadScore: lead.score,
          leadSource: lead.source,
          leadUrl: `${config.corsOrigin}/leads/${lead.id}`
        }
      });

      console.log(`Lead alert sent to user ${user.id}`);
    } catch (error) {
      console.error('Error sending lead alert:', error);
    }
  }

  // Send daily summary
  async sendDailySummary(userId: string, summary: any): Promise<void> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return;

      const notification = {
        title: 'Daily CRM Summary',
        body: `${summary.totalLeads} new leads, ${summary.totalMessages} messages`,
        icon: '/icon-192x192.png',
        data: {
          summary,
          url: '/dashboard'
        }
      };

      if (user.pushSubscription) {
        await this.sendPushNotification(user.pushSubscription, notification);
      }

      await this.sendEmailNotification(user.email, {
        subject: 'Daily CRM Summary',
        template: 'daily-summary',
        data: summary
      });

      console.log(`Daily summary sent to user ${userId}`);
    } catch (error) {
      console.error('Error sending daily summary:', error);
    }
  }

  // Send high-value customer alert
  async sendHighValueCustomerAlert(customer: any, user: any): Promise<void> {
    try {
      const notification = {
        title: 'High-Value Customer Activity',
        body: `${customer.name} has shown increased engagement`,
        icon: '/icon-192x192.png',
        data: {
          customerId: customer.id,
          url: `/customers/${customer.id}`
        }
      };

      if (user.pushSubscription) {
        await this.sendPushNotification(user.pushSubscription, notification);
      }

      await this.sendEmailNotification(user.email, {
        subject: 'High-Value Customer Alert',
        template: 'customer-alert',
        data: {
          customerName: customer.name,
          customerUrl: `${config.corsOrigin}/customers/${customer.id}`
        }
      });

      console.log(`High-value customer alert sent to user ${user.id}`);
    } catch (error) {
      console.error('Error sending customer alert:', error);
    }
  }

  // Send message notification
  async sendMessageNotification(message: any, user: any): Promise<void> {
    try {
      const notification = {
        title: 'New Message',
        body: `New message from ${message.customer?.name}`,
        icon: '/icon-192x192.png',
        data: {
          messageId: message.id,
          customerId: message.customerId,
          url: `/messages/${message.id}`
        }
      };

      if (user.pushSubscription) {
        await this.sendPushNotification(user.pushSubscription, notification);
      }

      console.log(`Message notification sent to user ${user.id}`);
    } catch (error) {
      console.error('Error sending message notification:', error);
    }
  }

  // Send system alert
  async sendSystemAlert(alert: {
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error';
    userId?: string;
  }): Promise<void> {
    try {
      const notification = {
        title: alert.title,
        body: alert.message,
        icon: '/icon-192x192.png',
        badge: alert.type === 'error' ? '/error-badge.png' : '/badge-72x72.png',
        data: {
          type: alert.type,
          timestamp: new Date().toISOString()
        }
      };

      if (alert.userId) {
        const user = await this.getUserById(alert.userId);
        if (user?.pushSubscription) {
          await this.sendPushNotification(user.pushSubscription, notification);
        }
      } else {
        // Send to all users with push subscriptions
        const users = await this.getAllUsersWithPushSubscriptions();
        for (const user of users) {
          await this.sendPushNotification(user.pushSubscription, notification);
        }
      }

      console.log(`System alert sent: ${alert.title}`);
    } catch (error) {
      console.error('Error sending system alert:', error);
    }
  }

  // Private methods
  private async sendPushNotification(subscription: any, payload: any): Promise<void> {
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
    } catch (error: any) {
      console.error('Push notification failed:', error);
      // Handle invalid subscription
      if (error.statusCode === 410) {
        await this.removeInvalidSubscription(subscription);
      }
    }
  }

  private async sendEmailNotification(email: string, data: {
    subject: string;
    template: string;
    data: any;
  }): Promise<void> {
    try {
      // This would integrate with an email service like SendGrid, AWS SES, etc.
      console.log(`Email notification sent to ${email}:`, data);
      
      // Placeholder for actual email sending
      // await emailService.send({
      //   to: email,
      //   subject: data.subject,
      //   template: data.template,
      //   data: data.data
      // });
    } catch (error) {
      console.error('Email notification failed:', error);
    }
  }

  private async getUserById(userId: string): Promise<any> {
    // This would fetch user from database
    // Placeholder implementation
    return {
      id: userId,
      email: 'user@example.com',
      pushSubscription: null
    };
  }

  private async getAllUsersWithPushSubscriptions(): Promise<any[]> {
    // This would fetch all users with push subscriptions from database
    // Placeholder implementation
    return [];
  }

  private async removeInvalidSubscription(subscription: any): Promise<void> {
    // This would remove invalid subscription from database
    console.log('Removing invalid push subscription');
  }

  // Public key getter for frontend
  getPublicKey(): string {
    return this.vapidKeys.publicKey;
  }
}

// Notification Service Instance
export const notificationService = new NotificationService();

// Notification types
export interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export interface EmailNotificationData {
  subject: string;
  template: string;
  data: any;
}

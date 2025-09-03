import { Request, Response } from 'express';
import { prisma } from '../lib/database';
import { CreateMessageInput, MessageQuery } from '@crm/types';

export class MessageController {
  /**
   * Get all messages with pagination and filtering
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        customerId,
        platform,
        direction,
        sentiment,
      }: MessageQuery = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      // Build where clause
      const where: any = {};

      if (customerId) {
        where.customerId = customerId;
      }

      if (platform) {
        where.platform = platform.toUpperCase();
      }

      if (direction) {
        where.direction = direction.toUpperCase();
      }

      if (sentiment) {
        where.sentiment = sentiment.toUpperCase();
      }

      // Get messages and total count
      const [messages, total] = await Promise.all([
        prisma.message.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        }),
        prisma.message.count({ where }),
      ]);

      const totalPages = Math.ceil(total / take);

      res.json({
        success: true,
        data: messages,
        pagination: {
          page: Number(page),
          limit: take,
          total,
          totalPages,
        },
      });
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Get message by ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const message = await prisma.message.findUnique({
        where: { id },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      if (!message) {
        res.status(404).json({
          success: false,
          error: 'Message not found',
        });
        return;
      }

      res.json({
        success: true,
        data: message,
      });
    } catch (error) {
      console.error('Get message error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Create new message
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateMessageInput = req.body;

      // Verify customer exists
      const customer = await prisma.customer.findUnique({
        where: { id: data.customerId },
      });

      if (!customer) {
        res.status(404).json({
          success: false,
          error: 'Customer not found',
        });
        return;
      }

      const message = await prisma.message.create({
        data: {
          customerId: data.customerId,
          content: data.content,
          direction: data.direction.toUpperCase() as any,
          platform: data.platform.toUpperCase() as any,
          metadata: data.metadata || {},
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: message,
        message: 'Message created successfully',
      });
    } catch (error) {
      console.error('Create message error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Update message analysis
   */
  static async updateAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { sentiment, leadScore, intent, tags } = req.body;

      // Check if message exists
      const existingMessage = await prisma.message.findUnique({
        where: { id },
      });

      if (!existingMessage) {
        res.status(404).json({
          success: false,
          error: 'Message not found',
        });
        return;
      }

      const updateData: any = {};
      if (sentiment) updateData.sentiment = sentiment.toUpperCase();
      if (leadScore !== undefined) updateData.leadScore = leadScore;
      if (intent) updateData.intent = intent;
      if (tags) updateData.tags = tags;

      const message = await prisma.message.update({
        where: { id },
        data: updateData,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: message,
        message: 'Message analysis updated successfully',
      });
    } catch (error) {
      console.error('Update message analysis error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Delete message
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if message exists
      const existingMessage = await prisma.message.findUnique({
        where: { id },
      });

      if (!existingMessage) {
        res.status(404).json({
          success: false,
          error: 'Message not found',
        });
        return;
      }

      await prisma.message.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Message deleted successfully',
      });
    } catch (error) {
      console.error('Delete message error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Get message statistics
   */
  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await prisma.message.groupBy({
        by: ['platform', 'direction', 'sentiment'],
        _count: {
          id: true,
        },
      });

      const totalMessages = await prisma.message.count();
      const messagesToday = await prisma.message.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      });

      const avgLeadScore = await prisma.message.aggregate({
        _avg: {
          leadScore: true,
        },
        where: {
          leadScore: {
            not: null,
          },
        },
      });

      res.json({
        success: true,
        data: {
          total: totalMessages,
          today: messagesToday,
          avgLeadScore: avgLeadScore._avg.leadScore || 0,
          byPlatform: stats.reduce((acc, stat) => {
            acc[stat.platform] = (acc[stat.platform] || 0) + stat._count.id;
            return acc;
          }, {} as Record<string, number>),
          byDirection: stats.reduce((acc, stat) => {
            acc[stat.direction] = (acc[stat.direction] || 0) + stat._count.id;
            return acc;
          }, {} as Record<string, number>),
          bySentiment: stats.reduce((acc, stat) => {
            if (stat.sentiment) {
              acc[stat.sentiment] = (acc[stat.sentiment] || 0) + stat._count.id;
            }
            return acc;
          }, {} as Record<string, number>),
        },
      });
    } catch (error) {
      console.error('Get message stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}

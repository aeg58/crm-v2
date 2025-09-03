import { Request, Response } from 'express';
import { prisma } from '../lib/database';
import { CreateLeadInput, UpdateLeadInput, LeadQuery } from '@crm/types';

export class LeadController {
  /**
   * Get all leads with pagination and filtering
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        minScore,
        maxScore,
      }: LeadQuery = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      // Build where clause
      const where: any = {};

      if (status) {
        where.status = status.toUpperCase();
      }

      if (minScore !== undefined || maxScore !== undefined) {
        where.score = {};
        if (minScore !== undefined) where.score.gte = Number(minScore);
        if (maxScore !== undefined) where.score.lte = Number(maxScore);
      }

      // Get leads and total count
      const [leads, total] = await Promise.all([
        prisma.lead.findMany({
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
                company: true,
              },
            },
          },
        }),
        prisma.lead.count({ where }),
      ]);

      const totalPages = Math.ceil(total / take);

      res.json({
        success: true,
        data: leads,
        pagination: {
          page: Number(page),
          limit: take,
          total,
          totalPages,
        },
      });
    } catch (error) {
      console.error('Get leads error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Get lead by ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const lead = await prisma.lead.findUnique({
        where: { id },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              company: true,
            },
          },
        },
      });

      if (!lead) {
        res.status(404).json({
          success: false,
          error: 'Lead not found',
        });
        return;
      }

      res.json({
        success: true,
        data: lead,
      });
    } catch (error) {
      console.error('Get lead error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Create new lead
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateLeadInput = req.body;

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

      const lead = await prisma.lead.create({
        data: {
          customerId: data.customerId,
          score: data.score,
          status: data.status?.toUpperCase() as any || 'NEW',
          source: data.source,
          notes: data.notes,
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              company: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: lead,
        message: 'Lead created successfully',
      });
    } catch (error) {
      console.error('Create lead error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Update lead
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateLeadInput = req.body;

      // Check if lead exists
      const existingLead = await prisma.lead.findUnique({
        where: { id },
      });

      if (!existingLead) {
        res.status(404).json({
          success: false,
          error: 'Lead not found',
        });
        return;
      }

      const updateData: any = {};
      if (data.score !== undefined) updateData.score = data.score;
      if (data.status) updateData.status = data.status.toUpperCase();
      if (data.notes !== undefined) updateData.notes = data.notes;

      const lead = await prisma.lead.update({
        where: { id },
        data: updateData,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              company: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: lead,
        message: 'Lead updated successfully',
      });
    } catch (error) {
      console.error('Update lead error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Delete lead
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if lead exists
      const existingLead = await prisma.lead.findUnique({
        where: { id },
      });

      if (!existingLead) {
        res.status(404).json({
          success: false,
          error: 'Lead not found',
        });
        return;
      }

      await prisma.lead.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Lead deleted successfully',
      });
    } catch (error) {
      console.error('Delete lead error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Get lead statistics
   */
  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await prisma.lead.groupBy({
        by: ['status'],
        _count: {
          id: true,
        },
        _avg: {
          score: true,
        },
      });

      const totalLeads = await prisma.lead.count();
      const activeLeads = await prisma.lead.count({
        where: {
          status: {
            in: ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION'],
          },
        },
      });

      const avgScore = await prisma.lead.aggregate({
        _avg: {
          score: true,
        },
      });

      const conversionRate = totalLeads > 0 
        ? (await prisma.lead.count({ where: { status: 'CLOSED_WON' } })) / totalLeads * 100
        : 0;

      res.json({
        success: true,
        data: {
          total: totalLeads,
          active: activeLeads,
          avgScore: avgScore._avg.score || 0,
          conversionRate: Math.round(conversionRate * 100) / 100,
          byStatus: stats.reduce((acc, stat) => {
            acc[stat.status] = {
              count: stat._count.id,
              avgScore: stat._avg.score || 0,
            };
            return acc;
          }, {} as Record<string, { count: number; avgScore: number }>),
        },
      });
    } catch (error) {
      console.error('Get lead stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}

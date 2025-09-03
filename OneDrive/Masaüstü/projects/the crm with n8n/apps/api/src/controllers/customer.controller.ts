import { Request, Response } from 'express';
import { prisma } from '../lib/database';
import { CreateCustomerInput, UpdateCustomerInput, CustomerQuery } from '@crm/types';

export class CustomerController {
  /**
   * Get all customers with pagination and filtering
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        source,
        tags,
      }: CustomerQuery = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      // Build where clause
      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (status) {
        where.status = status.toUpperCase();
      }

      if (source) {
        where.source = source.toUpperCase();
      }

      if (tags && Array.isArray(tags)) {
        where.tags = { hasSome: tags };
      }

      // Get customers and total count
      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: {
                messages: true,
                leads: true,
              },
            },
          },
        }),
        prisma.customer.count({ where }),
      ]);

      const totalPages = Math.ceil(total / take);

      res.json({
        success: true,
        data: customers,
        pagination: {
          page: Number(page),
          limit: take,
          total,
          totalPages,
        },
      });
    } catch (error) {
      console.error('Get customers error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Get customer by ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          leads: {
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              messages: true,
              leads: true,
            },
          },
        },
      });

      if (!customer) {
        res.status(404).json({
          success: false,
          error: 'Customer not found',
        });
        return;
      }

      res.json({
        success: true,
        data: customer,
      });
    } catch (error) {
      console.error('Get customer error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Create new customer
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateCustomerInput = req.body;

      const customer = await prisma.customer.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          company: data.company,
          source: data.source.toUpperCase() as any,
          tags: data.tags || [],
          notes: data.notes,
        },
        include: {
          _count: {
            select: {
              messages: true,
              leads: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: customer,
        message: 'Customer created successfully',
      });
    } catch (error) {
      console.error('Create customer error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Update customer
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateCustomerInput = req.body;

      // Check if customer exists
      const existingCustomer = await prisma.customer.findUnique({
        where: { id },
      });

      if (!existingCustomer) {
        res.status(404).json({
          success: false,
          error: 'Customer not found',
        });
        return;
      }

      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.company !== undefined) updateData.company = data.company;
      if (data.status) updateData.status = data.status.toUpperCase();
      if (data.tags) updateData.tags = data.tags;
      if (data.notes !== undefined) updateData.notes = data.notes;

      const customer = await prisma.customer.update({
        where: { id },
        data: updateData,
        include: {
          _count: {
            select: {
              messages: true,
              leads: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: customer,
        message: 'Customer updated successfully',
      });
    } catch (error) {
      console.error('Update customer error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Delete customer
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if customer exists
      const existingCustomer = await prisma.customer.findUnique({
        where: { id },
      });

      if (!existingCustomer) {
        res.status(404).json({
          success: false,
          error: 'Customer not found',
        });
        return;
      }

      await prisma.customer.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Customer deleted successfully',
      });
    } catch (error) {
      console.error('Delete customer error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Get customer statistics
   */
  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await prisma.customer.groupBy({
        by: ['status', 'source'],
        _count: {
          id: true,
        },
      });

      const totalCustomers = await prisma.customer.count();
      const newCustomersToday = await prisma.customer.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      });

      res.json({
        success: true,
        data: {
          total: totalCustomers,
          newToday: newCustomersToday,
          byStatus: stats.reduce((acc, stat) => {
            acc[stat.status] = (acc[stat.status] || 0) + stat._count.id;
            return acc;
          }, {} as Record<string, number>),
          bySource: stats.reduce((acc, stat) => {
            acc[stat.source] = (acc[stat.source] || 0) + stat._count.id;
            return acc;
          }, {} as Record<string, number>),
        },
      });
    } catch (error) {
      console.error('Get customer stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}

import { Request, Response } from 'express';
import { prisma } from '../lib/database';
import { analyzeText } from '../lib/gemini';
import { N8NWebhookPayload } from '@crm/types';
import { io } from '../lib/socket';

function toChannelUpper(c?: string): string {
  const channel = (c || '').toLowerCase();
  if (channel === 'whatsapp') return 'WHATSAPP';
  if (channel === 'instagram') return 'INSTAGRAM';
  return 'UNKNOWN';
}

function toDirectionUpper(d?: string): string {
  const direction = (d || '').toLowerCase();
  if (direction === 'outbound') return 'OUTBOUND';
  return 'INBOUND';
}

export class N8NWebhookController {
  /**
   * Handle incoming webhook from N8N
   */
  static async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      // Verify webhook secret
      const webhookSecret = req.headers['x-webhook-secret'] as string;
      if (webhookSecret !== process.env.N8N_WEBHOOK_SECRET) {
        res.status(401).json({
          success: false,
          error: 'Invalid webhook secret',
        });
        return;
      }

      const payload: N8NWebhookPayload = req.body;

      // Validate payload
      if (!payload.platform || !payload.customer || !payload.message) {
        res.status(400).json({
          success: false,
          error: 'Invalid payload structure',
        });
        return;
      }

      // Find or create customer
      let customer = await prisma.customer.findFirst({
        where: {
          OR: [
            { phone: payload.customer.phone },
            { email: payload.customer.email },
          ],
        },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            name: payload.customer.name,
            email: payload.customer.email,
            phone: payload.customer.phone,
            source: toChannelUpper(payload.platform) as any,
            tags: [],
          },
        });

        // Emit new customer event
        io.emit('customer:new', customer);
      }

      // Create message
      const message = await prisma.message.create({
        data: {
          customerId: customer.id,
          content: payload.message.content,
          direction: toDirectionUpper(payload.message.direction) as any,
          platform: toChannelUpper(payload.platform) as any,
          metadata: payload.message.metadata || {},
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

      // Emit new message event
      io.emit('message:new', message);

      // Analyze message with Gemini AI (async, don't wait)
      analyzeText(payload.message.content)
        .then(async (analysis) => {
          // Update message with analysis
          const updatedMessage = await prisma.message.update({
            where: { id: message.id },
            data: {
              sentiment: analysis.sentiment as any,
              leadScore: analysis.score,
              intent: analysis.intent,
              tags: analysis.tags,
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

          // Emit updated message event
          io.emit('message:updated', updatedMessage);

          // Create or update lead if score is high enough
          if (analysis.score >= 70) {
            const existingLead = await prisma.lead.findFirst({
              where: { customerId: customer.id },
            });

            if (existingLead) {
              // Update existing lead
              const updatedLead = await prisma.lead.update({
                where: { id: existingLead.id },
                data: {
                  score: Math.max(existingLead.score, analysis.score),
                  notes: existingLead.notes 
                    ? `${existingLead.notes}\n\nNew analysis: ${analysis.intent}`
                    : `AI Analysis: ${analysis.intent}`,
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

              io.emit('lead:update', updatedLead);
            } else {
              // Create new lead
              const newLead = await prisma.lead.create({
                data: {
                  customerId: customer.id,
                  score: analysis.score,
                  status: 'NEW',
                  source: `AI Analysis - ${payload.platform}`,
                  notes: `AI Analysis: ${analysis.intent}`,
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

              io.emit('lead:new', newLead);
            }
          }
        })
        .catch((error) => {
          console.error('AI analysis error:', error);
        });

      res.json({
        success: true,
        data: {
          customerId: customer.id,
          messageId: message.id,
        },
        message: 'Webhook processed successfully',
      });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Test webhook endpoint
   */
  static async testWebhook(req: Request, res: Response): Promise<void> {
    try {
      const testPayload: N8NWebhookPayload = {
        platform: 'WHATSAPP',
        customer: {
          name: 'Test Customer',
          phone: '+1234567890',
          email: 'test@example.com',
        },
        message: {
          content: 'Hello, I am interested in your services. Can you tell me more about pricing?',
          direction: 'INBOUND',
          timestamp: new Date().toISOString(),
          metadata: {
            messageId: 'test-123',
            from: '+1234567890',
          },
        },
      };

      // Process test payload
      await N8NWebhookController.handleWebhook(
        { ...req, body: testPayload, headers: { ...req.headers, 'x-webhook-secret': process.env.N8N_WEBHOOK_SECRET } } as any,
        res
      );
    } catch (error) {
      console.error('Test webhook error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}

import { PrismaClient } from '@prisma/client';
import { hashPassword } from './lib/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@crm.com' },
    update: {},
    create: {
      email: 'admin@crm.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // Create regular user
  const userPassword = await hashPassword('user123');
  const user = await prisma.user.upsert({
    where: { email: 'user@crm.com' },
    update: {},
    create: {
      email: 'user@crm.com',
      name: 'Regular User',
      password: userPassword,
      role: 'USER',
    },
  });

  console.log('👤 Created users:', { admin: admin.email, user: user.email });

  // Create sample customers
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { id: 'customer-1' },
      update: {},
      create: {
        id: 'customer-1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        company: 'Acme Corp',
        source: 'WHATSAPP',
        status: 'ACTIVE',
        tags: ['vip', 'enterprise'],
        notes: 'High-value customer interested in enterprise solutions',
      },
    }),
    prisma.customer.upsert({
      where: { id: 'customer-2' },
      update: {},
      create: {
        id: 'customer-2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1234567891',
        company: 'Tech Startup',
        source: 'INSTAGRAM',
        status: 'ACTIVE',
        tags: ['startup', 'tech'],
        notes: 'Startup founder looking for CRM solution',
      },
    }),
    prisma.customer.upsert({
      where: { id: 'customer-3' },
      update: {},
      create: {
        id: 'customer-3',
        name: 'Bob Johnson',
        email: 'bob@example.com',
        phone: '+1234567892',
        source: 'MANUAL',
        status: 'ACTIVE',
        tags: ['small-business'],
        notes: 'Small business owner',
      },
    }),
    prisma.customer.upsert({
      where: { id: 'customer-4' },
      update: {},
      create: {
        id: 'customer-4',
        name: 'Alice Brown',
        email: 'alice@example.com',
        phone: '+1234567893',
        company: 'Marketing Agency',
        source: 'WHATSAPP',
        status: 'INACTIVE',
        tags: ['agency', 'marketing'],
        notes: 'Marketing agency, not currently active',
      },
    }),
  ]);

  console.log('👥 Created customers:', customers.length);

  // Create sample messages
  const messages = await Promise.all([
    prisma.message.create({
      data: {
        customerId: 'customer-1',
        content: 'Hi, I\'m interested in your CRM solution. Can you tell me more about pricing?',
        direction: 'INBOUND',
        platform: 'WHATSAPP',
        sentiment: 'POSITIVE',
        leadScore: 85,
        intent: 'pricing inquiry',
        tags: ['pricing', 'interest'],
        metadata: {
          messageId: 'msg-1',
          from: '+1234567890',
        },
      },
    }),
    prisma.message.create({
      data: {
        customerId: 'customer-1',
        content: 'Thanks for the information. I\'d like to schedule a demo.',
        direction: 'INBOUND',
        platform: 'WHATSAPP',
        sentiment: 'POSITIVE',
        leadScore: 90,
        intent: 'demo request',
        tags: ['demo', 'high-intent'],
        metadata: {
          messageId: 'msg-2',
          from: '+1234567890',
        },
      },
    }),
    prisma.message.create({
      data: {
        customerId: 'customer-2',
        content: 'Hello! I saw your Instagram post about CRM features. Very impressive!',
        direction: 'INBOUND',
        platform: 'INSTAGRAM',
        sentiment: 'POSITIVE',
        leadScore: 75,
        intent: 'social media engagement',
        tags: ['social', 'engagement'],
        metadata: {
          messageId: 'msg-3',
          from: 'jane_smith',
        },
      },
    }),
    prisma.message.create({
      data: {
        customerId: 'customer-3',
        content: 'I need help with setting up my account. Can someone assist me?',
        direction: 'INBOUND',
        platform: 'MANUAL',
        sentiment: 'NEUTRAL',
        leadScore: 60,
        intent: 'support request',
        tags: ['support', 'setup'],
        metadata: {
          messageId: 'msg-4',
          source: 'email',
        },
      },
    }),
    prisma.message.create({
      data: {
        customerId: 'customer-1',
        content: 'Hi John! Thanks for your interest. I\'d be happy to help you with pricing information.',
        direction: 'OUTBOUND',
        platform: 'WHATSAPP',
        sentiment: 'POSITIVE',
        leadScore: 85,
        intent: 'response to pricing inquiry',
        tags: ['response', 'pricing'],
        metadata: {
          messageId: 'msg-5',
          to: '+1234567890',
        },
      },
    }),
  ]);

  console.log('💬 Created messages:', messages.length);

  // Create sample leads
  const leads = await Promise.all([
    prisma.lead.create({
      data: {
        customerId: 'customer-1',
        score: 90,
        status: 'QUALIFIED',
        source: 'WhatsApp conversation',
        notes: 'High-value enterprise customer, very interested in demo',
      },
    }),
    prisma.lead.create({
      data: {
        customerId: 'customer-2',
        score: 75,
        status: 'CONTACTED',
        source: 'Instagram engagement',
        notes: 'Startup founder, good potential for growth',
      },
    }),
    prisma.lead.create({
      data: {
        customerId: 'customer-3',
        score: 60,
        status: 'NEW',
        source: 'Manual entry',
        notes: 'Small business owner, needs support',
      },
    }),
    prisma.lead.create({
      data: {
        customerId: 'customer-4',
        score: 40,
        status: 'CLOSED_LOST',
        source: 'WhatsApp conversation',
        notes: 'Marketing agency, not interested at this time',
      },
    }),
  ]);

  console.log('🎯 Created leads:', leads.length);

  // Create some additional messages for better data
  const additionalMessages = await Promise.all([
    prisma.message.create({
      data: {
        customerId: 'customer-2',
        content: 'What integrations do you support? We use Slack and Google Workspace.',
        direction: 'INBOUND',
        platform: 'INSTAGRAM',
        sentiment: 'POSITIVE',
        leadScore: 80,
        intent: 'integration inquiry',
        tags: ['integrations', 'slack', 'google'],
        metadata: {
          messageId: 'msg-6',
          from: 'jane_smith',
        },
      },
    }),
    prisma.message.create({
      data: {
        customerId: 'customer-1',
        content: 'Perfect! I\'m available next Tuesday at 2 PM. Does that work for you?',
        direction: 'INBOUND',
        platform: 'WHATSAPP',
        sentiment: 'POSITIVE',
        leadScore: 95,
        intent: 'demo scheduling',
        tags: ['demo', 'scheduling', 'high-intent'],
        metadata: {
          messageId: 'msg-7',
          from: '+1234567890',
        },
      },
    }),
    prisma.message.create({
      data: {
        customerId: 'customer-3',
        content: 'I\'m having trouble with the setup process. The instructions aren\'t clear.',
        direction: 'INBOUND',
        platform: 'MANUAL',
        sentiment: 'NEGATIVE',
        leadScore: 45,
        intent: 'complaint about setup',
        tags: ['complaint', 'setup', 'support'],
        metadata: {
          messageId: 'msg-8',
          source: 'email',
        },
      },
    }),
  ]);

  console.log('💬 Created additional messages:', additionalMessages.length);

  console.log('✅ Database seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Users: 2 (admin@crm.com, user@crm.com)`);
  console.log(`- Customers: ${customers.length}`);
  console.log(`- Messages: ${messages.length + additionalMessages.length}`);
  console.log(`- Leads: ${leads.length}`);
  console.log('\n🔑 Login credentials:');
  console.log('Admin: admin@crm.com / admin123');
  console.log('User: user@crm.com / user123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

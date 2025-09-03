# Modern CRM - React 18 + Node/Express + Prisma + N8N + Gemini API

A production-ready Customer Relationship Management system built with modern technologies, featuring AI-powered sentiment analysis, real-time updates, and seamless integration with WhatsApp & Instagram via N8N webhooks.

## 🚀 Features

- **Customer Management**: Complete CRUD operations for customer data
- **Message Tracking**: Real-time message monitoring with sentiment analysis
- **AI-Powered Analytics**: Gemini API integration for lead scoring and intent detection
- **Real-time Updates**: Socket.io for live dashboard updates
- **N8N Integration**: Webhook endpoints for WhatsApp & Instagram automation
- **Modern UI**: Responsive design with shadcn/ui components
- **Authentication**: JWT-based auth with HttpOnly cookies
- **Dashboard**: Analytics with charts and KPIs

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **shadcn/ui** + **Radix UI** for components
- **React Router** for navigation
- **React Query** for data fetching
- **Zustand** for state management
- **Recharts** for data visualization
- **Socket.io Client** for real-time updates

### Backend
- **Node.js** + **Express** with TypeScript
- **Prisma** ORM with PostgreSQL
- **JWT** authentication with HttpOnly cookies
- **Socket.io** for real-time communication
- **Gemini API** for AI analysis
- **Express Validator** for input validation
- **Helmet** for security

### Infrastructure
- **PostgreSQL** database
- **pgAdmin** for database management
- **Docker Compose** for local development
- **pnpm** workspaces for monorepo management

## 📁 Project Structure

```
modern-crm/
├── apps/
│   ├── api/                 # Backend API server
│   │   ├── src/
│   │   │   ├── controllers/ # API controllers
│   │   │   ├── middleware/  # Auth & validation middleware
│   │   │   ├── routes/      # API routes
│   │   │   ├── services/    # Business logic
│   │   │   ├── lib/         # Utilities (auth, database, socket)
│   │   │   └── webhooks/    # N8N webhook handlers
│   │   ├── prisma/          # Database schema & migrations
│   │   └── package.json
│   └── web/                 # Frontend React app
│       ├── src/
│       │   ├── components/  # Reusable UI components
│       │   ├── pages/       # Page components
│       │   ├── hooks/       # Custom React hooks
│       │   ├── lib/         # API client & utilities
│       │   └── store/       # Zustand stores
│       └── package.json
├── packages/
│   ├── ui/                  # Shared UI components
│   ├── types/               # Shared TypeScript types
│   └── config/              # Shared configuration
├── docker-compose.yml       # Database setup
└── package.json            # Root package.json
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **pnpm** 8+
- **Docker** & **Docker Compose**

### 1. Clone and Install

```bash
git clone <repository-url>
cd modern-crm
pnpm install
```

### 2. Environment Setup

Copy the environment template and configure:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Shared
NODE_ENV=development

# Backend
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crm
JWT_ACCESS_SECRET=your-super-secret-access-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
CORS_ORIGIN=http://localhost:5173
GEMINI_API_KEY=your-gemini-api-key
N8N_WEBHOOK_SECRET=your-n8n-webhook-secret

# Socket.io
SOCKET_PATH=/socket.io
```

### 3. Start Database

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL** on port `5432`
- **pgAdmin** on port `5050` (admin@crm.com / admin123)

### 4. Setup Database

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Seed with sample data
pnpm db:seed
```

### 5. Start Development Servers

```bash
# Start both API and Web servers
pnpm dev
```

This starts:
- **API Server** on `http://localhost:4000`
- **Web App** on `http://localhost:5173`

## 🔑 Default Credentials

After seeding the database, you can login with:

- **Admin**: `admin@crm.com` / `admin123`
- **User**: `user@crm.com` / `user123`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile

### Customers
- `GET /api/customers` - List customers (with pagination & filters)
- `GET /api/customers/:id` - Get customer details
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
- `GET /api/customers/stats` - Get customer statistics

### Messages
- `GET /api/messages` - List messages (with pagination & filters)
- `GET /api/messages/:id` - Get message details
- `POST /api/messages` - Create message
- `PUT /api/messages/:id/analysis` - Update message analysis
- `DELETE /api/messages/:id` - Delete message
- `GET /api/messages/stats` - Get message statistics

### Leads
- `GET /api/leads` - List leads (with pagination & filters)
- `GET /api/leads/:id` - Get lead details
- `POST /api/leads` - Create lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead
- `GET /api/leads/stats` - Get lead statistics

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/charts/customers` - Get customer growth chart
- `GET /api/dashboard/charts/messages` - Get message activity chart
- `GET /api/dashboard/charts/leads/status` - Get lead status distribution
- `GET /api/dashboard/charts/customers/source` - Get customer source distribution

### Webhooks
- `POST /api/webhooks/n8n` - N8N webhook endpoint
- `POST /api/webhooks/n8n/test` - Test webhook endpoint

## 🔌 N8N Integration

### Webhook Configuration

Configure your N8N workflows to send data to:

```
POST http://localhost:4000/api/webhooks/n8n
```

**Headers:**
```
Content-Type: application/json
x-webhook-secret: your-n8n-webhook-secret
```

**Payload Format:**
```json
{
  "platform": "whatsapp", // or "instagram"
  "customer": {
    "id": "optional-customer-id",
    "name": "John Doe",
    "phone": "+1234567890",
    "email": "john@example.com"
  },
  "message": {
    "content": "Hello, I'm interested in your services!",
    "direction": "inbound", // or "outbound"
    "timestamp": "2024-01-01T12:00:00Z",
    "metadata": {
      "messageId": "msg_123",
      "from": "+1234567890"
    }
  }
}
```

### AI Analysis

The system automatically analyzes incoming messages using Gemini API:

- **Sentiment Analysis**: Positive, Neutral, or Negative
- **Lead Scoring**: 0-100 score based on intent and engagement
- **Intent Detection**: Identifies customer intent (pricing, demo, support, etc.)
- **Tagging**: Automatically tags messages with relevant keywords

## 🔄 Real-time Updates

The system uses Socket.io for real-time updates:

### Events
- `message:new` - New message received
- `message:updated` - Message analysis completed
- `customer:new` - New customer created
- `lead:new` - New lead created
- `lead:update` - Lead status updated
- `dashboard:stats` - Dashboard statistics updated

### Client Integration

```typescript
import { socketManager } from './lib/socket';

// Connect to socket
socketManager.connect();

// Listen for new messages
socketManager.onMessageNew((message) => {
  console.log('New message:', message);
});

// Join customer room for specific updates
socketManager.joinCustomerRoom('customer-id');
```

## 🧪 Testing

### Test Webhook

```bash
curl -X POST http://localhost:4000/api/webhooks/n8n/test \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: your-n8n-webhook-secret"
```

### Database Management

```bash
# Open Prisma Studio
pnpm db:studio

# Reset database
pnpm db:push --force-reset

# View database in pgAdmin
# http://localhost:5050 (admin@crm.com / admin123)
```

## 🚀 Production Deployment

### Environment Variables

Ensure all production environment variables are set:

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/crm
JWT_ACCESS_SECRET=super-secure-secret
JWT_REFRESH_SECRET=super-secure-refresh-secret
GEMINI_API_KEY=your-production-gemini-key
N8N_WEBHOOK_SECRET=super-secure-webhook-secret
CORS_ORIGIN=https://your-domain.com
```

### Build Commands

```bash
# Build all packages
pnpm build

# Start production server
cd apps/api && pnpm start
```

### Docker Production

```bash
# Build production images
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 Database Schema

### Core Tables

- **users** - System users (admin/user roles)
- **customers** - Customer information and metadata
- **messages** - Customer messages with AI analysis
- **leads** - Sales leads with scoring and status tracking

### Key Relationships

- Customers have many Messages and Leads
- Messages belong to one Customer
- Leads belong to one Customer
- Users can manage all entities

## 🔧 Development

### Available Scripts

```bash
# Development
pnpm dev              # Start all services
pnpm build            # Build all packages
pnpm lint             # Lint all packages
pnpm type-check       # Type check all packages

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to database
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed database
pnpm db:studio        # Open Prisma Studio

# Individual services
cd apps/api && pnpm dev     # API only
cd apps/web && pnpm dev     # Web only
```

### Code Structure

- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic and data processing
- **Middleware**: Authentication, validation, and error handling
- **Routes**: API endpoint definitions
- **Types**: Shared TypeScript interfaces
- **Components**: Reusable React components

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

1. Check the documentation
2. Review the API endpoints
3. Test with the provided sample data
4. Check the browser console for errors
5. Verify environment variables are set correctly

## 🎯 Roadmap

- [ ] Advanced analytics and reporting
- [ ] Email integration
- [ ] Mobile app
- [ ] Advanced AI features
- [ ] Multi-tenant support
- [ ] API rate limiting
- [ ] Advanced search and filtering
- [ ] Export/import functionality

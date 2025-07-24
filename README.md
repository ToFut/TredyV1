# 🚀 FlowChat - Next-Generation Threaded Conversations

A revolutionary chat application that enables intelligent, threaded conversations with AI assistance. Built with React, Node.js, PostgreSQL, and Redis.

## 🎯 Features

- **🧠 AI-Powered Conversations** - Multiple AI models (GPT-4, Claude, etc.)
- **🌳 Intelligent Threading** - Create focused discussions from any part of a conversation
- **👥 Real-time Collaboration** - Work together with others in real-time
- **🔍 Smart Search** - Full-text search across all conversations
- **📊 Analytics** - Track usage, costs, and conversation insights
- **⚡ Scalable Architecture** - Built for 10K+ users

## 🏗️ Architecture

```
ChatMe/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API services
│   │   ├── hooks/          # Custom React hooks
│   │   ├── context/        # React context
│   │   └── styles/         # CSS styles
│   └── package.json
├── backend/                  # Node.js backend
│   ├── src/
│   │   ├── controllers/     # HTTP request handlers
│   │   ├── services/        # Business logic
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   └── lib/            # Utilities
│   ├── migrations/         # Database migrations
│   └── package.json
├── docker-compose.yml       # Local development
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- OpenAI API Key

### 1. Clone and Setup

```bash
git clone <repository-url>
cd ChatMe
```

### 2. Environment Configuration

Create environment files:

**Backend (.env):**
```bash
cp backend/env.example backend/.env
# Edit backend/.env with your OpenAI API key
```

**Frontend (.env):**
```bash
# Create frontend/.env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

### 3. Start with Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Manual Setup (Alternative)

**Backend:**
```bash
cd backend
npm install
npm run migrate
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

## 📊 Database Setup

The application uses PostgreSQL with the following key features:

- **LTREE** for efficient thread hierarchy queries
- **Full-text search** with PostgreSQL's built-in search
- **JSONB** for flexible metadata storage
- **Connection pooling** for performance

### Database Schema

```sql
-- Core tables
users              # User accounts
conversations      # Main conversations
threads           # Threaded discussions (with LTREE)
messages          # All messages with full-text search
thread_collaborators # Collaboration permissions
```

## 🔧 Development

### Backend Development

```bash
cd backend

# Install dependencies
npm install

# Run migrations
npm run migrate

# Start development server
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
npm run test:watch
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📈 Production Deployment

### Environment Variables

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `OPENAI_API_KEY` - OpenAI API key
- `JWT_SECRET` - JWT signing secret

**Optional:**
- `NODE_ENV` - Environment (production/development)
- `PORT` - Server port (default: 5000)
- `FRONTEND_URL` - Frontend URL for CORS

### Docker Production

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Production

1. **Database Setup:**
   ```bash
   # Run migrations
   npm run migrate
   ```

2. **Backend:**
   ```bash
   cd backend
   npm ci --only=production
   npm start
   ```

3. **Frontend:**
   ```bash
   cd frontend
   npm ci --only=production
   npm run build
   # Serve build folder with nginx/apache
   ```

## 🔍 API Documentation

### Chat Endpoints

- `POST /api/chat/send` - Send message and get AI response
- `GET /api/chat/conversation/:id` - Get conversation messages
- `GET /api/chat/thread/:id` - Get thread messages
- `GET /api/chat/search/:id` - Search messages

### Thread Endpoints

- `POST /api/threads` - Create new thread
- `GET /api/threads/hierarchy/:id` - Get thread hierarchy
- `PUT /api/threads/:id` - Update thread
- `DELETE /api/threads/:id` - Delete thread

### Health Endpoints

- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system health
- `GET /health/database` - Database health

## 🛠️ Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check if PostgreSQL is running
   docker-compose ps postgres
   
   # Check logs
   docker-compose logs postgres
   ```

2. **Redis Connection Failed**
   ```bash
   # Check if Redis is running
   docker-compose ps redis
   
   # Check logs
   docker-compose logs redis
   ```

3. **OpenAI API Errors**
   - Verify your API key is correct
   - Check your OpenAI account has credits
   - Ensure the API key has proper permissions

4. **Frontend Can't Connect to Backend**
   - Verify backend is running on port 5000
   - Check CORS configuration
   - Ensure environment variables are set correctly

### Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 📊 Monitoring

### Health Checks

- Backend: `http://localhost:5000/health`
- Frontend: `http://localhost:3000`

### Metrics

- Database performance: Check PostgreSQL logs
- API performance: Check backend logs
- Frontend performance: Browser dev tools

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- Create an issue for bugs
- Check the troubleshooting section
- Review the API documentation

---

**Built with ❤️ for intelligent conversations** 
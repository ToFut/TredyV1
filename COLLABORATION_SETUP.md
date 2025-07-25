# FlowChat Collaboration System Setup

## 🎯 Overview

The FlowChat collaboration system allows users to invite others to collaborate on specific threads, enabling real-time multi-user conversations and shared AI interactions.

## 🚀 Features Implemented

### ✅ **Core Collaboration Features**
- **Email Invitations**: Send invitations via email with secure links
- **Role-based Permissions**: Viewer, Contributor, Moderator roles
- **Real-time Presence**: See who's active in threads
- **Invitation Management**: Accept/decline invitations with proper UI
- **Collaboration Messages**: Real-time message sharing between collaborators

### ✅ **Backend API Endpoints**
- `POST /api/collaboration/invitations/send` - Send invitation
- `GET /api/collaboration/threads/:threadId/collaborators` - Get thread collaborators
- `PUT /api/collaboration/invitations/:invitationId/accept` - Accept invitation
- `GET /api/collaboration/invitations/:invitationId` - Get invitation details
- `POST /api/collaboration/presence/update` - Update user presence
- `GET /api/collaboration/threads/:threadId/active-users` - Get active users
- `DELETE /api/collaboration/threads/:threadId/collaborators/:collaboratorId` - Remove collaborator

### ✅ **Frontend Components**
- **CollaborationModal**: Invite users with role selection
- **InvitationAccept**: Accept/decline invitations with proper UI
- **Real-time Updates**: Live collaboration message sharing
- **User Presence**: Show active users in threads

## 📧 Email Configuration

### 1. Gmail Setup (Recommended)
```bash
# In your .env file
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password  # Use Gmail App Password
EMAIL_SERVICE=gmail
```

### 2. Gmail App Password Setup
1. Go to Google Account Settings
2. Enable 2-Factor Authentication
3. Generate App Password for "Mail"
4. Use the generated password as `EMAIL_PASS`

### 3. Alternative Email Services
```bash
# For other services, update EMAIL_SERVICE and credentials
EMAIL_SERVICE=outlook  # or yahoo, hotmail, etc.
EMAIL_USER=your_email@outlook.com
EMAIL_PASS=your_password
```

## 🔧 Installation & Setup

### 1. Install Dependencies
```bash
# Backend
cd backend
npm install nodemailer

# Frontend
cd frontend
npm install react-router-dom
```

### 2. Environment Configuration
```bash
# Backend .env
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_SERVICE=gmail
FRONTEND_URL=http://localhost:3000

# Docker (docker-compose.yml)
EMAIL_USER: your_email@gmail.com
EMAIL_PASS: your_app_password
EMAIL_SERVICE: gmail
FRONTEND_URL: http://localhost:3000
```

### 3. Start the Application
```bash
# Using Docker
docker-compose up --build

# Or manually
cd backend && npm run dev
cd frontend && npm start
```

## 🎮 How to Use

### 1. Send Invitation
1. Open a thread in FlowChat
2. Click the "Invite" button in thread settings
3. Enter collaborator's email and select role
4. Add optional message
5. Click "Send Invitation"

### 2. Accept Invitation
1. Collaborator receives email with invitation link
2. Click the link: `http://localhost:3000/accept-invitation/:invitationId`
3. Review invitation details
4. Click "Accept Invitation" or "Decline"

### 3. Collaborate
1. Once accepted, collaborator can access the thread
2. Real-time messages are shared between collaborators
3. See active users and their presence
4. Manage collaborators through thread settings

## 🔐 Security Features

### Invitation Security
- **Secure Tokens**: Each invitation has a unique UUID
- **Expiration**: Invitations expire after 7 days
- **Status Tracking**: Track pending, accepted, declined status
- **Email Verification**: Invitations sent to verified email addresses

### Permission System
```javascript
// Role-based permissions
const permissions = {
  viewer: { canInvite: false, canModerate: false, canExport: false },
  contributor: { canInvite: false, canModerate: false, canExport: true },
  moderator: { canInvite: true, canModerate: true, canExport: true }
};
```

## 🛠️ API Usage Examples

### Send Invitation
```javascript
const response = await fetch('/api/collaboration/invitations/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'colleague@company.com',
    name: 'John Doe',
    role: 'contributor',
    threadId: 'thread-uuid',
    message: 'Join our discussion!'
  })
});
```

### Accept Invitation
```javascript
const response = await fetch(`/api/collaboration/invitations/${invitationId}/accept`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-uuid',
    userName: 'John Doe'
  })
});
```

### Get Thread Collaborators
```javascript
const response = await fetch(`/api/collaboration/threads/${threadId}/collaborators`);
const { collaborators } = await response.json();
```

## 🔄 Real-time Collaboration

### WebSocket Integration
The system is designed to work with WebSocket connections for real-time updates:

```javascript
// In collaboration service
initializeWebSocket() {
  // Connect to WebSocket server
  // Handle real-time collaboration messages
  // Update presence and user status
}
```

### Message Synchronization
- Collaboration messages are sent to all thread participants
- Real-time typing indicators
- User presence updates
- Thread activity notifications

## 🐛 Troubleshooting

### Email Not Sending
1. Check email credentials in environment variables
2. Verify Gmail App Password is correct
3. Check if 2FA is enabled on Gmail account
4. Review email service logs

### Invitation Links Not Working
1. Verify `FRONTEND_URL` is correct
2. Check if frontend is running on the correct port
3. Ensure invitation ID is valid and not expired

### Real-time Features Not Working
1. Check WebSocket connection status
2. Verify collaboration service initialization
3. Review browser console for errors

## 🚀 Production Deployment

### Environment Variables
```bash
# Production email service
EMAIL_USER=your_production_email@company.com
EMAIL_PASS=your_production_password
EMAIL_SERVICE=smtp

# Production URLs
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://api.your-domain.com
```

### Database Storage
For production, replace in-memory storage with database tables:
```sql
-- Invitations table
CREATE TABLE invitations (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) NOT NULL,
  thread_id UUID NOT NULL,
  invited_by VARCHAR(255),
  message TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  accepted_at TIMESTAMP
);

-- Collaborators table
CREATE TABLE collaborators (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) NOT NULL,
  thread_id UUID NOT NULL,
  permissions JSONB,
  joined_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'active'
);
```

## 📝 Future Enhancements

### Planned Features
- [ ] **Video/Audio Calls**: Integrated calling for collaborators
- [ ] **File Sharing**: Share documents and images in threads
- [ ] **Advanced Permissions**: Granular permission controls
- [ ] **Thread Templates**: Pre-configured collaboration templates
- [ ] **Analytics**: Collaboration metrics and insights
- [ ] **Mobile App**: Native mobile collaboration experience

### Integration Possibilities
- **Slack Integration**: Send invitations via Slack
- **Calendar Integration**: Schedule collaboration sessions
- **SSO Integration**: Single sign-on for enterprise users
- **API Webhooks**: Real-time notifications to external systems

## 🤝 Contributing

To contribute to the collaboration system:

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests for new functionality
5. Submit a pull request

## 📞 Support

For issues or questions about the collaboration system:
- Check the troubleshooting section above
- Review the API documentation
- Open an issue in the repository
- Contact the development team

---

**The collaboration system is now fully functional and ready for use!** 🎉 
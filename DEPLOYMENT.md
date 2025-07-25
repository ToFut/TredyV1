# ChatMe Deployment Guide

## Deploying to Vercel

### Prerequisites
1. Install Vercel CLI: `npm i -g vercel`
2. Have a GitHub account
3. Have your code pushed to a GitHub repository

### Step 1: Prepare Your Repository

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

### Step 2: Deploy to Vercel

1. **Login to Vercel:**
   ```bash
   vercel login
   ```

2. **Deploy from your project directory:**
   ```bash
   vercel
   ```

3. **Follow the prompts:**
   - Link to existing project or create new
   - Set project name (e.g., "chatme")
   - Confirm deployment settings

### Step 3: Configure Environment Variables

1. **Go to your Vercel dashboard**
2. **Navigate to your project settings**
3. **Add these environment variables:**

   ```
   OPENAI_API_KEY=your_openai_api_key_here
   NODE_ENV=production
   ```

### Step 4: Update API Configuration

After deployment, update the API URL in `frontend/src/config/api.js`:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://your-actual-vercel-url.vercel.app/api' 
    : 'http://localhost:5001/api');
```

Replace `your-actual-vercel-url.vercel.app` with your actual Vercel domain.

### Step 5: Redeploy

After updating the configuration:

```bash
vercel --prod
```

## Alternative: Deploy via GitHub Integration

1. **Connect your GitHub repository to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables
   - Deploy

## Troubleshooting

### Common Issues:

1. **Build fails:**
   - Check that all dependencies are in package.json
   - Ensure Node.js version is compatible (>=16)

2. **API calls fail:**
   - Verify environment variables are set
   - Check API URL configuration
   - Ensure backend routes are working

3. **Frontend not loading:**
   - Check build output
   - Verify static file serving
   - Check console for errors

### Environment Variables Required:

```
OPENAI_API_KEY=sk-your-openai-key-here
NODE_ENV=production
```

### File Structure for Vercel:

```
/
├── server.js              # Main server file
├── vercel.json           # Vercel configuration
├── package.json          # Root package.json
├── frontend/             # React app
│   ├── package.json
│   ├── src/
│   └── public/
└── backend/              # Backend API
    ├── package.json
    └── src/
```

## Post-Deployment

1. **Test your application:**
   - Send a message in the chat
   - Test thread creation
   - Verify streaming responses

2. **Monitor logs:**
   - Check Vercel function logs
   - Monitor API responses
   - Watch for errors

3. **Set up custom domain (optional):**
   - Go to Vercel project settings
   - Add custom domain
   - Configure DNS

## Local Development vs Production

- **Local:** Uses localhost:5001 for API
- **Production:** Uses Vercel serverless functions
- **Environment:** Set NODE_ENV=production
- **API Keys:** Use environment variables

## Security Notes

- Never commit API keys to Git
- Use environment variables for secrets
- Enable CORS properly for production
- Set up proper authentication if needed 
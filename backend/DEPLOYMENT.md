# Deployment Guide

## Backend Deployment (Render/Firebase)

### Option 1: Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `cd backend && npm install`
4. Set start command: `cd backend && npm start`
5. Add environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `JWT_EXPIRE`
   - `GOOGLE_MAPS_API_KEY`
   - `FRONTEND_URL`
   - `NODE_ENV=production`

### Option 2: Firebase Functions

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Initialize Firebase: `firebase init functions`
3. Deploy: `firebase deploy --only functions`

## Frontend Deployment (Vercel)

1. Install Vercel CLI: `npm install -g vercel`
2. Navigate to frontend directory: `cd frontend`
3. Deploy: `vercel`
4. Add environment variables in Vercel dashboard:
   - `REACT_APP_API_URL`
   - `REACT_APP_GOOGLE_MAPS_API_KEY`
   - `REACT_APP_SOCKET_URL`

## Database Setup (MongoDB Atlas)

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get connection string
4. Add connection string to backend environment variables
5. Whitelist IP addresses (0.0.0.0/0 for all or specific IPs)

## Environment Variables Checklist

### Backend (.env)
- `PORT=5000`
- `MONGODB_URI=mongodb+srv://...`
- `JWT_SECRET=your_secret_key`
- `JWT_EXPIRE=7d`
- `GOOGLE_MAPS_API_KEY=your_key`
- `FRONTEND_URL=https://your-frontend.vercel.app`
- `NODE_ENV=production`

### Frontend (.env)
- `REACT_APP_API_URL=https://your-backend.onrender.com/api`
- `REACT_APP_GOOGLE_MAPS_API_KEY=your_key`
- `REACT_APP_SOCKET_URL=https://your-backend.onrender.com`

## Post-Deployment Checklist

- [ ] Test authentication (register/login)
- [ ] Test donation creation
- [ ] Test donation acceptance
- [ ] Test volunteer assignment
- [ ] Test notifications
- [ ] Verify Google Maps integration
- [ ] Test admin dashboard
- [ ] Verify CORS settings
- [ ] Test WebSocket connections
- [ ] Verify file uploads (if implemented)


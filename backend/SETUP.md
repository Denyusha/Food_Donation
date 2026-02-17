# Setup Instructions

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- Google Maps API Key

## Installation Steps

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Backend Setup

1. Navigate to `backend` directory
2. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```
3. Update `.env` with your configuration:
   - Set `MONGODB_URI` (use MongoDB Atlas connection string or local MongoDB)
   - Set `JWT_SECRET` to a secure random string
   - Set `GOOGLE_MAPS_API_KEY` (get from Google Cloud Console)
   - Set `FRONTEND_URL` (default: http://localhost:3000)

### 3. Frontend Setup

1. Navigate to `frontend` directory
2. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```
3. Update `.env`:
   - Set `REACT_APP_API_URL` (default: http://localhost:5000/api)
   - Set `REACT_APP_GOOGLE_MAPS_API_KEY`
   - Set `REACT_APP_SOCKET_URL` (default: http://localhost:5000)

### 4. Start Development Servers

#### Option 1: Run Both Servers Together
From root directory:
```bash
npm run dev
```

#### Option 2: Run Separately

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm start
```

### 5. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/api/health

## Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Maps JavaScript API"
4. Create credentials (API Key)
5. Restrict API key to your domain (for production)
6. Add the API key to both backend and frontend `.env` files

## MongoDB Setup

### Option 1: MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create database user
4. Whitelist IP (0.0.0.0/0 for development)
5. Get connection string
6. Add to backend `.env` as `MONGODB_URI`

### Option 2: Local MongoDB

1. Install MongoDB locally
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/food_donation`

## Roles & Access

- **Admin**: Single login only (cannot register). Can monitor all operations, edit donations, and restrict user access (Deactivate/Activate). Create admin by updating a user's role in MongoDB (see below).
- **NGO / Receiver**: Can accept donations and give donations. Register with role "NGO / Receiver".
- **Donor**: Can only give donations. Register with role "Donor".
- **Volunteer**: Can be assigned to pick up donations.

## Creating First Admin User

Admin cannot register through the app. Create an admin by:

1. Register a regular user through the app (e.g. as Donor).
2. Manually update the user in MongoDB:
   ```javascript
   db.users.updateOne(
     { email: "your-email@example.com" },
     { $set: { role: "admin" } }
   )
   ```

Or use MongoDB Compass/CLI to update the role field. Then use the same login page with that email/password to access the Admin Dashboard.

## Testing

1. Register as different user types (donor, receiver, volunteer)
2. Create a donation as a donor
3. Accept donation as a receiver
4. Assign volunteer to pickup
5. Complete donation and provide feedback
6. Check admin dashboard for analytics

## Troubleshooting

### Backend won't start
- Check MongoDB connection
- Verify all environment variables are set
- Check if port 5000 is available

### Frontend won't start
- Check if port 3000 is available
- Verify environment variables
- Clear node_modules and reinstall

### Google Maps not loading
- Verify API key is correct
- Check if Maps JavaScript API is enabled
- Verify API key restrictions (if any)

### WebSocket connection failed
- Check backend is running
- Verify SOCKET_URL in frontend .env
- Check CORS settings in backend

## Production Deployment

See `backend/DEPLOYMENT.md` for detailed deployment instructions.


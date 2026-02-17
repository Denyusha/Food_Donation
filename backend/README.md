# Food Donation Web Application

A full-stack web application that connects food donors (restaurants, individuals, event organizers) with receivers (NGOs, shelters, or individuals) to reduce food waste and feed those in need.

## 🚀 Features

- **User Authentication**: JWT-based authentication with role management (Donor, Receiver, Admin, Volunteer)
- **Donor Features**: Create and manage food donations with location tracking
- **Receiver Features**: Browse and accept nearby donations
- **Volunteer System**: Location-based volunteer assignment for pickup
- **Admin Dashboard**: User management, analytics, and reports
- **Smart Matching**: AI-based recommendation system
- **Real-time Notifications**: WebSocket-based notifications
- **Gamification**: Points, badges, and leaderboard system
- **Impact Visualization**: Analytics dashboard with charts
- **Google Maps Integration**: Location services and route optimization
- **PWA Support**: Offline functionality
- **Multilingual Support**: English + additional languages

## 🛠️ Tech Stack

- **Frontend**: React, Tailwind CSS, Google Maps API
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **Real-time**: WebSockets (Socket.io)

## 📦 Installation

1. Install dependencies:
```bash
npm run install-all
```

2. Set up environment variables:
- Backend: Create `backend/.env` (see `backend/.env.example`)
- Frontend: Create `frontend/.env` (see `frontend/.env.example`)

3. Start development servers:
```bash
npm run dev
```

## 🌐 Deployment

- **Frontend**: Deploy to Vercel
- **Backend**: Deploy to Render or Firebase
- **Database**: MongoDB Atlas

## 📚 API Documentation

API documentation is available at `/api-docs` when the backend is running, or see `backend/API_DOCUMENTATION.md`

## 📝 License

MIT


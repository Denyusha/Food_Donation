import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import DonorDashboard from './pages/dashboards/DonorDashboard';
import ReceiverDashboard from './pages/dashboards/ReceiverDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import VolunteerDashboard from './pages/dashboards/VolunteerDashboard';
import DonationsList from './pages/DonationsList';
import DonationDetail from './pages/DonationDetail';
import DeliveryTracking from './pages/DeliveryTracking';
import CreateDonation from './pages/CreateDonation';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import Impact from './pages/Impact';

// Components
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

// Theme Toggle Component
const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
};

function AppRoutes() {
  const { user, loading } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
          <Route path="/donations" element={<DonationsList />} />
          <Route path="/donations/:id" element={<DonationDetail />} />
          <Route path="/donations/:id/track" element={<ProtectedRoute><DeliveryTracking /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/impact" element={<Impact />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                {user?.role === 'donor' && <DonorDashboard />}
                {user?.role === 'receiver' && <ReceiverDashboard />}
                {user?.role === 'admin' && <AdminDashboard />}
                {user?.role === 'volunteer' && <VolunteerDashboard />}
                {!['donor', 'receiver', 'admin', 'volunteer'].includes(user?.role) && <Navigate to="/" />}
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/create-donation"
            element={
              <ProtectedRoute allowedRoles={['donor', 'receiver', 'admin']}>
                <CreateDonation />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <AppRoutes />
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;


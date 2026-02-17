import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [analyticsRes, usersRes, donationsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/analytics`),
        axios.get(`${API_URL}/admin/users?limit=20`),
        axios.get(`${API_URL}/admin/donations?limit=20`)
      ]);
      setAnalytics(analyticsRes.data.analytics);
      setUsers(usersRes.data.users);
      setDonations(donationsRes.data.donations || []);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyUser = async (userId) => {
    try {
      await axios.put(`${API_URL}/admin/users/${userId}/verify`);
      toast.success('User verified');
      fetchData();
    } catch (error) {
      toast.error('Failed to verify user');
    }
  };

  const handleToggleStatus = async (userId, isActive) => {
    try {
      await axios.put(`${API_URL}/admin/users/${userId}/status`, {
        isActive: !isActive
      });
      toast.success('User status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const userRoleData = analytics?.users ? [
    { name: 'Donors', value: analytics.users.donors },
    { name: 'Receivers', value: analytics.users.receivers },
    { name: 'Volunteers', value: analytics.users.volunteers }
  ] : [];

  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b'];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <p className="text-gray-600 dark:text-gray-400">Total Users</p>
          <p className="text-3xl font-bold">{analytics?.users?.total || 0}</p>
        </div>
        <div className="card">
          <p className="text-gray-600 dark:text-gray-400">Total Donations</p>
          <p className="text-3xl font-bold">{analytics?.donations?.total || 0}</p>
        </div>
        <div className="card">
          <p className="text-gray-600 dark:text-gray-400">Total Meals</p>
          <p className="text-3xl font-bold">{analytics?.donations?.totalMeals || 0}</p>
        </div>
        <div className="card">
          <p className="text-gray-600 dark:text-gray-400">CO₂ Reduced (kg)</p>
          <p className="text-3xl font-bold">{analytics?.donations?.co2Reduction || 0}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">User Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={userRoleData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {userRoleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Monthly Donations</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics?.monthlyStats || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#22c55e" name="Donations" />
              <Line type="monotone" dataKey="meals" stroke="#3b82f6" name="Meals" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* All Donations - Monitor & Edit */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-4">All Donations (monitor & edit)</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left p-2">Food</th>
                <th className="text-left p-2">Donor</th>
                <th className="text-left p-2">Receiver</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d) => (
                <tr key={d._id} className="border-b dark:border-gray-700">
                  <td className="p-2">{d.foodName}</td>
                  <td className="p-2">{d.donorId?.name || '-'}</td>
                  <td className="p-2">{d.receiverId?.name || '-'}</td>
                  <td className="p-2">
                    <span className="px-2 py-1 rounded text-sm bg-gray-100 dark:bg-gray-700">{d.status}</span>
                  </td>
                  <td className="p-2">
                    <Link to={`/donations/${d._id}`} className="text-primary-600 hover:underline text-sm">
                      View / Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users Table - Restrict access */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Users (restrict access: Deactivate / Activate)</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Role</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b dark:border-gray-700">
                  <td className="p-2">{user.name}</td>
                  <td className="p-2">{user.email}</td>
                  <td className="p-2">
                    <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded text-sm">
                      {user.role}
                    </span>
                  </td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        user.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      {!user.isVerified?.email && (
                        <button
                          onClick={() => handleVerifyUser(user._id)}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Verify
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleStatus(user._id, user.isActive)}
                        className={`text-sm font-medium ${user.isActive ? 'text-red-600 hover:underline' : 'text-green-600 hover:underline'}`}
                        title={user.isActive ? 'Restrict access' : 'Restore access'}
                      >
                        {user.isActive ? 'Restrict (Deactivate)' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;


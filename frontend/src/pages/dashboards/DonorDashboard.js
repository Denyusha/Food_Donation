import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FiPlus, FiTrendingUp, FiPackage, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const DonorDashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/users/dashboard`);
      setDashboard(response.data.dashboard);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const chartData = dashboard?.stats ? [
    { name: 'Pending', value: dashboard.stats.pending },
    { name: 'Accepted', value: dashboard.stats.accepted },
    { name: 'Completed', value: dashboard.stats.completed },
    { name: 'Cancelled', value: dashboard.stats.cancelled }
  ] : [];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Donor Dashboard</h1>
        <Link to="/create-donation" className="btn-primary flex items-center gap-2">
          <FiPlus /> Create Donation
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Total Donations</p>
              <p className="text-3xl font-bold">{dashboard?.stats?.total || 0}</p>
            </div>
            <FiPackage className="text-4xl text-primary-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Meals Provided</p>
              <p className="text-3xl font-bold">{dashboard?.totalMeals || 0}</p>
            </div>
            <FiTrendingUp className="text-4xl text-green-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Points</p>
              <p className="text-3xl font-bold">{dashboard?.points || 0}</p>
            </div>
            <FiCheckCircle className="text-4xl text-yellow-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Badges</p>
              <p className="text-3xl font-bold">{dashboard?.badges?.length || 0}</p>
            </div>
            <FiCheckCircle className="text-4xl text-purple-600" />
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-4">Donation Status</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Donations */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Recent Donations</h2>
        {dashboard?.donations?.length > 0 ? (
          <div className="space-y-4">
            {dashboard.donations.map((donation) => (
              <div
                key={donation._id}
                className="border-b dark:border-gray-700 pb-4 last:border-0"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{donation.foodName}</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {donation.quantity} {donation.unit} • {donation.foodType}
                    </p>
                    {donation.receiverId && (
                      <p className="text-sm text-gray-500">
                        Accepted by: {donation.receiverId.name || donation.receiverId.organizationName}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      donation.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : donation.status === 'accepted'
                        ? 'bg-blue-100 text-blue-800'
                        : donation.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {donation.status}
                  </span>
                </div>
                <Link
                  to={`/donations/${donation._id}`}
                  className="text-primary-600 hover:underline text-sm mt-2 inline-block"
                >
                  View Details →
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">No donations yet. Create your first donation!</p>
        )}
      </div>
    </div>
  );
};

export default DonorDashboard;


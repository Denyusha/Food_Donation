import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FiMapPin, FiPackage, FiCheckCircle, FiPlus } from 'react-icons/fi';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const ReceiverDashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/users/dashboard`);
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

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">NGO / Receiver Dashboard</h1>
        <div className="flex gap-3">
          <Link to="/donations" className="btn-secondary">
            Browse Donations
          </Link>
          <Link to="/create-donation" className="btn-primary flex items-center gap-2">
            <FiPlus /> Give Donation
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Total Accepted</p>
              <p className="text-3xl font-bold">{dashboard?.stats?.total || 0}</p>
            </div>
            <FiPackage className="text-4xl text-primary-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Meals Received</p>
              <p className="text-3xl font-bold">{dashboard?.totalMeals || 0}</p>
            </div>
            <FiCheckCircle className="text-4xl text-green-600" />
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
              <p className="text-gray-600 dark:text-gray-400">Pending Pickup</p>
              <p className="text-3xl font-bold">{dashboard?.stats?.pending || 0}</p>
            </div>
            <FiMapPin className="text-4xl text-blue-600" />
          </div>
        </div>
      </div>

      {/* Accepted Donations */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">My Accepted Donations</h2>
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
                    <p className="text-sm text-gray-500">
                      From: {donation.donorId?.name || donation.donorId?.organizationName}
                    </p>
                    {donation.volunteerId && (
                      <p className="text-sm text-gray-500">
                        Volunteer: {donation.volunteerId.name}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      donation.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : donation.status === 'picked'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
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
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No accepted donations yet. Browse available donations or give a donation.
            </p>
            <div className="flex gap-3">
              <Link to="/donations" className="btn-primary">
                Browse Donations
              </Link>
              <Link to="/create-donation" className="btn-secondary">
                Give Donation
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Donations I created (NGO can give) */}
      {dashboard?.myDonations?.length > 0 && (
        <div className="card mt-8">
          <h2 className="text-xl font-semibold mb-4">Donations I Gave</h2>
          <div className="space-y-4">
            {dashboard.myDonations.map((donation) => (
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
                        : donation.status === 'accepted' || donation.status === 'picked'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
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
        </div>
      )}
    </div>
  );
};

export default ReceiverDashboard;


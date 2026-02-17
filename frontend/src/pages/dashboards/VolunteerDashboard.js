import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FiMapPin, FiPackage, FiCheckCircle } from 'react-icons/fi';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const VolunteerDashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [availableDonations, setAvailableDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    fetchDashboard();
    getLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchAvailableDonations();
    }
  }, [userLocation]);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Please enable location access to see nearby donations');
        }
      );
    }
  };

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

  const fetchAvailableDonations = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/volunteers/available?lat=${userLocation.lat}&lng=${userLocation.lng}&maxDistance=10`
      );
      setAvailableDonations(response.data.donations || []);
    } catch (error) {
      console.error('Error fetching available donations:', error);
    }
  };

  const handleAssign = async (donationId) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/volunteers/assign/${donationId}`);
      toast.success('Donation assigned successfully!');
      fetchDashboard();
      fetchAvailableDonations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign donation');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Volunteer Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Total Assignments</p>
              <p className="text-3xl font-bold">{dashboard?.stats?.total || 0}</p>
            </div>
            <FiPackage className="text-4xl text-primary-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-3xl font-bold">{dashboard?.stats?.completed || 0}</p>
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
      </div>

      {/* Available Donations */}
      {availableDonations.length > 0 && (
        <div className="card mb-8">
          <h2 className="text-xl font-semibold mb-4">Available Donations Nearby</h2>
          <div className="space-y-4">
            {availableDonations.map((donation) => (
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
                      Distance: {donation.distance} km
                    </p>
                    <p className="text-sm text-gray-500">
                      From: {donation.donorId?.name || donation.donorId?.organizationName}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAssign(donation._id)}
                    className="btn-primary"
                  >
                    Accept delivery
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Assignments */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">My Assignments</h2>
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
                    <p className="text-sm text-gray-500">
                      To: {donation.receiverId?.name || donation.receiverId?.organizationName}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      donation.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {donation.status}
                  </span>
                </div>
                <div className="flex gap-2 mt-2">
                  <Link
                    to={`/donations/${donation._id}`}
                    className="text-primary-600 hover:underline text-sm"
                  >
                    View Details →
                  </Link>
                  {['accepted', 'picked', 'completed'].includes(donation.status) && (
                    <Link
                      to={`/donations/${donation._id}/track`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Track →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">No assignments yet.</p>
        )}
      </div>
    </div>
  );
};

export default VolunteerDashboard;


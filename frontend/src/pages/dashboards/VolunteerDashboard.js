import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FiMapPin, FiPackage, FiCheckCircle, FiTruck, FiClock } from 'react-icons/fi';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const VolunteerDashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [availableDonations, setAvailableDonations] = useState([]);
  const [pickupRequests, setPickupRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    fetchDashboard();
    // Start continuous location tracking
    startLocationTracking();
    // Fetch donations immediately (without location initially)
    fetchAvailableDonations(null);
    fetchPickupRequests(null);

    // Cleanup on unmount
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchAvailableDonations(userLocation);
      fetchPickupRequests(userLocation);
    }
  }, [userLocation]);

  const watchIdRef = useRef(null);

  const startLocationTracking = () => {
    if (navigator.geolocation) {
      // Get initial position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Initial location:', position.coords);
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting initial location:', error);
          toast.error('Please enable location access for better results');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      // Start watching position continuously
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          console.log('Location updated:', position.coords);
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Location tracking error:', error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
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

  const fetchAvailableDonations = async (location) => {
    try {
      let url = `${process.env.REACT_APP_API_URL}/volunteers/available`;
      if (location) {
        url += `?lat=${location.lat}&lng=${location.lng}&maxDistance=10`;
      }
      const response = await axios.get(url);
      setAvailableDonations(response.data.donations || []);
    } catch (error) {
      console.error('Error fetching available donations:', error);
    }
  };

  const fetchPickupRequests = async (location) => {
    try {
      let url = `${process.env.REACT_APP_API_URL}/volunteers/pickup-requests`;
      if (location) {
        url += `?lat=${location.lat}&lng=${location.lng}&maxDistance=15`;
      }
      const response = await axios.get(url);
      setPickupRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error fetching pickup requests:', error);
    }
  };

  const handleAssign = async (donationId) => {
    try {
      console.log('Assigning donation:', donationId);
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/volunteers/assign/${donationId}`);
      console.log('Assign response:', response.data);
      toast.success('Donation assigned successfully!');
      fetchDashboard();
      fetchAvailableDonations(userLocation);
      fetchPickupRequests(userLocation);
    } catch (error) {
      console.error('Assign error:', error);
      toast.error(error.response?.data?.message || 'Failed to assign donation');
    }
  };

  const handleRespondPickup = async (donationId, action) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/donations/${donationId}/respond-pickup`, { action });
      toast.success(action === 'accept' ? 'Pickup accepted!' : 'Pickup declined');
      fetchDashboard();
      fetchPickupRequests();
      fetchAvailableDonations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to respond to pickup request');
    }
  };

  const handleCompleteDelivery = async (donationId) => {
    try {
      console.log('Completing delivery:', donationId);
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/volunteers/complete/${donationId}`);
      console.log('Complete response:', response.data);
      toast.success('Delivery completed! All parties have been notified.');
      fetchDashboard();
    } catch (error) {
      console.error('Complete delivery error:', error);
      toast.error(error.response?.data?.message || 'Failed to mark delivery as complete');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Volunteer Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Total Assignments</p>
              <p className="text-2xl sm:text-3xl font-bold">{dashboard?.stats?.total || 0}</p>
            </div>
            <FiPackage className="text-3xl sm:text-4xl text-primary-600" />
          </div>
        </div>
        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Completed</p>
              <p className="text-2xl sm:text-3xl font-bold">{dashboard?.stats?.completed || 0}</p>
            </div>
            <FiCheckCircle className="text-3xl sm:text-4xl text-green-600" />
          </div>
        </div>
        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Points</p>
              <p className="text-2xl sm:text-3xl font-bold">{dashboard?.points || 0}</p>
            </div>
            <FiCheckCircle className="text-3xl sm:text-4xl text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Available Donations - Accepted by NGO, no volunteer yet */}
      <div className="card mb-6 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
          <span>📦</span> Available Donations ({availableDonations.length})
        </h2>
        {availableDonations.length > 0 ? (
          <div className="space-y-4">
            {availableDonations.map((donation) => (
              <div key={donation._id} className="border-b dark:border-gray-700 pb-4 last:border-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-base sm:text-lg">{donation.foodName}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                      {donation.quantity} {donation.unit} • {donation.foodType}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      From: {donation.donorId?.name || donation.donorId?.organizationName}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      To: {donation.receiverId?.name || donation.receiverId?.organizationName}
                    </p>
                    {donation.distance && (
                      <p className="text-xs sm:text-sm text-green-600">
                        Distance: {donation.distance} km
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleAssign(donation._id)}
                    className="btn-primary text-sm whitespace-nowrap w-full sm:w-auto"
                  >
                    Accept Delivery
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">No available donations nearby.</p>
        )}
      </div>

      {/* Pickup Requests */}
      {pickupRequests.length > 0 && (
        <div className="card mb-6 border-l-4 border-blue-500">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span>🚚</span> Pickup Requests ({pickupRequests.length})
          </h2>
          <div className="space-y-4">
            {pickupRequests.map((request) => (
              <div key={request._id} className="border-b dark:border-gray-700 pb-4 last:border-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{request.foodName}</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {request.quantity} {request.unit} • {request.foodType}
                    </p>
                    <p className="text-sm text-gray-500">
                      From: {request.donorId?.name || request.donorId?.organizationName}
                    </p>
                    <p className="text-sm text-gray-500">
                      To: {request.receiverId?.name || request.receiverId?.organizationName}
                    </p>
                    <p className="text-sm text-blue-600">
                      Requested for pickup
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRespondPickup(request._id, 'accept')}
                      className="btn-primary text-sm"
                    >
                      Accept Pickup
                    </button>
                    <button
                      onClick={() => handleRespondPickup(request._id, 'decline')}
                      className="btn-secondary text-sm"
                    >
                      Decline
                    </button>
                  </div>
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
                  {donation.status === 'picked' && (
                    <button
                      onClick={() => handleCompleteDelivery(donation._id)}
                      className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm ml-auto"
                    >
                      ✓ Mark as Delivered
                    </button>
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


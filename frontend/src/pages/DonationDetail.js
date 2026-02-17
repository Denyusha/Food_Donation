import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiMapPin, FiClock, FiPackage, FiUser } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const DonationDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminEditStatus, setAdminEditStatus] = useState('');
  const [feedback, setFeedback] = useState({
    rating: 5,
    freshnessScore: 10,
    quality: 'excellent',
    comments: '',
    wouldAcceptAgain: true
  });

  useEffect(() => {
    fetchDonation();
  }, [id]);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const fetchDonation = async () => {
    try {
      const response = await axios.get(`${API_URL}/donations/${id}`);
      setDonation(response.data.donation);
    } catch (error) {
      toast.error('Failed to load donation');
      navigate('/donations');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!user) {
      toast.error('Please login to accept donations');
      navigate('/login');
      return;
    }

    if (user.role !== 'receiver' && user.role !== 'admin') {
      toast.error('Only receivers can accept donations');
      return;
    }

    try {
      await axios.post(`${API_URL}/donations/${id}/accept`);
      toast.success('Donation accepted successfully!');
      fetchDonation();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept donation');
    }
  };

  const handleComplete = async () => {
    try {
      await axios.post(`${API_URL}/donations/${id}/complete`);
      toast.success('Donation marked as completed!');
      fetchDonation();
    } catch (error) {
      toast.error('Failed to complete donation');
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/donations/${id}/feedback`, feedback);
      toast.success('Feedback submitted successfully!');
      setFeedback({
        rating: 5,
        freshnessScore: 10,
        quality: 'excellent',
        comments: '',
        wouldAcceptAgain: true
      });
      fetchDonation();
    } catch (error) {
      toast.error('Failed to submit feedback');
    }
  };

  const handleAdminEdit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/admin/donations/${id}`, {
        status: adminEditStatus
      });
      toast.success('Donation updated');
      setDonation((prev) => (prev ? { ...prev, status: adminEditStatus } : null));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update donation');
    }
  };

  useEffect(() => {
    if (donation?.status) setAdminEditStatus(donation.status);
  }, [donation?.status]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!donation) {
    return <div>Donation not found</div>;
  }

  const canAccept = user && (user.role === 'receiver' || user.role === 'admin') && donation.status === 'pending';
  const canComplete = user && donation.status === 'picked' && (
    donation.receiverId?._id === user.id || donation.volunteerId?._id === user.id
  );
  const canGiveFeedback = user && donation.status === 'completed' && donation.receiverId?._id === user.id && !donation.feedback;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{donation.foodName}</h1>
            {donation.isEmergency && (
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                Emergency
              </span>
            )}
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm ${
              donation.status === 'completed'
                ? 'bg-green-100 text-green-800'
                : donation.status === 'accepted' || donation.status === 'picked'
                ? 'bg-blue-100 text-blue-800'
                : donation.status === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {donation.status}
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-1">
              <FiPackage className="inline mr-2" />
              Quantity: {donation.quantity} {donation.unit}
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-1">
              Type: {donation.foodType}
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-1">
              Freshness: {donation.freshness.replace(/-/g, ' ')}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Health Score: {donation.foodHealthScore}/10
            </p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-1">
              <FiClock className="inline mr-2" />
              Expires: {new Date(donation.expiryTime).toLocaleString()}
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-1">
              Available: {new Date(donation.availableTimeSlot.start).toLocaleString()} - {new Date(donation.availableTimeSlot.end).toLocaleString()}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <FiMapPin className="inline mr-2" />
              {donation.location.address}
            </p>
          </div>
        </div>

        {donation.description && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-600 dark:text-gray-400">{donation.description}</p>
          </div>
        )}

        {/* Donor Info */}
        {donation.donorId && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Donor</h3>
            <p className="text-gray-600 dark:text-gray-400">
              <FiUser className="inline mr-2" />
              {donation.donorId.name || donation.donorId.organizationName}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-4">
          {canAccept && (
            <button onClick={handleAccept} className="btn-primary">
              Accept Donation
            </button>
          )}
          {canComplete && (
            <button onClick={handleComplete} className="btn-primary">
              Mark as Completed
            </button>
          )}
          {['accepted', 'picked', 'completed'].includes(donation.status) && user && (
            <Link to={`/donations/${donation._id}/track`} className="btn-secondary flex items-center gap-2">
              <FiMapPin /> Track delivery
            </Link>
          )}
        </div>
      </div>

      {/* Admin: Edit donation */}
      {user?.role === 'admin' && (
        <div className="card mb-6 border-2 border-amber-200 dark:border-amber-800">
          <h2 className="text-xl font-semibold mb-4">Admin: Edit donation</h2>
          <form onSubmit={handleAdminEdit} className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={adminEditStatus}
                onChange={(e) => setAdminEditStatus(e.target.value)}
                className="input-field"
              >
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="picked">Picked</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <button type="submit" className="btn-primary">
              Save changes
            </button>
          </form>
        </div>
      )}

      {/* Map */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Location</h2>
        <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '400px' }}
            center={{
              lat: donation.location.coordinates.lat,
              lng: donation.location.coordinates.lng
            }}
            zoom={15}
          >
            <Marker
              position={{
                lat: donation.location.coordinates.lat,
                lng: donation.location.coordinates.lng
              }}
            />
          </GoogleMap>
        </LoadScript>
      </div>

      {/* Feedback Form */}
      {canGiveFeedback && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Provide Feedback</h2>
          <form onSubmit={handleSubmitFeedback} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rating (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                value={feedback.rating}
                onChange={(e) => setFeedback({ ...feedback, rating: parseInt(e.target.value) })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Freshness Score (0-10)</label>
              <input
                type="number"
                min="0"
                max="10"
                value={feedback.freshnessScore}
                onChange={(e) => setFeedback({ ...feedback, freshnessScore: parseInt(e.target.value) })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Quality</label>
              <select
                value={feedback.quality}
                onChange={(e) => setFeedback({ ...feedback, quality: e.target.value })}
                className="input-field"
                required
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="average">Average</option>
                <option value="poor">Poor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Comments</label>
              <textarea
                value={feedback.comments}
                onChange={(e) => setFeedback({ ...feedback, comments: e.target.value })}
                className="input-field"
                rows="4"
              />
            </div>
            <button type="submit" className="btn-primary">
              Submit Feedback
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default DonationDetail;


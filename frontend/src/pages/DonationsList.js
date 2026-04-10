import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiMapPin, FiClock, FiPackage } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import MapComponent from '../components/MapComponent';

const DonationsList = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'pending',
    foodType: '',
    minQuantity: '',
    maxDistance: '10'
  });
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    getLocation();
    fetchDonations();
  }, [filters]);

  const getLocation = () => {
    if (navigator.geolocation && user) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          console.log('Location access denied');
        }
      );
    }
  };

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: filters.status,
        ...(filters.foodType && { foodType: filters.foodType }),
        ...(filters.minQuantity && { minQuantity: filters.minQuantity }),
        ...(userLocation && filters.maxDistance && {
          lat: userLocation.lat,
          lng: userLocation.lng,
          maxDistance: filters.maxDistance
        })
      });

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/donations?${params}`
      );
      setDonations(response.data.donations || []);
    } catch (error) {
      console.error('Error fetching donations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Available Donations</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 rounded-lg ${viewMode === 'map' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
          >
            Map
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input-field"
            >
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Food Type</label>
            <select
              value={filters.foodType}
              onChange={(e) => setFilters({ ...filters, foodType: e.target.value })}
              className="input-field"
            >
              <option value="">All Types</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="non-vegetarian">Non-Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="dessert">Dessert</option>
              <option value="beverage">Beverage</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Min Quantity</label>
            <input
              type="number"
              value={filters.minQuantity}
              onChange={(e) => setFilters({ ...filters, minQuantity: e.target.value })}
              className="input-field"
              placeholder="Any"
            />
          </div>
          {userLocation && (
            <div>
              <label className="block text-sm font-medium mb-2">Max Distance (km)</label>
              <input
                type="number"
                value={filters.maxDistance}
                onChange={(e) => setFilters({ ...filters, maxDistance: e.target.value })}
                className="input-field"
              />
            </div>
          )}
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {donations.map((donation) => (
            <Link
              key={donation._id}
              to={`/donations/${donation._id}`}
              className="card hover:shadow-lg transition-shadow p-4 sm:p-6"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-base sm:text-lg">{donation.foodName}</h3>
                {donation.isEmergency && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                    Emergency
                  </span>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-2 text-sm sm:text-base">
                <FiPackage className="inline mr-1" />
                {donation.quantity} {donation.unit} • {donation.foodType}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mb-2">
                <FiMapPin className="inline mr-1" />
                {donation.location.address}
              </p>
              {donation.distance && (
                <p className="text-xs sm:text-sm text-primary-600 mb-2">
                  {donation.distance} km away
                </p>
              )}
              <p className="text-xs sm:text-sm text-gray-500">
                <FiClock className="inline mr-1" />
                Expires: {new Date(donation.expiryTime).toLocaleString()}
              </p>
              <div className="mt-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    donation.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {donation.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="card">
          <MapComponent
            height="500px"
            center={userLocation ? [userLocation.lat, userLocation.lng] : [20.5937, 78.9629]}
            zoom={userLocation ? 12 : 5}
            markers={donations
              .filter(d => d.location?.coordinates?.lat != null && d.location?.coordinates?.lng != null)
              .map(d => ({
                lat: d.location.coordinates.lat,
                lng: d.location.coordinates.lng,
                title: d.foodName,
                address: d.location.address,
                type: 'donor'
              }))}
          />
        </div>
      )}

      {donations.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">No donations found matching your filters.</p>
        </div>
      )}
    </div>
  );
};

export default DonationsList;


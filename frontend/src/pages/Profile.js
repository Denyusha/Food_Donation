import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiAward, FiStar } from 'react-icons/fi';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const Profile = () => {
  const { user, updateUser, fetchUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bio: '',
    organizationName: '',
    location: {
      address: '',
      coordinates: {
        lat: null,
        lng: null
      }
    }
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        bio: user.bio || '',
        organizationName: user.organizationName || '',
        location: {
          address: user.location?.address || '',
          coordinates: {
            lat: user.location?.coordinates?.lat || null,
            lng: user.location?.coordinates?.lng || null
          }
        }
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'location.address') {
      setFormData({
        ...formData,
        location: {
          ...formData.location,
          address: value
        }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleMapClick = (e) => {
    setFormData({
      ...formData,
      location: {
        ...formData.location,
        coordinates: {
          lat: e.latLng.lat(),
          lng: e.latLng.lng()
        }
      }
    });
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            location: {
              ...formData.location,
              coordinates: {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              }
            }
          });
          toast.success('Location updated!');
        },
        () => {
          toast.error('Failed to get location');
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/profile`, formData);
      if (response.data.success && response.data.user) {
        updateUser(response.data.user);
        await fetchUser(); // Refresh user data
        toast.success('Profile updated successfully!');
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
          <div className="space-y-2">
            <p><span className="font-medium">Name:</span> {user.name}</p>
            <p><span className="font-medium">Email:</span> {user.email}</p>
            <p><span className="font-medium">Role:</span> {user.role}</p>
            <p><span className="font-medium">Points:</span> {user.points || 0}</p>
          </div>

          {user.badges && user.badges.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Badges</h3>
              <div className="flex flex-wrap gap-2">
                {user.badges.map((badge, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm flex items-center gap-1"
                  >
                    <FiAward /> {badge.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Edit Form */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="card space-y-4">
            <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>
            
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>

            {user.role === 'receiver' && (
              <div>
                <label className="block text-sm font-medium mb-2">Organization Name</label>
                <input
                  type="text"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className="input-field"
                rows="4"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Address</label>
              <input
                type="text"
                name="location.address"
                value={formData.location.address}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter your address"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Location on Map</label>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="text-sm text-primary-600 hover:underline"
                >
                  Use Current Location
                </button>
              </div>
              <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '300px' }}
                  center={
                    formData.location.coordinates.lat
                      ? {
                          lat: formData.location.coordinates.lat,
                          lng: formData.location.coordinates.lng
                        }
                      : { lat: 0, lng: 0 }
                  }
                  zoom={formData.location.coordinates.lat ? 15 : 2}
                  onClick={handleMapClick}
                >
                  {formData.location.coordinates.lat && (
                    <Marker
                      position={{
                        lat: formData.location.coordinates.lat,
                        lng: formData.location.coordinates.lng
                      }}
                    />
                  )}
                </GoogleMap>
              </LoadScript>
              {formData.location.coordinates.lat && (
                <p className="text-sm text-gray-600 mt-2">
                  Selected: {formData.location.coordinates.lat.toFixed(6)}, {formData.location.coordinates.lng.toFixed(6)}
                </p>
              )}
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;


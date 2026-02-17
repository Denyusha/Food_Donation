import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const CreateDonation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    foodName: '',
    foodType: 'vegetarian',
    quantity: '',
    unit: 'servings',
    description: '',
    freshness: 'freshly-cooked',
    expiryTime: '',
    availableTimeSlot: {
      start: '',
      end: ''
    },
    location: {
      address: '',
      coordinates: {
        lat: null,
        lng: null
      }
    },
    isEmergency: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'availableTimeSlot') {
        setFormData({
          ...formData,
          availableTimeSlot: {
            ...formData.availableTimeSlot,
            [child]: value
          }
        });
      } else if (parent === 'location') {
        if (child === 'address') {
          setFormData({
            ...formData,
            location: {
              ...formData.location,
              address: value
            }
          });
        }
      }
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
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
        },
        () => {
          toast.error('Failed to get location');
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.location.coordinates.lat || !formData.location.coordinates.lng) {
      toast.error('Please select a location on the map');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/donations`, formData);
      toast.success('Donation created successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create donation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Create Donation</h1>
      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Food Name *</label>
          <input
            type="text"
            name="foodName"
            value={formData.foodName}
            onChange={handleChange}
            required
            className="input-field"
            placeholder="e.g., Pizza, Biryani, etc."
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Food Type *</label>
            <select
              name="foodType"
              value={formData.foodType}
              onChange={handleChange}
              required
              className="input-field"
            >
              <option value="vegetarian">Vegetarian</option>
              <option value="non-vegetarian">Non-Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="dessert">Dessert</option>
              <option value="beverage">Beverage</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Freshness *</label>
            <select
              name="freshness"
              value={formData.freshness}
              onChange={handleChange}
              required
              className="input-field"
            >
              <option value="freshly-cooked">Freshly Cooked</option>
              <option value="stored-4hrs">Stored &lt; 4 hrs</option>
              <option value="stored-8hrs">Stored &lt; 8 hrs</option>
              <option value="stored-12hrs">Stored &lt; 12 hrs</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Quantity *</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
              min="1"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Unit *</label>
            <select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              required
              className="input-field"
            >
              <option value="servings">Servings</option>
              <option value="plates">Plates</option>
              <option value="kg">Kilograms</option>
              <option value="pieces">Pieces</option>
              <option value="liters">Liters</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="input-field"
            rows="4"
            placeholder="Additional details about the food..."
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Expiry Time *</label>
            <input
              type="datetime-local"
              name="expiryTime"
              value={formData.expiryTime}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Available From *</label>
            <input
              type="datetime-local"
              name="availableTimeSlot.start"
              value={formData.availableTimeSlot.start}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Available Until *</label>
            <input
              type="datetime-local"
              name="availableTimeSlot.end"
              value={formData.availableTimeSlot.end}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Address *</label>
          <input
            type="text"
            name="location.address"
            value={formData.location.address}
            onChange={handleChange}
            required
            className="input-field"
            placeholder="Enter full address"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">Pick Location on Map *</label>
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
              mapContainerStyle={{ width: '100%', height: '400px' }}
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

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isEmergency"
              checked={formData.isEmergency}
              onChange={handleChange}
              className="mr-2"
            />
            <span>Mark as Emergency (for urgent situations)</span>
          </label>
        </div>

        <div className="flex gap-4">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Donation'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateDonation;


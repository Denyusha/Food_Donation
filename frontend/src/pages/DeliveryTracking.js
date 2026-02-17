import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { FiMapPin, FiPackage, FiCheckCircle, FiWifi, FiWifiOff } from 'react-icons/fi';
import { format } from 'date-fns';
import { GoogleMap, LoadScript, Marker, Polyline } from '@react-google-maps/api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const CACHE_KEY = (id) => `delivery_tracking_${id}`;

const mapContainerStyle = { width: '100%', height: '384px' };

export default function DeliveryTracking() {
  const { id } = useParams();
  const { user } = useAuth();
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [sharingLocation, setSharingLocation] = useState(false);
  const watchIdRef = useRef(null);

  const fetchTracking = async () => {
    try {
      const res = await axios.get(`${API_URL}/donations/${id}/tracking`);
      if (res.data.success && res.data.tracking) {
        setTracking(res.data.tracking);
        try {
          localStorage.setItem(CACHE_KEY(id), JSON.stringify({
            ...res.data.tracking,
            _cachedAt: new Date().toISOString(),
          }));
        } catch (e) {}
        setOffline(false);
      }
    } catch (err) {
      const cached = getCachedTracking();
      if (cached) {
        setTracking(cached);
        setOffline(true);
        toast('Showing cached data (offline)', { icon: '📴' });
      } else {
        toast.error(err.response?.data?.message || 'Failed to load tracking');
      }
    } finally {
      setLoading(false);
    }
  };

  const getCachedTracking = () => {
    try {
      const raw = localStorage.getItem(CACHE_KEY(id));
      if (!raw) return null;
      const data = JSON.parse(raw);
      delete data._cachedAt;
      return data;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    fetchTracking();
  }, [id]);

  const updateVolunteerLocation = (lat, lng) => {
    axios.post(`${API_URL}/donations/${id}/volunteer-location`, { lat, lng }).catch(() => {});
  };

  const startSharingLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    setSharingLocation(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        updateVolunteerLocation(lat, lng);
        setTracking((prev) => prev ? {
          ...prev,
          volunteerLocation: { ...prev.volunteerLocation, lat, lng, updatedAt: new Date() },
        } : null);
      },
      () => toast.error('Location access denied'),
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    toast.success('Sharing location with donor & NGO');
  };

  const stopSharingLocation = () => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSharingLocation(false);
  };

  useEffect(() => {
    return () => { stopSharingLocation(); };
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!tracking) {
    return (
      <div className="max-w-2xl mx-auto card">
        <p className="text-gray-600 dark:text-gray-400">Tracking not available. Open when online to load once.</p>
        <Link to={`/donations/${id}`} className="btn-primary mt-4 inline-block">Back to Donation</Link>
      </div>
    );
  }

  const { timeline, status, foodName, donorLocation, receiverLocation, volunteerLocation } = tracking;
  const points = [donorLocation, volunteerLocation, receiverLocation].filter(Boolean).map((p) => ({ lat: p.lat, lng: p.lng }));
  const center = points.length > 0 ? points[0] : { lat: 0, lng: 0 };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Delivery tracking</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{foodName} • Status: <span className="font-medium capitalize">{status}</span></p>
        </div>
        <div className="flex items-center gap-3">
          {offline ? (
            <span className="flex items-center gap-1 text-amber-600"><FiWifiOff /> Offline (cached)</span>
          ) : (
            <span className="flex items-center gap-1 text-green-600"><FiWifi /> Online</span>
          )}
          <button type="button" onClick={fetchTracking} className="btn-secondary text-sm" disabled={offline}>
            Refresh
          </button>
          <Link to={`/donations/${id}`} className="btn-secondary">Back to Donation</Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map - donor, NGO, volunteer with route */}
        <div className="lg:col-span-2 card overflow-hidden p-0">
          <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''}>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={points.length ? 12 : 2}
              options={{ mapTypeControl: true, streetViewControl: false }}
            >
              {donorLocation && (
                <Marker
                  position={{ lat: donorLocation.lat, lng: donorLocation.lng }}
                  title={`Donor: ${tracking.donorName || 'Donor'}`}
                  label={{ text: '🍽', fontSize: '18px' }}
                />
              )}
              {receiverLocation && (
                <Marker
                  position={{ lat: receiverLocation.lat, lng: receiverLocation.lng }}
                  title={`NGO: ${tracking.receiverName || 'Receiver'}`}
                  label={{ text: '🏠', fontSize: '18px' }}
                />
              )}
              {volunteerLocation && (
                <Marker
                  position={{ lat: volunteerLocation.lat, lng: volunteerLocation.lng }}
                  title={`Volunteer: ${tracking.volunteerName || 'En route'}`}
                  label={{ text: '🚚', fontSize: '18px' }}
                />
              )}
              {points.length >= 2 && (
                <Polyline
                  path={points}
                  options={{ strokeColor: '#3b82f6', strokeWeight: 4, strokeOpacity: 0.8 }}
                />
              )}
            </GoogleMap>
          </LoadScript>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 border-t flex flex-wrap gap-2">
            <span className="flex items-center gap-1 text-sm"><span className="w-3 h-3 rounded-full bg-orange-500" /> Donor (pickup)</span>
            <span className="flex items-center gap-1 text-sm"><span className="w-3 h-3 rounded-full bg-green-500" /> NGO</span>
            <span className="flex items-center gap-1 text-sm"><span className="w-3 h-3 rounded-full bg-blue-500" /> Volunteer</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FiPackage /> Delivery timeline
          </h2>
          <div className="border-l-2 border-gray-200 dark:border-gray-600 pl-6 space-y-0">
            {timeline && timeline.length > 0 ? (
              timeline.map((step, index) => (
                <div key={step.step} className="relative flex gap-3 pb-6 last:pb-0">
                  <div
                    className={`absolute -left-[29px] w-8 h-8 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 ${
                      step.done ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-500'
                    }`}
                  >
                    {step.done ? <FiCheckCircle className="w-4 h-4" /> : <span className="text-xs">{index + 1}</span>}
                  </div>
                  <div>
                    <p className={`font-medium ${step.done ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                      {step.label}
                    </p>
                    {step.at && (
                      <p className="text-sm text-gray-500">
                        {format(new Date(step.at), 'MMM d, HH:mm')}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No timeline data.</p>
            )}
          </div>
        </div>
      </div>

      {user && tracking?.volunteerId && String(user.id || user._id) === String(tracking.volunteerId) && (
        <div className="card mt-6 flex flex-wrap items-center gap-4">
          <span className="font-medium">You are the delivery volunteer.</span>
          {!sharingLocation ? (
            <button type="button" onClick={startSharingLocation} className="btn-primary flex items-center gap-2">
              <FiMapPin /> Share my location (live)
            </button>
          ) : (
            <button type="button" onClick={stopSharingLocation} className="btn-secondary">
              Stop sharing location
            </button>
          )}
        </div>
      )}

      <p className="text-sm text-gray-500 mt-4">
        Tracking data is cached so you can view status offline after loading once.
      </p>
    </div>
  );
}

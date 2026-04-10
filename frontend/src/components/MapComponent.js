import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issues in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom icons for different roles
const donorIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background-color: #f97316; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🍽</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const ngoIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background-color: #22c55e; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🏠</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const volunteerIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background-color: #3b82f6; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🚚</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

// Map bounds component
function MapBounds({ bounds }) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds && bounds.length > 0 && map) {
      try {
        // Validate all coordinates in bounds
        const validBounds = bounds.filter(b => 
          b && b.length >= 2 && 
          typeof b[0] === 'number' && !isNaN(b[0]) &&
          typeof b[1] === 'number' && !isNaN(b[1])
        );
        if (validBounds.length > 0) {
          map.fitBounds(validBounds, { padding: [50, 50] });
        }
      } catch (e) {
        console.error('Error fitting bounds:', e);
      }
    }
  }, [map, bounds]);
  
  return null;
}

// Click handler component
function MapClickHandler({ onClick }) {
  const map = useMap();
  
  useEffect(() => {
    if (onClick) {
      map.on('click', (e) => {
        onClick(e.latlng);
      });
    }
    return () => {
      map.off('click');
    };
  }, [map, onClick]);
  
  return null;
}

const MapComponent = ({
  center = [20.5937, 78.9629], // Default to India center
  zoom = 5,
  height = '400px',
  markers = [],
  path = [],
  showPath = false,
  onMapClick = null,
  selectedLocation = null,
  showCurrentLocation = false,
  bounds = null
}) => {
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    if (showCurrentLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          console.log('Location access denied');
        }
      );
    }
  }, [showCurrentLocation]);

  // Validate center coordinates - ensure they're valid numbers
  const getValidCenter = () => {
    if (selectedLocation && selectedLocation.lat != null && selectedLocation.lng != null) {
      return [selectedLocation.lat, selectedLocation.lng];
    }
    if (currentLocation && currentLocation.lat != null && currentLocation.lng != null) {
      return [currentLocation.lat, currentLocation.lng];
    }
    // Handle object-type center {lat, lng}
    if (center && typeof center === 'object' && !Array.isArray(center) && 
        center.lat != null && center.lng != null) {
      return [center.lat, center.lng];
    }
    // Ensure center is valid array
    if (Array.isArray(center) && center.length >= 2 && 
        typeof center[0] === 'number' && typeof center[1] === 'number' &&
        !isNaN(center[0]) && !isNaN(center[1])) {
      return center;
    }
    // Default to India center
    return [20.5937, 78.9629];
  };

  const defaultCenter = getValidCenter();
  const defaultZoom = (selectedLocation && selectedLocation.lat != null) || 
                      (currentLocation && currentLocation.lat != null) ? 15 : zoom;

  // Filter out markers with invalid coordinates
  const validMarkers = markers.filter(m => 
    m && typeof m.lat === 'number' && !isNaN(m.lat) && 
    typeof m.lng === 'number' && !isNaN(m.lng)
  );

  // Calculate bounds if not provided
  const mapBounds = bounds || (validMarkers.length > 0 
    ? validMarkers.map(m => [m.lat, m.lng])
    : null);

  // Prepare path positions
  const pathPositions = showPath && path.length > 0 
    ? path.map(p => [p.lat, p.lng])
    : [];

  // Ensure we have valid center coordinates
  if (!defaultCenter || !Array.isArray(defaultCenter) || defaultCenter.length < 2 ||
      typeof defaultCenter[0] !== 'number' || typeof defaultCenter[1] !== 'number' ||
      isNaN(defaultCenter[0]) || isNaN(defaultCenter[1])) {
    return (
      <div style={{ height, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', borderRadius: '8px' }}>
        <p>Loading map...</p>
      </div>
    );
  }

  return (
    <div style={{ height, width: '100%' }}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%', borderRadius: '8px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {onMapClick && <MapClickHandler onClick={onMapClick} />}
        {mapBounds && <MapBounds bounds={mapBounds} />}

        {/* Selected location marker */}
        {selectedLocation && (
          <Marker 
            position={[selectedLocation.lat, selectedLocation.lng]}
            icon={DefaultIcon}
          >
            <Popup>Selected Location</Popup>
          </Marker>
        )}

        {/* Current location marker */}
        {currentLocation && !selectedLocation && (
          <Marker 
            position={[currentLocation.lat, currentLocation.lng]}
            icon={DefaultIcon}
          >
            <Popup>Your Location</Popup>
          </Marker>
        )}

        {/* Role-based markers */}
        {validMarkers.map((marker, index) => {
          let icon = DefaultIcon;
          if (marker.type === 'donor') icon = donorIcon;
          else if (marker.type === 'ngo' || marker.type === 'receiver') icon = ngoIcon;
          else if (marker.type === 'volunteer') icon = volunteerIcon;

          return (
            <Marker 
              key={index}
              position={[marker.lat, marker.lng]}
              icon={icon}
            >
              <Popup>
                <div>
                  <strong>{marker.title || marker.label || 'Location'}</strong>
                  {marker.address && <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>{marker.address}</p>}
                  {marker.timestamp && (
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#666' }}>
                      {new Date(marker.timestamp).toLocaleString()}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Path polyline */}
        {showPath && pathPositions.length > 1 && (
          <Polyline 
            positions={pathPositions}
            color="#3b82f6"
            weight={4}
            opacity={0.8}
            dashArray={null}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MapComponent;

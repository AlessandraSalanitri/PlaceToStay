import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet CSS marker
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

L.Marker.prototype.options.icon = DefaultIcon;

const ChangeMapView = ({ coords }) => {
  const map = useMap();
  map.setView(coords, map.getZoom());
  return null;
};

const Map = ({ accommodations, onBook, fetchAllAccommodations }) => {
  const defaultCenter = [34.052235, -118.243683]; // Default to start with

  // center based on accommodations
  const mapCenter = accommodations.length > 0
    ? [accommodations[0].latitude, accommodations[0].longitude]
    : defaultCenter;

  return (
    <div style={{ position: 'relative' }}>
      <MapContainer center={mapCenter} zoom={13} style={{ height: '70vh', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <ChangeMapView coords={mapCenter} />
        {accommodations.map((acc) => (
          <Marker key={acc.id} position={[acc.latitude, acc.longitude]}>
            <Popup>
              <b>{acc.name}</b><br />{acc.description}<br />
              <button onClick={() => onBook(acc.id)}>Book</button>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <button
        onClick={fetchAllAccommodations}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 1000,
          padding: '10px 20px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        View All
      </button>
    </div>
  );
};

export default Map;

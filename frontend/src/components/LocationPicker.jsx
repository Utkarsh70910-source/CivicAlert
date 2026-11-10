import { useEffect, useRef, useState } from 'react';

/**
 * LocationPicker — Interactive Leaflet + OpenStreetMap map for the citizen report forms.
 *
 * Citizen clicks on the map to place a pin at their chosen location.
 * Coordinates (lat, lng) are reported back to the parent via onChange().
 *
 * Props:
 *   initialLat, initialLng  — optional starting position (defaults to Bangalore centre)
 *   onChange(lat, lng)       — called whenever the citizen moves the pin
 */
function LocationPicker({ initialLat, initialLng, onChange }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Default centre: Bangalore, Karnataka, India
  const DEFAULT_LAT = 12.9716;
  const DEFAULT_LNG = 77.5946;

  const startLat = initialLat != null ? Number(initialLat) : DEFAULT_LAT;
  const startLng = initialLng != null ? Number(initialLng) : DEFAULT_LNG;

  const [pinned, setPinned] = useState(!!(initialLat && initialLng));
  const [coords, setCoords] = useState(
    initialLat && initialLng ? { lat: startLat, lng: startLng } : null
  );

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    import('leaflet').then((L) => {
      // Fix default marker icon path broken by Vite/webpack bundling
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [startLat, startLng],
        zoom: 14,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // If initial coords provided, place a marker immediately
      if (initialLat && initialLng) {
        const m = L.marker([startLat, startLng], { draggable: true }).addTo(map);
        m.bindPopup('<strong>📍 Issue Location</strong><br>Drag to adjust').openPopup();
        m.on('dragend', (evt) => {
          const { lat, lng } = evt.target.getLatLng();
          setCoords({ lat, lng });
          setPinned(true);
          if (onChange) onChange(lat, lng);
        });
        markerRef.current = m;
      }

      // Click on map to drop / move pin
      map.on('click', (evt) => {
        const { lat, lng } = evt.latlng;

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          const m = L.marker([lat, lng], { draggable: true }).addTo(map);
          m.bindPopup('<strong>📍 Issue Location</strong><br>Drag to adjust').openPopup();
          m.on('dragend', (de) => {
            const pos = de.target.getLatLng();
            setCoords({ lat: pos.lat, lng: pos.lng });
            if (onChange) onChange(pos.lat, pos.lng);
          });
          markerRef.current = m;
        }

        setCoords({ lat, lng });
        setPinned(true);
        if (onChange) onChange(lat, lng);
      });

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClearPin = () => {
    if (markerRef.current && mapInstanceRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    setCoords(null);
    setPinned(false);
    if (onChange) onChange(null, null);
  };

  return (
    <div className="location-picker-wrapper">
      <div className="location-picker-hint">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>
          Click on the map to drop a pin at the exact complaint location. You can drag the pin to adjust.
        </span>
      </div>

      <div ref={mapContainerRef} className="location-picker-canvas" />

      {pinned && coords ? (
        <div className="location-picker-status pinned">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>
            Pin set at {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </span>
          <button type="button" className="location-clear-btn" onClick={handleClearPin}>
            Clear pin
          </button>
        </div>
      ) : (
        <div className="location-picker-status not-pinned">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>No pin placed yet — tap the map to mark the issue location</span>
        </div>
      )}
    </div>
  );
}

export default LocationPicker;


import { useEffect, useRef } from 'react';

/**
 * ComplaintMap — Read-only Leaflet + OpenStreetMap view for Worker/Admin complaint detail pages.
 *
 * Shows a marker at the stored (latitude, longitude) for the complaint.
 * Falls back gracefully when no coordinates are available.
 *
 * Uses Leaflet via the CDN-free npm package; no Google Maps API key required.
 */
function ComplaintMap({ latitude, longitude, locationText }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const hasCoords =
    latitude != null &&
    longitude != null &&
    !isNaN(Number(latitude)) &&
    !isNaN(Number(longitude));

  useEffect(() => {
    if (!hasCoords) return;
    if (!mapContainerRef.current) return;

    // Avoid double-init if the component re-renders
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Dynamically import leaflet so it only loads when this component mounts
    import('leaflet').then((L) => {
      // Fix default marker icon path broken by Vite/webpack bundling
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapContainerRef.current) return;

      const lat = Number(latitude);
      const lng = Number(longitude);

      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 16,
        scrollWheelZoom: false, // prevent accidental scroll-zooming in a detail page
        dragging: true,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const popupContent = locationText
        ? `<div style="font-size:13px;line-height:1.5;max-width:220px;">
            <strong>📍 Complaint Location</strong><br/>
            ${locationText}
            <br/><small style="color:#64748b">${lat.toFixed(5)}, ${lng.toFixed(5)}</small>
           </div>`
        : `<div style="font-size:13px;">
            <strong>📍 Complaint Location</strong><br/>
            <small style="color:#64748b">${lat.toFixed(5)}, ${lng.toFixed(5)}</small>
           </div>`;

      L.marker([lat, lng])
        .addTo(map)
        .bindPopup(popupContent)
        .openPopup();

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude]);

  if (!hasCoords) {
    return (
      <div className="complaint-map-no-coords">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span>No map coordinates recorded for this complaint.</span>
        {locationText && <p className="complaint-map-fallback-addr">{locationText}</p>}
      </div>
    );
  }

  return (
    <div className="complaint-map-wrapper">
      <div ref={mapContainerRef} className="complaint-map-canvas" />
      <div className="complaint-map-footer-bar">
        <span className="complaint-coords-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          Coordinates: {Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}
        </span>
        <a
          href={`https://www.google.com/maps?q=${Number(latitude)},${Number(longitude)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="complaint-map-ext-link"
          title="Open in Maps for driving directions"
        >
          Open in External Maps &rarr;
        </a>
      </div>
    </div>
  );
}

export default ComplaintMap;


import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useLoadScript, InfoWindow } from '@react-google-maps/api';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import axios from 'axios';
import socket from '../services/socket';

/**
 * LiveIncidentMap Component
 * 
 * Room-based event flow:
 * This map expects the backend to emit socket events for reports.
 * For example, if users join specific regional rooms (e.g., "region:chittagong")
 * or responder rooms (e.g., "responders"), they will receive real-time updates:
 * - "report:new" -> to add new incident markers on the map
 * - "report:update" -> to update details of an existing marker
 * - "report:escalated" -> to change the status/color of a marker
 * This keeps all teams in sync instantly without refreshing the page.
 */

const mapContainerStyle = {
  width: '100%',
  height: '100vh',
};

const center = {
  lat: 22.3569,
  lng: 91.7832, // Chattogram, Bangladesh
};

const options = {
  disableDefaultUI: true,
  zoomControl: true,
};

const getMarkerIcon = (status) => {
  let color = 'yellow'; // pending
  if (status === 'resolved') color = 'green';
  if (status === 'escalated') color = 'red';
  
  return `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`;
};

// Helper component to manage markers and clusterer
const Clusterer = ({ reports, map, onSelect }) => {
  useEffect(() => {
    if (!map || !window.google) return;
    
    const markers = reports.map((report) => {
      // GeoJSON: coordinates are [longitude, latitude]
      const lat = report.location?.coordinates[1] || center.lat;
      const lng = report.location?.coordinates[0] || center.lng;

      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        icon: getMarkerIcon(report.status),
      });

      marker.addListener("click", () => {
        onSelect(report);
      });

      return marker;
    });

    const clusterer = new MarkerClusterer({ map, markers });

    return () => {
      clusterer.clearMarkers();
    };
  }, [map, reports, onSelect]);

  return null;
};

const LiveIncidentMap = () => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [map, setMap] = useState(null);

  useEffect(() => {
    // Fetch initial reports
    const fetchReports = async () => {
      try {
        const response = await axios.get('/api/reports/nearby');
        if (response.data) {
          // Adjust according to the actual response structure (e.g. response.data.reports)
          const data = Array.isArray(response.data) ? response.data : (response.data.reports || []);
          setReports(data);
        }
      } catch (error) {
        console.error("Error fetching nearby reports:", error);
      }
    };
    
    fetchReports();
  }, []);

  useEffect(() => {
    const handleNewReport = (newReport) => {
      setReports((prev) => [...prev, newReport]);
    };

    const handleUpdateReport = (updatedReport) => {
      setReports((prev) => 
        prev.map(r => r._id === updatedReport._id ? updatedReport : r)
      );
    };

    const handleEscalatedReport = (escalatedReport) => {
      setReports((prev) => 
        prev.map(r => r._id === escalatedReport._id ? { ...r, status: escalatedReport.status } : r)
      );
    };

    socket.on("report:new", handleNewReport);
    socket.on("report:update", handleUpdateReport);
    socket.on("report:escalated", handleEscalatedReport);

    return () => {
      socket.off("report:new", handleNewReport);
      socket.off("report:update", handleUpdateReport);
      socket.off("report:escalated", handleEscalatedReport);
    };
  }, []);

  const onLoad = useCallback(function callback(mapInstance) {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  if (loadError) {
    return (
      <div className="flex justify-center items-center h-screen w-full bg-gray-50">
        <div className="p-4 bg-red-100 text-red-600 rounded shadow font-semibold">
          Error loading Google Maps. Please check your API key.
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-screen w-full bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative overflow-hidden">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={13}
        options={options}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        <Clusterer reports={reports} map={map} onSelect={setSelectedReport} />

        {selectedReport && selectedReport.location && (
          <InfoWindow
            position={{ 
              lat: selectedReport.location.coordinates[1], 
              lng: selectedReport.location.coordinates[0] 
            }}
            onCloseClick={() => setSelectedReport(null)}
          >
            <div className="p-3 max-w-xs bg-white text-gray-800 rounded">
              <h3 className="font-bold text-lg mb-1 border-b pb-1">{selectedReport.title}</h3>
              <p className="text-sm mt-2 flex items-center gap-2">
                <span className="font-medium text-gray-600">Status:</span> 
                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                  selectedReport.status === 'escalated' ? 'bg-red-100 text-red-700' : 
                  selectedReport.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {selectedReport.status}
                </span>
              </p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

export default LiveIncidentMap;

import { useEffect, useRef } from 'react';
import { useGoogleMap } from '@react-google-maps/api';
import { getDisasterConfig } from '../utils/disasterColors';

export const DisasterImpactCircle = ({ area, category }) => {
  const map = useGoogleMap();
  const circleRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    const coords = area?.coordinate?.coordinates;
    const radius = Number(area?.radius);

    if (!coords || coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1]) || isNaN(radius) || radius <= 0) {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
      return;
    }

    const lng = coords[0];
    const lat = coords[1];
    const config = getDisasterConfig(category);

    if (!circleRef.current) {
      circleRef.current = new window.google.maps.Circle({
        map,
        center: { lat, lng },
        radius: radius,
        fillColor: config.fillColor,
        fillOpacity: 0.22,
        strokeColor: config.strokeColor,
        strokeOpacity: 0.85,
        strokeWeight: 2,
      });
    } else {
      circleRef.current.setCenter({ lat, lng });
      circleRef.current.setRadius(radius);
      circleRef.current.setOptions({
        fillColor: config.fillColor,
        strokeColor: config.strokeColor,
      });
      circleRef.current.setMap(map);
    }

    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
    };
  }, [map, area, category]);

  return null;
};

export default DisasterImpactCircle;

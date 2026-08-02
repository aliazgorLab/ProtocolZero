/**
 * Shared Geo Helper
 * GeoJSON coordinates are ALWAYS ordered [longitude, latitude].
 */

/**
 * Convert standard (lat, lng) to GeoJSON Point [lng, lat]
 */
const toPoint = (lat, lng) => {
  return {
    type: "Point",
    coordinates: [parseFloat(lng), parseFloat(lat)],
  };
};

/**
 * Extract lat, lng from GeoJSON Point
 */
const fromPoint = (point) => {
  if (!point || !point.coordinates || point.coordinates.length !== 2) {
    return { lat: null, lng: null };
  }
  return {
    lat: point.coordinates[1],
    lng: point.coordinates[0],
  };
};

/**
 * Generate a 1-decimal geocell string.
 * E.g. geo:40.7:-74.0
 * Roughly ~11km grid at equator.
 */
const geoCell = (lat, lng) => {
  return `geo:${parseFloat(lat).toFixed(1)}:${parseFloat(lng).toFixed(1)}`;
};

/**
 * Return the 9 surrounding cells (including the center).
 */
const neighborCells = (lat, lng) => {
  const pLat = parseFloat(lat);
  const pLng = parseFloat(lng);
  
  const cells = [];
  const offsets = [-0.1, 0, 0.1];
  
  for (let dLat of offsets) {
    for (let dLng of offsets) {
      cells.push(`geo:${(pLat + dLat).toFixed(1)}:${(pLng + dLng).toFixed(1)}`);
    }
  }
  
  return cells;
};

module.exports = {
  toPoint,
  fromPoint,
  geoCell,
  neighborCells,
};

/**
 * Disaster Colors & Styling Utils for Tactical Protocol Zero Maps
 */

export const DISASTER_CONFIG = {
  // Major Categories
  'Flood': {
    fillColor: '#06B6D4',
    strokeColor: '#0891B2',
    icon: 'flood',
    badgeBg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    hex: '#06B6D4'
  },
  'Waterlogging': {
    fillColor: '#2563EB',
    strokeColor: '#1D4ED8',
    icon: 'water_damage',
    badgeBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    hex: '#2563EB'
  },
  'Industrial / Widespread Fire': {
    fillColor: '#EF4444',
    strokeColor: '#B91C1C',
    icon: 'fire_truck',
    badgeBg: 'bg-red-500/20 text-red-400 border-red-500/30',
    hex: '#EF4444'
  },
  'Earthquake': {
    fillColor: '#D97706',
    strokeColor: '#B45309',
    icon: 'public',
    badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    hex: '#D97706'
  },
  'Structural Collapse': {
    fillColor: '#64748B',
    strokeColor: '#334155',
    icon: 'domain_disabled',
    badgeBg: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    hex: '#64748B'
  },
  'Chemical Spill / Gas Leak': {
    fillColor: '#9333EA',
    strokeColor: '#6B21A8',
    icon: 'warning',
    badgeBg: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    hex: '#9333EA'
  },
  'Cyclone': {
    fillColor: '#0284C7',
    strokeColor: '#0369A1',
    icon: 'cyclone',
    badgeBg: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    hex: '#0284C7'
  },
  'Tornado': {
    fillColor: '#4F46E5',
    strokeColor: '#3730A3',
    icon: 'tornado',
    badgeBg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    hex: '#4F46E5'
  },
  'Landslide': {
    fillColor: '#EA580C',
    strokeColor: '#C2410C',
    icon: 'landscape',
    badgeBg: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    hex: '#EA580C'
  },

  // Minor Categories
  'Medical Emergency': {
    fillColor: '#10B981',
    strokeColor: '#047857',
    icon: 'medical_services',
    badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    hex: '#10B981'
  },
  'Road Accident': {
    fillColor: '#DC2626',
    strokeColor: '#991B1B',
    icon: 'car_crash',
    badgeBg: 'bg-red-600/20 text-red-400 border-red-600/30',
    hex: '#DC2626'
  },
  'Road Blockage / Hazard': {
    fillColor: '#F97316',
    strokeColor: '#C2410C',
    icon: 'block',
    badgeBg: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    hex: '#F97316'
  },
  'Localized Fire': {
    fillColor: '#E11D48',
    strokeColor: '#9F1239',
    icon: 'local_fire_department',
    badgeBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    hex: '#E11D48'
  },
  'Theft / Robbery': {
    fillColor: '#475569',
    strokeColor: '#1E293B',
    icon: 'local_police',
    badgeBg: 'bg-slate-600/20 text-slate-300 border-slate-600/30',
    hex: '#475569'
  },
  'Violence / Assault': {
    fillColor: '#7C3AED',
    strokeColor: '#5B21B6',
    icon: 'swords',
    badgeBg: 'bg-violet-600/20 text-violet-400 border-violet-600/30',
    hex: '#7C3AED'
  },
  'Missing Person': {
    fillColor: '#0284C7',
    strokeColor: '#075985',
    icon: 'person_search',
    badgeBg: 'bg-sky-600/20 text-sky-400 border-sky-600/30',
    hex: '#0284C7'
  },
  'Utility Failure': {
    fillColor: '#EAB308',
    strokeColor: '#A16207',
    icon: 'power_off',
    badgeBg: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    hex: '#EAB308'
  }
};

export const DEFAULT_DISASTER = {
  fillColor: '#EF4444',
  strokeColor: '#DC2626',
  icon: 'warning',
  badgeBg: 'bg-red-500/20 text-red-400 border-red-500/30',
  hex: '#EF4444'
};

export const getDisasterConfig = (category) => {
  return DISASTER_CONFIG[category] || DEFAULT_DISASTER;
};

/**
 * Validate standard report location coordinates
 * Ensures [lng, lat] format with valid numbers.
 */
export const isValidCoordinate = (location) => {
  if (!location || !location.coordinates || !Array.isArray(location.coordinates)) return false;
  if (location.coordinates.length !== 2) return false;
  const [lng, lat] = location.coordinates;
  if (typeof lng !== 'number' || typeof lat !== 'number') return false;
  if (isNaN(lng) || isNaN(lat)) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  // Ignore uninitialized (0, 0)
  if (lat === 0 && lng === 0) return false;
  return true;
};

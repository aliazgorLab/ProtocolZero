const RESOURCE_TAXONOMY = [
  { id: "water_bottles", name: "Drinking Water (bottle)", category: "Water", defaultUnit: "bottles" },
  { id: "dry_food_kits", name: "Dry Food Rations", category: "Food", defaultUnit: "kits" },
  { id: "first_aid_kits", name: "First Aid Medical Kits", category: "Medical", defaultUnit: "kits" },
  { id: "emergency_blankets", name: "Emergency Blankets", category: "Shelter", defaultUnit: "units" },
  { id: "tarpaulins_tents", name: "Tarpaulins & Tents", category: "Shelter", defaultUnit: "units" },
  { id: "rescue_boats", name: "Rescue Boats", category: "Equipment", defaultUnit: "boats" },
  { id: "ambulances", name: "Ambulance Vehicles", category: "Response", defaultUnit: "vehicles" },
  { id: "fire_trucks", name: "Fire Trucks / Engine Units", category: "Response", defaultUnit: "vehicles" },
  { id: "heavy_excavators", name: "Heavy Excavators / Earthmovers", category: "Equipment", defaultUnit: "vehicles" },
  { id: "portable_generators", name: "Portable Power Generators", category: "Equipment", defaultUnit: "units" },
  { id: "sandbags", name: "Flood Sandbags", category: "Supplies", defaultUnit: "bags" },
];

const RESOURCE_CATEGORIES = ["Water", "Food", "Medical", "Shelter", "Equipment", "Response", "Supplies"];

module.exports = { RESOURCE_TAXONOMY, RESOURCE_CATEGORIES };

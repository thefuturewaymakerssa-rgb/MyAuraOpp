/**
 * Calculates the distance between two points on Earth using the Haversine formula.
 * Returns distance in kilometers.
 */
export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


export const RADIUS_OPTIONS = [
  { label: "5km", value: 5 },
  { label: "10km", value: 10 },
  { label: "25km", value: 25 },
  { label: "50km", value: 50 },
  { label: "Nationwide", value: null },
];

/**
 * Mock coordinates for South African townships to enable radius filtering demo.
 */
export const TOWNSHIP_COORDS: Record<string, { lat: number; lng: number }> = {
  "Soweto": { lat: -26.2485, lng: 27.8540 },
  "Tembisa": { lat: -25.9964, lng: 28.2268 },
  "Khayelitsha": { lat: -34.0322, lng: 18.6749 },
  "Gugulethu": { lat: -33.9829, lng: 18.5714 },
  "Umlazi": { lat: -29.9702, lng: 30.8800 },
  "Alexandra": { lat: -26.1054, lng: 28.1023 },
  "Sandton": { lat: -26.1076, lng: 28.0567 },
  "Cape Town": { lat: -33.9249, lng: 18.4241 },
  "Botshabelo": { lat: -29.2312, lng: 26.7161 },
  "Mdantsane": { lat: -32.9463, lng: 27.7317 },
  "Mamelodi": { lat: -25.7001, lng: 28.3804 },
  "KwaMashu": { lat: -29.7340, lng: 30.9821 }
};

export const LOCATION_ALIASES = ["Kasi", "Location", "Township"];

export function getCoordsForLocation(locationStr: string) {
  const normalized = locationStr.toLowerCase();
  for (const [name, coords] of Object.entries(TOWNSHIP_COORDS)) {
    if (normalized.includes(name.toLowerCase())) return coords;
  }
  return null;
}

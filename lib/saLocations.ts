export interface ProvinceData {
  name: string;
  capital: string;
  majorCities: string[];
  keyTownships: string[];
}

export const SA_PROVINCES: ProvinceData[] = [
  {
    name: "Eastern Cape",
    capital: "Bhisho",
    majorCities: ["Gqeberha (Port Elizabeth / Nelson Mandela Bay)", "East London (Buffalo City)", "Mthatha", "Makhanda (Grahamstown)"],
    keyTownships: ["Ibhayi", "Mdantsane", "New Brighton", "KwaZakhele", "Soweto-on-Sea", "Duncan Village", "Kwamagxaki"]
  },
  {
    name: "Free State",
    capital: "Bloemfontein",
    majorCities: ["Bloemfontein (Mangaung)", "Welkom", "Sasolburg", "Virginia"],
    keyTownships: ["Botshabelo", "Thaba Nchu", "Phase 1–3 (Mangaung)", "Turffontein", "Batho", "Bochabela"]
  },
  {
    name: "Gauteng",
    capital: "Johannesburg / Pretoria",
    majorCities: ["Johannesburg", "Pretoria", "Ekurhuleni (Germiston, Boksburg, Kempton Park)", "Vanderbijlpark", "Vereeniging"],
    keyTownships: ["Soweto", "Tembisa", "Katlehong", "Vosloorus", "Thokoza", "Soshanguve", "Mamelodi", "Atteridgeville", "Diepsloot", "Alexandra", "Orange Farm", "Sebokeng"]
  },
  {
    name: "KwaZulu-Natal",
    capital: "Pietermaritzburg",
    majorCities: ["Durban (eThekwini)", "Pietermaritzburg", "Richards Bay", "Newcastle", "Ladysmith"],
    keyTownships: ["Umlazi", "KwaMashu", "Inanda", "Ntuzuma", "Clermont", "Lamontville", "KwaDukuza (Stanger area)", "Phoenix"]
  },
  {
    name: "Limpopo",
    capital: "Polokwane",
    majorCities: ["Polokwane", "Thohoyandou", "Tzaneen", "Mokopane", "Lephalale"],
    keyTownships: ["Seshego", "Lebowakgomo", "Mankweng", "Mahwelereng", "Ga-Ramokgopane", "Hlanganani"]
  },
  {
    name: "Mpumalanga",
    capital: "Mbombela (Nelspruit)",
    majorCities: ["Mbombela", "eMalahleni (Witbank)", "Middelburg", "Secunda", "Ermelo"],
    keyTownships: ["KaMhlushwa", "Embalenhle", "KwaMhlanga", "Phola", "Lynnville", "Ackerville"]
  },
  {
    name: "Northern Cape",
    capital: "Kimberley",
    majorCities: ["Kimberley", "Upington", "De Aar", "Springbok"],
    keyTownships: ["Galeshewe", "Roodepan", "Ritchie", "Homevale"]
  },
  {
    name: "North West",
    capital: "Mahikeng (Mmabatho)",
    majorCities: ["Mahikeng", "Rustenburg", "Potchefstroom", "Klerksdorp", "Brits"],
    keyTownships: ["Tlhabane", "Phokeng", "Ikageng", "Ga-Rankuwa", "Jouberton", "Boitekong"]
  },
  {
    name: "Western Cape",
    capital: "Cape Town",
    majorCities: ["Cape Town", "George", "Paarl", "Stellenbosch", "Worcester"],
    keyTownships: ["Khayelitsha", "Mitchell's Plain", "Gugulethu", "Langa", "Nyanga", "Delft", "Makhaza", "Harare"]
  }
];

// Helper to get a flat list of all townships specifically
export const ALL_TOWNSHIPS = SA_PROVINCES.flatMap(p => p.keyTownships);

// Combined flattened list mostly for search typeaheads
export const ALL_SA_LOCATIONS = SA_PROVINCES.flatMap(p => [
  p.name,
  p.capital,
  ...p.majorCities,
  ...p.keyTownships
]);

export const LOCATION_ALIASES = ["Kasi", "Location", "Township"];

/**
 * Enhanced Coordinates mapped from Township info
 */
export const EXTENDED_TOWNSHIP_COORDS: Record<string, { lat: number; lng: number }> = {
  "Soweto": { lat: -26.2485, lng: 27.8540 },
  "Tembisa": { lat: -25.9964, lng: 28.2268 },
  "Khayelitsha": { lat: -34.0322, lng: 18.6749 },
  "Gugulethu": { lat: -33.9829, lng: 18.5714 },
  "Umlazi": { lat: -29.9702, lng: 30.8800 },
  "Alexandra": { lat: -26.1054, lng: 28.1023 },
  "Botshabelo": { lat: -29.2312, lng: 26.7161 },
  "Mdantsane": { lat: -32.9463, lng: 27.7317 },
  "Mamelodi": { lat: -25.7001, lng: 28.3804 },
  "KwaMashu": { lat: -29.7340, lng: 30.9821 }
};

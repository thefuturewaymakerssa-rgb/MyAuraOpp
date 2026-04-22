"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getCoordsForLocation } from "@/lib/locationUtils";
import Link from "next/link";
import { MapPin, Zap } from "lucide-react";
import ReactDOMServer from "react-dom/server";

// We create a custom marker icon using Lucide React to match the platform aesthetic
const customMarkerHtml = ReactDOMServer.renderToString(
  <div style={{
    backgroundColor: '#0F766E', 
    color: '#fff',
    borderRadius: '50%',
    padding: '8px',
    boxShadow: '0 10px 15px -3px rgba(15, 118, 110, 0.5), 0 4px 6px -4px rgba(15, 118, 110, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    border: '2px solid #FFF'
  }}>
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 15 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
  </div>
);

const tealIcon = new L.DivIcon({
  html: customMarkerHtml,
  className: "custom-teal-marker",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

type Job = {
  id: string;
  title: string;
  trade: string;
  location: string;
  description: string;
  budget: string;
  created_at: string;
  preferred_talent_type?: string[];
};

interface GigMapProps {
  jobs: Job[];
  userLat: number | null;
  userLng: number | null;
  activeRadius: number | null;
}

// Default center to South Africa roughly if no user location is provided
const DEFAULT_CENTER: [number, number] = [-28.4793, 24.6727];
const DEFAULT_ZOOM = 6;
const FOCUS_ZOOM = 11;

// Component to handle auto-recentering when user location changes
function MapRecenter({ userLat, userLng }: { userLat: number | null; userLng: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (userLat && userLng) {
      map.setView([userLat, userLng], FOCUS_ZOOM);
    }
  }, [userLat, userLng, map]);
  return null;
}

export default function GigMap({ jobs, userLat, userLng, activeRadius }: GigMapProps) {
  const centerPosition: [number, number] = (userLat && userLng) 
    ? [userLat, userLng] 
    : DEFAULT_CENTER;

  const validJobs = jobs.map(job => {
    const coords = getCoordsForLocation(job.location);
    return { ...job, coords };
  }).filter(job => job.coords !== null) as (Job & { coords: { lat: number; lng: number } })[];

  return (
    <div className="w-full h-full relative font-sans font-body z-10 rounded-[4rem] overflow-hidden shadow-2xl border-4 border-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)]">
      {/* 
        Option B implemented: We keep standard OSM styling.
        The map uses light styling by default which blends well with standard mode's #F0FDFA background.
      */}
      <MapContainer 
        center={centerPosition} 
        zoom={userLat ? FOCUS_ZOOM : DEFAULT_ZOOM} 
        scrollWheelZoom={false}
        className="w-full h-full z-0"
        style={{ background: '#F0FDFA' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="opacity-90 grayscale-[0.2]"
        />

        <MapRecenter userLat={userLat} userLng={userLng} />

        {/* User Location Radar */}
        {userLat && userLng && activeRadius && (
          <Circle 
            center={[userLat, userLng]} 
            radius={activeRadius * 1000} // Convert km to meters
            pathOptions={{ 
              color: '#13EC6A', 
              fillColor: '#13EC6A', 
              fillOpacity: 0.1,
              weight: 2,
              dashArray: '10, 10'
            }} 
          />
        )}
        
        {/* User Location Pin */}
        {userLat && userLng && (
          <Circle 
            center={[userLat, userLng]} 
            radius={150} 
            pathOptions={{ 
              color: '#0F766E', 
              fillColor: '#0F766E', 
              fillOpacity: 1,
              weight: 3
            }} 
          />
        )}

        {/* Gig Pins */}
        {validJobs.map((job) => (
          <Marker 
            key={job.id} 
            position={[job.coords.lat, job.coords.lng]}
            icon={tealIcon}
          >
            <Popup className="custom-popup" closeButton={false} offset={[0, -10]}>
              <div className="font-sans min-w-[200px] p-2 space-y-3 font-body">
                 <div className="flex justify-between items-start mb-2">
                    <span className="bg-[#F0FDFA] text-[#0F766E] text-[9px] uppercase font-black px-3 py-1 rounded-full border border-[#0F766E]/10 italic tracking-widest">{job.trade}</span>
                 </div>
                 <h4 className="font-black text-xl mb-1 italic font-display tracking-tight leading-tight text-[#0F172A]">{job.title}</h4>
                 <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest italic text-gray-500 mb-4">
                    {job.budget && <span className="flex items-center gap-1 text-[#0F766E]"><Zap size={12} fill="currentColor" stroke="none" /> {job.budget}</span>}
                 </div>
                 
                 <Link 
                    href={`/gigs/${job.id}`}
                    className="block w-full bg-[#0F766E] text-white py-3 rounded-2xl font-black text-[9px] uppercase tracking-[0.3em] shadow-lg shadow-[#0F766E]/30 text-center italic hover:bg-[#0F172A] transition-colors"
                  >
                    View Details
                  </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Custom CSS for the Popup to make it look native */}
      <style>{`
        .leaflet-popup-content-wrapper {
          border-radius: 1.5rem !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
          padding: 0 !important;
          overflow: hidden;
          border: 2px solid #E2E8F0;
        }
        .leaflet-popup-content {
          margin: 0 !important;
        }
        .leaflet-popup-tip {
          background: white !important;
          box-shadow: 2px 2px 10px rgba(0,0,0,0.1);
        }
        .leaflet-container a.leaflet-popup-close-button {
          color: #9ca3af !important;
          padding: 8px !important;
          right: 4px !important;
          top: 4px !important;
        }
        .leaflet-container a.leaflet-popup-close-button:hover {
          color: #0F766E !important;
        }
      `}</style>
    </div>
  );
}

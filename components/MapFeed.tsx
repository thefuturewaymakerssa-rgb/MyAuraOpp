"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FeedItem } from "@/app/(authenticated)/feed/VibeFeedClient";
import { User, Briefcase, Play, Star } from "lucide-react";

// Fix for default marker icon in Leaflet + Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const createMarkerIcon = (color: string, isTalent: boolean) => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div class="marker-pulse" style="background-color: ${color};"></div>
      <div class="marker-pin" style="background-color: ${color};">
        ${isTalent ? '<svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>' : '<svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>'}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

L.Marker.prototype.options.icon = DefaultIcon;

interface MapFeedProps {
  items: FeedItem[];
  onShowVideo: (index: number) => void;
  userCoords: { lat: number; lng: number } | null;
}

function CenterMap({ coords }: { coords: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView([coords.lat, coords.lng], 13);
    }
  }, [coords, map]);
  return null;
}

export default function MapFeed({ items, onShowVideo, userCoords }: MapFeedProps) {
  const center: [number, number] = userCoords ? [userCoords.lat, userCoords.lng] : [-26.2041, 28.0473]; // Default to Joburg

  return (
    <div className="w-full h-full rounded-[3rem] overflow-hidden border-4 border-white shadow-2xl relative z-0">
      <MapContainer 
        center={center} 
        zoom={12} 
        className="w-full h-full"
        style={{ background: "#F0FDFA" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {userCoords && (
          <Marker position={[userCoords.lat, userCoords.lng]}>
            <Popup>
              <div className="p-2 text-center">
                <p className="font-black uppercase text-[10px] tracking-widest text-[#0F766E]">You Are Here</p>
              </div>
            </Popup>
          </Marker>
        )}

        {items.map((item, index) => {
          if (item.latitude === null || item.longitude === null) return null;
          
          const isTalent = item.role !== 'employer';
          
          return (
            <Marker 
              key={item.id} 
              position={[item.latitude, item.longitude]}
              icon={createMarkerIcon(isTalent ? "#0F766E" : "#8B5CF6", isTalent)}
            >
              <Popup className="premium-popup">
                <div className="w-64 p-2 space-y-4 font-sans translate-y-2">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isTalent ? 'bg-[#F0FDFA] text-[#0F766E]' : 'bg-[#F5F3FF] text-[#8B5CF6]'}`}>
                       {isTalent ? <User size={20} /> : <Briefcase size={20} />}
                    </div>
                    <div className="overflow-hidden">
                       <h4 className="font-black italic uppercase tracking-tighter text-sm leading-none truncate">{item.makerName}</h4>
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1 italic truncate">{item.makerTrade}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="flex flex-col">
                       <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1">Rate</span>
                       <span className="font-black italic text-[#0F766E] text-xs">R{item.hourlyRate}/hr</span>
                    </div>
                    <div className="flex flex-col text-right">
                       <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1">Vibe</span>
                       <span className="flex items-center gap-1 font-black italic text-amber-500 text-xs"><Star size={10} fill="currentColor" /> 4.9</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => onShowVideo(index)}
                    className="w-full py-4 bg-[#0F766E] text-white rounded-xl font-black uppercase tracking-[0.3em] text-[9px] shadow-lg flex items-center justify-center gap-2 hover:scale-105 transition-all italic"
                  >
                    <Play size={12} fill="currentColor" /> Watch Proof
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        <CenterMap coords={userCoords} />
      </MapContainer>
      
      {/* Map Legend/Overlay */}
      <div className="absolute bottom-6 left-6 right-6 z-[1000] pointer-events-none px-4">
         <div className="w-full max-w-sm mx-auto bg-white/95 backdrop-blur-xl p-5 rounded-[2rem] border-2 border-white flex justify-between items-center shadow-2xl pointer-events-auto">
            <div className="flex gap-6">
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#0F766E] rounded-full shadow-lg shadow-[#0F766E]/20" />
                  <span className="text-[9px] font-black uppercase tracking-widest italic text-gray-500">Talent</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#8B5CF6] rounded-full shadow-lg shadow-[#8B5CF6]/20" />
                  <span className="text-[9px] font-black uppercase tracking-widest italic text-gray-500">Employers</span>
               </div>
            </div>
            <div className="text-[9px] font-black uppercase tracking-[0.4em] text-[#0F766E] italic bg-[#F0FDFA] px-4 py-2 rounded-full border border-[#E2E8F0]">
               {items.length} SIGNALS
            </div>
         </div>
      </div>
    </div>
  );
}

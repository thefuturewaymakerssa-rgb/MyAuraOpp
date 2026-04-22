"use client";

import { useState, useEffect, useRef, memo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { User, ShieldCheck, MapPin, Video, Zap, Briefcase, Loader2, Play, Camera, ArrowRight, ArrowLeft, Gem, Mail, CheckCircle2, ChevronRight } from "lucide-react";
import { SA_LOCATIONS, SKILL_DATABASE } from "@/utils/constants";
import { createClient } from "@/utils/supabase/client";
import { ProfileRole } from "@/lib/database.types";
import { profilesHub, proofsHub, storageHub } from "@/lib/supabase-helpers";
import { trackEvent, ANALYTICS_EVENTS } from "@/lib/analytics";

type Step = 0 | 1 | 2 | 3 | 4;

interface OnboardingData {
  name: string;
  company_name?: string;
  phone: string;
  email: string;
  dob: string;
  password?: string;
  province: string;
  city: string;
  township: string;
  skills: string[];
  userType: "talent" | "employer" | "";
  role: string;
  id_selfie?: string;
  identity_verified?: boolean;
  bio?: string;
  customTownship?: string;
  customSkill?: string;
  gender?: string;
  popia_consent: boolean;
  sa_id_number?: string;
}

interface OnboardingProps {
  formData: OnboardingData;
  setFormData: React.Dispatch<React.SetStateAction<OnboardingData>>;
  step?: Step;
  setStep?: React.Dispatch<React.SetStateAction<Step>>;
  loading?: boolean;
  setLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  error?: string | null;
  setError?: React.Dispatch<React.SetStateAction<string | null>>;
}

const Step0RoleSelection = memo(({ formData, setFormData, setStep }: OnboardingProps) => (
  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
    <div className="text-center mb-16">
      <div className="w-24 h-24 bg-[#0F766E]/5 rounded-[2.5rem] flex items-center justify-center text-[#0F766E] mx-auto mb-10 border border-[#0F766E]/10 shadow-xl shadow-[#0F766E]/5">
        <User size={48} />
      </div>
      <h1 className="text-6xl md:text-7xl font-black mb-6 tracking-tighter font-display italic uppercase leading-none">Who Are You?</h1>
      <p className="text-gray-500 font-bold text-lg italic pr-12 pl-12 max-w-lg mx-auto leading-relaxed">Choose your mission to unlock local gigs or the best talent in SA.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <button 
        onClick={() => {
          setFormData({ ...formData, userType: 'talent' });
          setStep?.(1);
        }}
        className="bg-white p-12 rounded-[4rem] border-2 border-[#E2E8F0] hover:border-[#0F766E] transition-all group text-left relative overflow-hidden shadow-2xl shadow-[#0F766E]/2 hover:-translate-y-2 group-hover:shadow-[0_40px_80px_rgba(15,118,110,0.1)] duration-500"
      >
        <div className="absolute top-0 right-0 p-12 text-[#0F766E]/5 group-hover:text-[#0F766E]/10 transition-colors">
          <Zap size={100} />
        </div>
        <div className="w-20 h-20 rounded-[1.5rem] bg-[#F0FDFA] flex items-center justify-center text-[#0F766E] mb-10 group-hover:bg-[#0F766E] group-hover:text-white transition-all transform group-hover:rotate-12 duration-500">
          <Zap size={40} />
        </div>
        <h3 className="text-4xl font-black italic font-display uppercase mb-4 leading-none">The Hustler</h3>
        <p className="text-gray-400 font-bold text-sm leading-relaxed uppercase tracking-widest italic opacity-70">I have the skill. <br/>I want to get paid.</p>
        <div className="mt-8 flex items-center gap-2 text-[#0F766E] font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-500">
           Start My Grind <ChevronRight size={14} />
        </div>
      </button>

      <button 
        onClick={() => {
          setFormData({ ...formData, userType: 'employer' });
          setStep?.(1);
        }}
        className="bg-white p-12 rounded-[4rem] border-2 border-[#E2E8F0] hover:border-[#8B5CF6] transition-all group text-left relative overflow-hidden shadow-2xl shadow-[#8B5CF6]/2 hover:-translate-y-2 group-hover:shadow-[0_40px_80px_rgba(139,92,246,0.1)] duration-500"
      >
        <div className="absolute top-0 right-0 p-12 text-[#8B5CF6]/5 group-hover:text-[#8B5CF6]/10 transition-colors">
          <Briefcase size={100} />
        </div>
        <div className="w-20 h-20 rounded-[1.5rem] bg-[#F5F3FF] flex items-center justify-center text-[#8B5CF6] mb-10 group-hover:bg-[#8B5CF6] group-hover:text-white transition-all transform group-hover:-rotate-12 duration-500">
          <Briefcase size={40} />
        </div>
        <h3 className="text-4xl font-black italic font-display uppercase mb-4 leading-none">The Boss</h3>
        <p className="text-gray-400 font-bold text-sm leading-relaxed uppercase tracking-widest italic opacity-70">I need a pro. <br/>I want to hire now.</p>
        <div className="mt-8 flex items-center gap-2 text-[#8B5CF6] font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-500">
           Enter The Pulse <ChevronRight size={14} />
        </div>
      </button>
    </div>
  </div>
));
Step0RoleSelection.displayName = "Step0RoleSelection";

const isOldEnough = (dob: string) => {
  if (!dob) return false;
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age >= 17;
};

const Step1Location = memo(({ formData, setFormData, setStep, loading, setLoading, setError }: OnboardingProps) => (
  <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
    <div className="text-center mb-16">
       <div className="w-24 h-24 bg-[#0F766E]/5 rounded-[2.5rem] flex items-center justify-center text-[#0F766E] mx-auto mb-10 border border-[#0F766E]/10 shadow-premium">
         <MapPin size={48} />
       </div>
       <h1 className="text-6xl md:text-7xl font-black mb-6 tracking-tighter font-display italic leading-none uppercase">The Location.</h1>
       <p className="text-gray-500 font-bold text-lg italic max-w-sm mx-auto">Where you at? We match you locally to save travel time.</p>
    </div>

    <div className="space-y-6">
      {formData.userType === 'employer' && (
        <div className="relative group/input mb-8">
          <span className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within/input:text-[#0F766E] transition-colors duration-300">
            <Briefcase size={24} />
          </span>
          <input 
            type="text" placeholder="Business / Company Name" 
            value={formData?.company_name || ""} onChange={e => setFormData && setFormData({ ...formData, company_name: e.target.value, name: e.target.value })}
            className="w-full bg-white p-8 pl-20 rounded-[2rem] border-2 border-[#E2E8F0] focus:border-[#0F766E] transition-all outline-none font-black text-xl placeholder:text-gray-300 shadow-sm"
          />
        </div>
      )}

      <div className="relative group/input">
        <span className="absolute left-8 top-1/2 -translate-y-1/2 text-[#0F766E] font-black border-r-2 border-[#E2E8F0] pr-6 group-focus-within/input:text-[#0F766E] transition-colors italic">+27</span>
        <input 
          type="tel" placeholder="Mobile Number" 
          value={formData?.phone || ""} onChange={e => setFormData && setFormData({ ...formData, phone: e.target.value })}
          className="w-full bg-white p-8 pl-28 rounded-[2rem] border-2 border-[#E2E8F0] focus:border-[#0F766E] transition-all outline-none font-black text-xl placeholder:text-gray-300 shadow-sm"
        />
      </div>

      <button 
        onClick={async () => {
            setLoading?.(true);
            setError?.(null);
           if (!navigator.geolocation) {
              setError?.("GPS not supported. Select manually below.");
              setLoading?.(false);
              return;
           }
           navigator.geolocation.getCurrentPosition(async (pos) => {
              try {
                const { latitude, longitude } = pos.coords;
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
                const data = await res.json();
                const address = data.address;
                const prov = address.state || "Gauteng";
                setFormData?.((prev) => ({ ...prev, province: prov, city: address.city || address.town || "", township: address.suburb || "" }));
                setError?.("Hood detected! Verify below.");
              } catch {
                setError?.("Could not auto-detect. Select manually.");
              } finally {
                setLoading?.(false);
              }
           }, () => {
              setError?.("Location denied. Select manually.");
              setLoading?.(false);
           });
        }}
        disabled={loading}
        className="group w-full bg-white border-2 border-dashed border-[#0F766E]/20 py-8 flex items-center justify-center gap-4 text-[#0F766E] font-black uppercase tracking-[0.4em] text-[10px] hover:bg-[#F0FDFA] hover:border-[#0F766E]/40 transition-all rounded-[2rem] shadow-sm italic"
      >
        {loading ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} className="group-hover:animate-pulse" />}
        Detect My Hood (GPS)
      </button>

      <div className="grid grid-cols-1 gap-6">
        <div className="relative">
          <select 
            value={formData.province} 
            onChange={e => setFormData?.({ ...formData, province: e.target.value, city: "", township: "" })}
            className="w-full bg-white p-8 rounded-[2rem] border-2 border-[#E2E8F0] focus:border-[#0F766E] font-black outline-none appearance-none transition-all shadow-sm pr-16"
          >
            <option value="">Select Province</option>
            {Object.keys(SA_LOCATIONS).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-[#0F766E]"><ArrowRight size={20} className="rotate-90" /></div>
        </div>

        {formData.province && (
          <div className="relative animate-in slide-in-from-top-4 duration-500">
            <select 
              value={formData.city} 
              onChange={e => setFormData?.({ ...formData, city: e.target.value, township: "" })}
              className="w-full bg-white p-8 rounded-[2rem] border-2 border-[#E2E8F0] focus:border-[#0F766E] font-black outline-none appearance-none transition-all shadow-sm pr-16"
            >
              <option value="">Select City / Region</option>
              {Object.keys((SA_LOCATIONS as any)[formData.province]).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-[#0F766E]"><ArrowRight size={20} className="rotate-90" /></div>
          </div>
        )}

        {formData.city && (
          <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
            <div className="relative">
              <select 
                value={formData.township} 
                onChange={e => setFormData?.({ ...formData, township: e.target.value })}
                className="w-full bg-white p-8 rounded-[2rem] border-2 border-[#E2E8F0] focus:border-[#0F766E] font-black outline-none appearance-none transition-all shadow-sm pr-16"
              >
                <option value="">Select Township / Suburb</option>
                {(SA_LOCATIONS as any)[formData.province][formData.city].map((t: string) => <option key={t} value={t}>{t}</option>)}
                <option value="_custom" className="text-[#0F766E] font-black">Other (Type manually)</option>
              </select>
              <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-[#0F766E]"><ArrowRight size={20} className="rotate-90" /></div>
            </div>
            
            {formData.township === '_custom' && (
              <div className="animate-in fade-in slide-in-from-top-4">
                <input 
                  type="text" placeholder="Enter your Township / Suburb" 
                  value={formData.customTownship || ""} 
                  onChange={e => setFormData && setFormData({ ...formData, customTownship: e.target.value })}
                  className="w-full bg-white p-8 rounded-[2rem] border-2 border-[#0F766E] transition-all outline-none font-black text-xl shadow-inner"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    <div className="flex gap-6">
      <button onClick={() => setStep?.(0)} className="w-24 h-24 bg-white rounded-[2rem] border-2 border-[#E2E8F0] flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm text-gray-400">
        <ArrowLeft size={32} />
      </button>
      <button 
        onClick={() => {
          if (formData.userType === 'employer' && !formData.company_name) {
            setError?.("Business Name is required.");
            return;
          }
          if (!formData.phone) {
            setError?.("Phone is required so we can WhatsApp you.");
            return;
          }
          if (!formData.township || (formData.township === '_custom' && !formData.customTownship)) {
            setError?.("Select or enter your hood so we can find local gigs.");
            return;
          }
          setError?.(null);
          if (formData.userType === 'employer') {
            setStep?.(4); // In a real flow, you might want to call saveProfile() here, but following the UI logic
          } else {
            setStep?.(2);
          }
        }}
        className="flex-1 bg-[#0F766E] text-white py-8 rounded-[2.5rem] font-black text-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-[#0F766E]/20 uppercase tracking-widest italic"
      >
        {formData.userType === 'employer' ? "FINISH PROFILE" : "NEXT: IDENTITY"} <ArrowRight size={28} className="inline ml-2" />
      </button>
    </div>
  </div>
));
Step1Location.displayName = "Step1Location";

const Step2Identity = memo(({ formData, setFormData, setStep, setError }: OnboardingProps) => {
  const [selfie, setSelfie] = useState<string | null>(formData.id_selfie || null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  const startCamera = async () => {
    try {
      const userStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      setStream(userStream);
      setShowCamera(true);
    } catch (err: unknown) {
      setError?.("Could not access camera. Please check permissions.");
    }
  };

  useEffect(() => {
    if (showCamera && stream && videoRef.current) videoRef.current.srcObject = stream;
  }, [showCamera, stream]);

  const stopCamera = () => {
    stream?.getTracks().forEach(track => track.stop());
    setStream(null);
    setShowCamera(false);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(-1, 1);
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setSelfie(dataUrl);
        setFormData?.({ ...formData, id_selfie: dataUrl, identity_verified: true });
        stopCamera();
      }
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
       <div className="text-center mb-16">
         <div className="w-24 h-24 bg-[#0F766E]/5 rounded-[2.5rem] flex items-center justify-center text-[#0F766E] mx-auto mb-10 border border-[#0F766E]/10 shadow-premium">
           <ShieldCheck size={48} />
         </div>
         <h1 className="text-6xl md:text-7xl font-black mb-6 tracking-tighter font-display italic leading-none uppercase">The Identity.</h1>
         <p className="text-gray-500 font-bold text-lg italic pr-4 pl-4">Snap a selfie to earn your <span className="text-[#0F766E]">&quot;Verified&quot;</span> badge. Employers trust verified talent 10x more.</p>
       </div>

       <div className="space-y-8">
         <div className="relative group/input">
            <select 
              value={formData.gender || ""} 
              onChange={e => setFormData && setFormData({ ...formData, gender: e.target.value })}
              className="w-full bg-white p-8 rounded-[2rem] border-2 border-[#E2E8F0] focus:border-[#0F766E] transition-all outline-none font-black text-lg uppercase tracking-widest cursor-pointer appearance-none shadow-sm pr-16 italic"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-Binary">Non-Binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
            <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-[#0F766E] font-black uppercase text-[10px] tracking-widest">Select &rarr;</div>
         </div>

         <div className="relative group/input">
            <span className="absolute left-8 top-6 text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Date of Birth</span>
            <input 
              type="date" 
              value={formData?.dob || ""} onChange={e => setFormData && setFormData({ ...formData, dob: e.target.value })}
              className="w-full bg-white p-10 pt-16 pb-6 rounded-[2rem] border-2 border-[#E2E8F0] focus:border-[#0F766E] outline-none font-black text-xl uppercase tracking-widest italic shadow-sm"
            />
            {formData?.dob && !isOldEnough(formData.dob) && (
              <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-4 pl-4 italic">⚠️ Must be 17+ for WayMakers</p>
            )}
         </div>

         <div className="relative w-64 h-64 mx-auto">
            <div className="absolute inset-0 rounded-[3.5rem] border-4 border-dashed border-[#0F766E]/10 rotate-6 group-hover:rotate-0 transition-transform duration-700"></div>
            <div className="absolute inset-4 rounded-[2.5rem] bg-gray-50 border-2 border-white overflow-hidden flex items-center justify-center shadow-inner">
              {showCamera ? (
                <video ref={videoRef} autoPlay playsInline crossOrigin="anonymous" className="w-full h-full object-cover scale-x-[-1]" />
              ) : selfie ? (
                <img src={selfie} className="w-full h-full object-cover" alt="Selfie" crossOrigin="anonymous" />
              ) : (
                <div className="text-gray-200"><User size={80} /></div>
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
         </div>

         {!showCamera ? (
           <button 
             onClick={startCamera}
             className="w-full h-20 bg-[#F0FDFA] rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-[#CCFBF1] transition-all border border-[#0F766E]/5 text-[#0F766E] italic"
           >
             <Video size={20} />
             {selfie ? "RETAKE SELFIE" : "VERIFY WITH SELFIE"}
           </button>
         ) : (
            <div className="flex gap-4">
              <button onClick={takePhoto} className="flex-1 bg-[#0F766E] text-white h-20 rounded-[1.5rem] font-black text-[10px] tracking-[0.4em] uppercase flex items-center justify-center gap-4 shadow-xl shadow-[#0F766E]/20 italic">
                <Camera size={20} /> SNAP PROTOCOL
              </button>
              <button onClick={stopCamera} className="px-8 h-20 bg-gray-100 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.4em] text-red-400 italic">CANCEL</button>
            </div>
          )}
       </div>

        {/* POPIA Consent Gateway */}
        <div className="space-y-6 bg-white p-8 rounded-[2rem] border-2 border-[#E2E8F0] shadow-sm">
           <div className="flex items-start gap-4">
              <input 
                type="checkbox" 
                id="popia_consent"
                checked={formData.popia_consent}
                onChange={e => setFormData && setFormData({ ...formData, popia_consent: e.target.checked })}
                className="w-6 h-6 mt-1 rounded border-2 border-[#E2E8F0] text-[#0F766E] focus:ring-[#0F766E]"
              />
              <label htmlFor="popia_consent" className="text-[11px] font-bold text-gray-500 italic leading-relaxed">
                I consent to the processing of my personal information as per the <Link href="/privacy" className="text-[#0F766E] underline decoration-2 underline-offset-4">POPIA Protocol</Link>. 🇿🇦
              </label>
           </div>
           
           <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
              <Link href="/privacy" className="text-[9px] font-black uppercase tracking-widest text-gray-300 hover:text-[#0F766E] transition-all">Withdraw Consent / Exit</Link>
              <span className="text-[8px] font-black text-gray-200 uppercase tracking-widest">Mandatory Gate</span>
           </div>
        </div>

        {/* Optional Beta KYC (SA ID) */}
        <div className="space-y-4">
           <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] italic mb-2 block">Optional: SA ID Number (Beta KYC Audit)</label>
           <input 
             type="text" 
             placeholder="Enter ID for faster verification" 
             value={formData.sa_id_number || ""}
             onChange={e => setFormData && setFormData({ ...formData, sa_id_number: e.target.value })}
             className="w-full bg-white p-6 rounded-[1.5rem] border-2 border-[#E2E8F0] focus:border-[#0F766E] outline-none font-black text-sm italic"
           />
        </div>

       <div className="flex gap-6 pt-4">
         <button onClick={() => setStep?.(1)} className="w-24 h-24 bg-white rounded-[2rem] border-2 border-[#E2E8F0] flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm text-gray-400">
           <ArrowLeft size={32} />
         </button>
         <button 
           onClick={() => {
             if (!formData.dob || !isOldEnough(formData.dob)) {
               setError?.("You must be at least 17 to use WayMakers.");
               return;
             }
             if (!formData.gender) {
               setError?.("Please select a gender identity.");
               return;
             }
             if (!formData.popia_consent) {
               setError?.("POPIA Consent is required to activate your mission.");
               return;
             }
             setError?.(null);
             setStep?.(3);
           }}
           className="flex-1 bg-[#0F766E] text-white py-8 rounded-[2.5rem] font-black text-2xl shadow-2xl shadow-[#0F766E]/20 uppercase tracking-widest italic disabled:opacity-50"
           disabled={!formData.popia_consent}
         >
           NEXT: THE HUSTLE <ArrowRight size={28} className="inline ml-2" />
         </button>
       </div>
    </div>
  );
});
Step2Identity.displayName = "Step2Identity";

const Step3Hustle = memo(({ formData, setFormData, setStep, setError }: OnboardingProps) => (
  <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
     <div className="text-center mb-16">
       <div className="w-24 h-24 bg-[#0F766E]/5 rounded-[2.5rem] flex items-center justify-center text-[#0F766E] mx-auto mb-10 border border-[#0F766E]/10 shadow-premium">
         <Gem size={48} />
       </div>
       <h1 className="text-6xl md:text-7xl font-black mb-6 tracking-tighter font-display italic leading-none uppercase">The Hustle.</h1>
       <p className="text-gray-500 font-bold text-lg italic max-w-sm mx-auto">What&apos;s your niche? Tag your primary skills to start matching.</p>
     </div>

     <div className="space-y-12">
        <div className="space-y-6">
           <label className="text-[10px] font-black text-[#0F766E] uppercase tracking-[0.4em] italic mb-4 block">My Background</label>
           <div className="flex flex-wrap gap-4">
             {[
               { id: 'hustler', label: 'Self-Taught Hustler' },
               { id: 'freshie', label: 'Fresh Entry Level' },
               { id: 'graduate', label: 'Degree Graduate' },
               { id: 'reskiller', label: 'Career Switcher' }
             ].map(r => (
               <button 
                 key={r.id}
                 onClick={() => setFormData?.({ ...formData, role: r.id })}
                 className={`px-8 py-5 rounded-[1.5rem] border-2 text-[11px] font-black uppercase tracking-widest transition-all duration-300 italic ${
                   formData.role === r.id ? "bg-[#0F766E] text-white border-transparent shadow-xl shadow-[#0F766E]/30 scale-105" : "bg-white border-[#E2E8F0] text-gray-400 hover:border-[#0F766E]/40"
                 }`}
               >
                 {r.label}
               </button>
             ))}
           </div>
        </div>

        <div className="space-y-6">
           <label className="text-[10px] font-black text-[#0F766E] uppercase tracking-[0.4em] italic mb-4 block">Primary Skills (Select up to 5)</label>
           <div className="flex flex-wrap gap-3">
             {SKILL_DATABASE.map(skill => (
               <button 
                 key={skill}
                 onClick={() => {
                   const s = new Set(formData.skills);
                   if (s.has(skill)) s.delete(skill);
                   else if (s.size < 5) s.add(skill);
                   setFormData?.({ ...formData, skills: Array.from(s) });
                 }}
                 className={`px-8 py-4 rounded-[1.2rem] border-2 text-[10px] font-black uppercase tracking-widest transition-all italic ${
                   formData.skills.includes(skill) ? "bg-[#0F766E] text-white border-transparent shadow-lg shadow-[#0F766E]/20" : "bg-white border-[#E2E8F0] text-gray-400 hover:border-[#0F766E]/40"
                 }`}
               >
                 {skill}
               </button>
             ))}
             {formData.skills.filter(s => !SKILL_DATABASE.includes(s)).map(skill => (
                <button key={skill} onClick={() => {
                   const s = new Set(formData.skills);
                   s.delete(skill);
                   setFormData?.({ ...formData, skills: Array.from(s) });
                }} className="px-8 py-4 rounded-[1.2rem] bg-[#0F766E] text-white border-transparent shadow-lg text-[10px] font-black uppercase tracking-widest italic">
                   {skill} ×
                </button>
             ))}
           </div>
           
           {formData.skills.length < 5 && (
              <div className="flex gap-4 mt-8">
                 <input 
                   type="text" placeholder="Add custom skill..."
                   value={formData.customSkill || ""} 
                   onChange={e => setFormData && setFormData({ ...formData, customSkill: e.target.value })}
                   onKeyDown={e => {
                     if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = (formData.customSkill || "").trim();
                        if (val && !formData.skills.includes(val) && formData.skills.length < 5) {
                           setFormData?.({ ...formData, skills: [...formData.skills, val], customSkill: "" });
                        }
                     }
                   }}
                   className="flex-1 bg-white px-8 py-5 rounded-[1.5rem] border-2 border-[#E2E8F0] focus:border-[#0F766E] outline-none font-black text-sm italic"
                 />
                 <button 
                   onClick={() => {
                     const val = (formData.customSkill || "").trim();
                     if (val && !formData.skills.includes(val) && formData.skills.length < 5) {
                        setFormData?.({ ...formData, skills: [...formData.skills, val], customSkill: "" });
                     }
                   }}
                   className="bg-[#F0FDFA] px-10 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest text-[#0F766E] border-2 border-transparent hover:border-[#0F766E]/20 transition-all italic"
                 >Add</button>
              </div>
           )}
        </div>

        <div className="space-y-6">
          <label className="text-[10px] font-black text-[#0F766E] uppercase tracking-[0.4em] italic mb-4 block">About My Energy</label>
          <textarea 
            placeholder="Tell employers about your reliable traits or your journey. Keep it raw and real." 
            value={formData?.bio || ""} onChange={e => setFormData && setFormData({ ...formData, bio: e.target.value })}
            className="w-full bg-white p-10 rounded-[2.5rem] border-2 border-[#E2E8F0] focus:border-[#0F766E] transition-all outline-none font-bold italic h-48 resize-none text-xl shadow-inner placeholder:text-gray-300"
          />
        </div>
     </div>

     <div className="flex gap-6">
       <button onClick={() => setStep && setStep(2)} className="w-24 h-24 bg-white rounded-[2rem] border-2 border-[#E2E8F0] flex items-center justify-center hover:bg-gray-50 text-gray-400">
         <ArrowLeft size={32} />
       </button>
        <button 
          onClick={() => {
            if (!formData.role) {
              setError?.("Select your background protocol to continue.");
              return;
            }
            if (formData.skills.length === 0) {
              setError?.("Tag at least one skill to initialize matches.");
              return;
            }
            setError?.(null);
            setStep?.(4);
          }}
          className="flex-1 bg-[#0F766E] text-white py-8 rounded-[2.5rem] font-black text-2xl shadow-2xl uppercase tracking-widest italic disabled:opacity-30 disabled:grayscale transition-all"
        >
          LAST STEP: PROOF <ArrowRight size={32} className="inline ml-2" />
        </button>
     </div>
  </div>
));
Step3Hustle.displayName = "Step3Hustle";

function OnboardingContent() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const searchParams = useSearchParams();
  const queryRole = searchParams.get('role');
  const [formData, setFormData] = useState<OnboardingData>({
    name: "", phone: "", email: "", dob: "", password: "", province: "", city: "", township: "", skills: [],
    userType: (queryRole === 'hustler' || queryRole === 'talent') ? 'talent' : (queryRole === 'boss' || queryRole === 'employer') ? 'employer' : "", 
    role: "",
    popia_consent: false
  });

  useEffect(() => {
    const savedData = localStorage.getItem("waymakers_onboarding_data");
    const savedStep = localStorage.getItem("waymakers_onboarding_step");
    if (savedData) { try { setFormData(JSON.parse(savedData)); } catch {}}
    if (savedStep) setStep(parseInt(savedStep) as Step);

    const supabase = createClient();
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: maker } = await (supabase as any).from('profiles').select('onboarded').eq('id', user.id).maybeSingle();
        if ((maker as any)?.onboarded) { router.push('/dashboard'); return; }
        setFormData(prev => ({ ...prev, name: prev.name || user.user_metadata?.full_name || "", email: prev.email || user.email || "" }));
      }
    };
    checkSession();
  }, [router]);

  useEffect(() => { localStorage.setItem("waymakers_onboarding_data", JSON.stringify(formData)); }, [formData]);
  useEffect(() => { localStorage.setItem("waymakers_onboarding_step", step.toString()); }, [step]);

  const saveProfile = async () => {
    setLoading(true); setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) { 
        setIsEmailSent(true); 
        return true; 
      }
      
      const userId = user.id;
      const isTalent = formData.userType === 'talent';
      const userRole: ProfileRole = (isTalent ? formData.role : 'employer') as ProfileRole;
      const finalTownship = formData.township === '_custom' && formData.customTownship ? formData.customTownship : formData.township;
      const locationString = `${finalTownship}, ${formData.city}, ${formData.province}`;
      
      let selfieUrl = null;
      if (formData.id_selfie && formData.id_selfie.startsWith('data:image')) {
        try {
          selfieUrl = await storageHub.uploadIdentitySelfie(formData.id_selfie, userId);
        } catch (uploadErr) {
          console.error("Selfie upload protocol failed:", uploadErr);
        }
      }

      await profilesHub.upsert({
        id: userId,
        name: formData.name || user.user_metadata?.full_name || "Anonymous",
        phone: formData.phone || null,
        location: locationString,
        province: formData.province || null,
        city: formData.city || null,
        township: finalTownship || null,
        trade: isTalent ? (formData.skills[0] || "General Hustler") : "Employer",
        skills: formData.skills.length > 0 ? formData.skills : null,
        role: userRole,
        bio: formData.bio || null,
        dob: formData.dob || null,
        gender: formData.gender || null,
        identity_verified: formData.identity_verified || false,
        id_selfie: selfieUrl,
        onboarded: true,
        updated_at: new Date().toISOString()
      });

      // 4. Log POPIA Consent to Audit Trail
      if (formData.popia_consent) {
        await (supabase.from('consent_logs') as any).insert({
          user_id: userId,
          purpose: 'onboarding_popia_consent',
          ip_address: 'client-side-vibe' // In a real app we'd get this from headers in an API route
        });
      }

      // 5. Log Beta KYC event if ID provided
      if (formData.sa_id_number) {
        await trackEvent('kyc_id_submitted', { userId, hashed_id: 'provided' }); // We don't store raw ID in analytics
      }

      if (isTalent) {
        const initialVideoUrl = sessionStorage.getItem("proof_video_url");
        if (initialVideoUrl) {
           await proofsHub.insert({ maker_id: userId, video_url: initialVideoUrl, title: "Initial Vibe Check", created_at: new Date().toISOString() });
           sessionStorage.removeItem("proof_video_url");
        }
      }
      trackEvent(ANALYTICS_EVENTS.VIBECHECK_PUBLISHED, { user_type: formData.userType, has_video: !!sessionStorage.getItem("proof_video_url") });
      
      // 5. Trigger AI Embedding Sync (Async/Non-blocking preferred)
      fetch("/api/ai/embed", { method: "POST", body: JSON.stringify({ profileId: userId }) }).catch(e => console.error("AI Sync Delayed:", e));

      router.refresh();
      return true;
    } catch (err: any) { 
      console.error("[saveProfile] Unexpected Error Content:", JSON.stringify(err, null, 2));
      console.error("[saveProfile] Error Details:", err.message, err.details, err.hint);
      setError(err.message || "Failed to finalize profile protocol."); 
      return false; 
    } finally { 
      setLoading(false); 
    }
  };

  const [hasVideo, setHasVideo] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  useEffect(() => { if (typeof window !== "undefined") setHasVideo(!!sessionStorage.getItem("proof_video_url")); }, [step]);

  return (
    <div className="min-h-screen bg-[#F0FDFA] text-[#0F172A] flex flex-col items-center justify-center p-6 relative overflow-hidden font-body">
      {/* Decorative Blurs */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#0F766E]/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-[#8B5CF6]/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        <header className="flex justify-between items-center mb-16">
           <Link href="/" className="flex items-center gap-4 group px-6 py-4 bg-white rounded-[2rem] border border-[#E2E8F0] shadow-sm hover:shadow-xl transition-all duration-500">
             <div className="w-12 h-12 rounded-2xl bg-white overflow-hidden flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
             <img src="/logo.png" alt="Shapa Logo" className="h-14 w-auto" crossOrigin="anonymous" />
             </div>
             <div className="flex flex-col">
                <span className="font-black text-2xl tracking-tighter italic font-display leading-none text-[#0F766E]">WayMakers.</span>
                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-400 italic">Onboarding Gateway</span>
             </div>
           </Link>
           <div className="text-[10px] font-black uppercase tracking-[0.4em] text-[#0F766E] bg-white px-8 py-4 rounded-full border border-[#E2E8F0] shadow-sm italic">
             Phase {step} <span className="text-gray-200 mx-2">|</span> 4
           </div>
        </header>

        {step > 0 && (
          <div className="mb-20 flex gap-4 px-2 scale-x-110">
             {[1, 2, 3, 4].map(s => (
                <div key={s} className={`h-2 flex-1 rounded-full transition-all duration-1000 ${step >= s ? "bg-[#0F766E] shadow-lg shadow-[#0F766E]/20" : "bg-white border border-[#E2E8F0]"}`} />
             ))}
          </div>
        )}

        {error && <div className="bg-red-50 text-red-500 p-8 rounded-[2rem] border-2 border-red-500/10 mb-12 text-sm font-black animate-shake italic uppercase tracking-widest text-center">⚠️ Protocol Alert: {error}</div>}

        {isEmailSent ? (
          <div className="text-center space-y-12 animate-in zoom-in-95 duration-1000">
            <div className="w-32 h-32 bg-[#F0FDFA] rounded-[3rem] flex items-center justify-center text-[#0F766E] mx-auto mb-12 border-2 border-[#0F766E]/10 shadow-2xl animate-pulse">
              <Mail size={56} />
            </div>
            <h1 className="text-6xl font-black mb-6 font-display italic uppercase tracking-tighter leading-tight">Confirmation <br/>Protocol Sent!</h1>
            <p className="text-gray-500 font-bold text-xl max-w-sm mx-auto italic">Confirm your access at <span className="text-[#0F766E] truncate block mt-2">{formData.email}</span></p>
            <div className="pt-12"><Link href="/login" className="bg-white px-12 py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest border-2 border-[#E2E8F0] hover:border-[#0F766E] transition-all italic">Return to Gateway</Link></div>
          </div>
        ) : (
          <div key={step} className="animate-in fade-in zoom-in-95 duration-700">
            {step === 0 && <Step0RoleSelection formData={formData} setFormData={setFormData} setStep={setStep} />}
            {step === 1 && <Step1Location formData={formData} setFormData={setFormData} setStep={setStep} loading={loading} setLoading={setLoading} setError={setError} />}
            {step === 2 && <Step2Identity formData={formData} setFormData={setFormData} setStep={setStep} loading={loading} setLoading={setLoading} setError={setError} />}
            {step === 3 && <Step3Hustle formData={formData} setFormData={setFormData} setStep={setStep} setError={setError} />}
            {step === 4 && (
              <div className="text-center space-y-12">
                 <div className="w-48 h-48 bg-white border-2 border-[#0F766E]/10 rounded-[4rem] flex items-center justify-center text-[#0F766E] mx-auto mb-16 shadow-[0_40px_100px_rgba(15,118,110,0.1)] relative">
                    <div className="absolute inset-2 border-4 border-dashed border-[#0F766E]/5 rounded-[3.5rem] animate-spin-slow"></div>
                    {hasVideo ? <CheckCircle2 size={100} className="animate-bounce" /> : <Video size={100} className="animate-pulse" />}
                 </div>
                 <h1 className="text-7xl font-black tracking-tighter mb-6 italic font-display uppercase leading-none">{hasVideo ? "Nailed It." : "The Proof."}</h1>
                 <p className="text-2xl text-gray-400 font-bold italic max-w-md mx-auto leading-relaxed mb-16">
                    {formData.userType === 'employer' ? "Your Boss profile is live. Access the Operations Hub now." : hasVideo ? "VibeCV ready for launch. Move to publish." : "Talent without proof is just a resume. Record your vibe to 10x your visibility."}
                 </p>
                 <div className="flex flex-col gap-8">
                    <button 
                       onClick={async () => {
                          if (loading) return;
                          const saved = await saveProfile();
                          if (saved) {
                             localStorage.removeItem("waymakers_onboarding_data");
                             localStorage.removeItem("waymakers_onboarding_step");
                             router.push(formData.userType === 'employer' ? "/employer/hub" : hasVideo ? "/dashboard" : "/talent/studio/record");
                          }
                       }}
                       className="w-full bg-[#0F766E] text-white py-10 rounded-[3rem] font-black text-3xl shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-6 uppercase tracking-widest italic"
                    >
                       {formData.userType === 'employer' ? <><Briefcase size={36} /> Access Ops Hub</> : hasVideo ? <><CheckCircle2 size={36} /> Publish My Grit</> : <><Play fill="white" size={36} /> Initialize Camera</>}
                    </button>
                    {!hasVideo && formData.userType !== 'employer' && (
                       <button onClick={() => setShowSkipModal(true)} className="text-[#0F766E] font-black uppercase tracking-[0.4em] text-[10px] italic underline underline-offset-8 decoration-2 opacity-50 hover:opacity-100 transition-all">Skip for now — Profile will be restricted</button>
                    )}
                 </div>
              </div>
            )}
          </div>
        )}

        {showSkipModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-white/40 backdrop-blur-3xl">
             <div className="w-full max-w-md bg-white border-2 border-[#E2E8F0] p-16 rounded-[4rem] shadow-[0_60px_120px_rgba(0,0,0,0.1)] animate-in fade-in zoom-in-95 duration-500 text-center">
                <div className="w-24 h-24 rounded-[2.5rem] bg-amber-50 flex items-center justify-center text-amber-500 mb-10 mx-auto shadow-inner"><ShieldCheck size={48} /></div>
                <h2 className="text-5xl font-black tracking-tighter mb-6 italic font-display uppercase leading-none">Wait Boss! <br/>Are You Sure?</h2>
                <p className="text-gray-400 font-bold text-lg mb-8 italic leading-relaxed">Profiles with Video Proof get <span className="text-[#0F766E]">5x more hires</span>. Skipping puts you at the bottom of the feed.</p>
                
                {error && (
                  <p className="bg-red-50 text-red-500 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest mb-8 animate-shake">
                    ⚠️ {error}
                  </p>
                )}

                <div className="space-y-6">
                   <button onClick={() => setShowSkipModal(false)} className="w-full bg-[#0F766E] text-white py-8 rounded-[2rem] font-black text-xl shadow-xl shadow-[#0F766E]/20 italic uppercase tracking-widest">RECORD PROTOCOL NOW</button>
                   <button onClick={async () => {
                      if (loading) return;
                      const saved = await saveProfile();
                      if (saved) {
                         localStorage.removeItem("waymakers_onboarding_data");
                         localStorage.removeItem("waymakers_onboarding_step");
                         setShowSkipModal(false);
                         router.push("/dashboard");
                      }
                   }} disabled={loading} className="text-gray-400 font-bold text-xs uppercase tracking-[0.4em] italic hover:text-[#0F766E] transition-all underline decoration-2 underline-offset-8">
                     {loading ? "Processing..." : "Skip anyway & Enter Dashboard"}
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F0FDFA] flex items-center justify-center"><Loader2 className="animate-spin text-[#0F766E]" size={48} /></div>}>
      <OnboardingContent />
    </Suspense>
  );
}

"use client";

import { useState, useEffect } from "react";
import { User, Bell, Shield, Smartphone, LogOut, ChevronRight, Loader2, Save } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { profilesHub } from "@/lib/supabase-helpers";
import { useRouter } from "next/navigation";
import { Database } from "@/lib/database.types";
import { toast } from "sonner";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Database['public']['Tables']['profiles']['Row'] | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(data);
    };
    fetchProfile();

    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab) setActiveTab(tab);
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const sections = [
    { id: "account", title: "Account Identity", icon: User, desc: "Bio, Profile Title, VibeCV Configuration" },
    { id: "payouts", title: "Payouts & Trust", icon: Shield, desc: "Stripe, PayFast, Verification Status" },
    { id: "privacy", title: "Privacy & Radar", icon: Shield, desc: "Visibility, Blocking, Location Settings" },
    { id: "alerts", title: "Notifications", icon: Bell, desc: "Gig Matches, Activity, System Communication" },
    { id: "device", title: "Device Settings", icon: Smartphone, desc: "Data Control, App Permissions" },
    { id: "popia", title: "POPIA Vault", icon: Shield, desc: "Data Portability, Legal Rights & Erasure" },
  ];

  const handleDownloadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileData, makerData, walletData] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('wallets').select('*').eq('user_id', user.id).maybeSingle(),
      ]);

      const exportData = {
        meta: { exported_at: new Date().toISOString(), system: "Future WayMakers Platform" },
        identity: profileData.data,
        maker_profile: makerData.data,
        financial: { wallet: walletData.data }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `waymakers-data-export-${user.id}.json`;
      a.click();
      
      toast.success("POPIA Export Successful! 🛡️ Details of your data have been downloaded.");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export data.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const isConfirmed = window.confirm("🚨 DANGER ZONE: This will permanently delete your identity. Proceed?");
    if (!isConfirmed) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from('profiles').delete().eq('id', user.id);
      if (error) throw error;
      handleLogout();
    } catch (err) {
      toast.error("Account Deletion Blocked 🛡️ You may have active contracts or escrow funds.");
    } finally {
      setLoading(false);
    }
  };    

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 relative z-10 pb-[calc(100px+env(safe-area-inset-bottom))]">
      
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-[#0F766E]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-[-10%] w-[50vw] h-[50vw] bg-[#8B5CF6]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="space-y-16 relative z-10 pt-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b-2 border-[#E2E8F0] pb-10">
          <div>
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black italic tracking-tighter mb-4 font-display uppercase leading-[0.85] text-[#0F172A]">Settings.</h1>
            <p className="text-gray-500 font-black uppercase tracking-[0.4em] text-[10px] italic">System Configuration</p>
          </div>
          {activeTab && (
            <button 
              onClick={() => setActiveTab(null)}
              className="text-[9px] font-black uppercase tracking-[0.4em] text-[#0F766E] hover:text-white transition-all bg-white hover:bg-[#0F766E] px-6 py-3 rounded-full border-2 border-[#E2E8F0] hover:border-[#0F766E] shadow-sm italic flex items-center"
            >
              &larr; Return to Root
            </button>
          )}
        </header>

        {!activeTab ? (
          <div className="grid grid-cols-1 gap-6">
            {sections.map((s) => (
              <button 
                key={s.id} 
                onClick={() => setActiveTab(s.id)}
                className="w-full bg-white p-8 sm:p-12 rounded-[3.5rem] flex items-center justify-between group hover:-translate-y-1 transition-all duration-300 border-2 border-white hover:border-[#E2E8F0] shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_60px_rgba(15,118,110,0.05)] cursor-pointer"
              >
                <div className="flex items-center gap-6 sm:gap-10 text-left">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[2rem] bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#F0FDFA] group-hover:text-[#0F766E] border-2 border-[#E2E8F0] group-hover:border-[#0F766E]/20 transition-colors shadow-sm shrink-0">
                    <s.icon size={28} />
                  </div>
                  <div>
                    <h4 className="text-2xl sm:text-3xl font-black italic font-display uppercase tracking-tight mb-2 group-hover:text-[#0F766E] transition-colors">{s.title}</h4>
                    <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] italic group-hover:text-gray-500 transition-colors">{s.desc}</p>
                  </div>
                </div>
                <ChevronRight size={28} className="text-gray-300 group-hover:text-[#0F766E] transition-all transform group-hover:translate-x-2 shrink-0 hidden sm:block" />
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-white p-10 sm:p-16 rounded-[4rem] border-2 border-[#E2E8F0] shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden">
             
             <div className="mb-12">
               <span className="text-[9px] font-black tracking-[0.4em] text-[#0F766E] uppercase bg-[#F0FDFA] px-6 py-2.5 rounded-full border border-[#0F766E]/20 italic shadow-sm">
                 {activeTab.toUpperCase()} MODULE LOADED
               </span>
             </div>

             {activeTab === 'account' && (
                 <div className="space-y-12">
                   <h3 className="text-4xl sm:text-5xl font-black italic tracking-tighter font-display mb-8 uppercase text-[#0F172A]">Identity Verification</h3>
                   <div className="space-y-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 italic ml-4">Master Display Profile</label>
                        <input 
                          type="text" 
                          key={profile?.name || "name"}
                          defaultValue={profile?.name || ""} 
                          id="settings-name"
                          className="w-full bg-gray-50 p-6 sm:p-8 rounded-[2rem] border-2 border-[#E2E8F0] focus:border-[#0F766E] focus:bg-white outline-none font-bold text-lg sm:text-xl italic text-gray-800 transition-colors shadow-inner"
                          placeholder="Your professional name"
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 italic ml-4">Operations Bio</label>
                        <textarea 
                          key={profile?.bio || "bio"}
                          defaultValue={profile?.bio || ""}
                          id="settings-bio"
                          className="w-full bg-gray-50 p-6 sm:p-8 rounded-[2rem] border-2 border-[#E2E8F0] focus:border-[#0F766E] focus:bg-white outline-none font-bold text-lg sm:text-xl italic resize-none h-40 text-gray-800 transition-colors shadow-inner"
                          placeholder="Outline your expertise and operational vibe..."
                        />
                      </div>
                   </div>
                   <button 
                     disabled={loading}
                     onClick={async () => {
                       setLoading(true);
                       const name = (document.getElementById('settings-name') as HTMLInputElement).value;
                       const bio = (document.getElementById('settings-bio') as HTMLTextAreaElement).value;
                       try {
                         const { data: { user } } = await supabase.auth.getUser();
                         if (!user) return;
                         
                         await profilesHub.update(user.id, { name, bio, updated_at: new Date().toISOString() });
                         
                         if (profile) setProfile({ ...profile, name, bio });
                         toast.success("Configuration Synchronized. Platform identity updated.");
                         
                         // Trigger AI Embedding Sync (Non-blocking)
                         fetch("/api/ai/embed", { 
                            method: "POST", 
                            body: JSON.stringify({ profileId: user.id }),
                            headers: { "Content-Type": "application/json" }
                         }).catch(e => console.error("AI Sync Delayed:", e));

                       } catch (err) {
                         toast.error("Sync failed. Check connection.");
                       } finally {
                         setLoading(false);
                       }
                     }}
                     className="w-full bg-[#0F766E] text-white py-6 sm:py-8 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] shadow-xl shadow-[#0F766E]/20 flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all italic border-b-4 border-black/10 disabled:opacity-50"
                   >
                     {loading ? <Loader2 className="animate-spin" size={20} /> : <>Save Configuration <Save size={18} /></>}
                   </button>
                 </div>
             )}

             {activeTab === 'payouts' && (
               <div className="space-y-12">
                 <div className="flex justify-between items-end">
                    <h3 className="text-5xl font-black italic tracking-tighter font-display uppercase text-[#0F172A]">Payout Deck</h3>
                    {profile?.verification_paid_at ? (
                      <span className="bg-[#13EC6A]/10 text-[#0F766E] font-black text-[9px] uppercase tracking-widest px-4 py-2 rounded-full border border-[#13EC6A]/30 italic">✓ Verified</span>
                    ) : (
                      <span className="bg-amber-500/10 text-amber-600 font-black text-[9px] uppercase tracking-widest px-4 py-2 rounded-full border border-amber-500/30 italic">! Pending Verification</span>
                    )}
                 </div>

                 <div className="grid grid-cols-1 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 italic ml-4">Stripe Account ID (International)</label>
                      <input 
                        type="text" 
                        key={profile?.stripe_account_id}
                        defaultValue={profile?.stripe_account_id || ""} 
                        id="stripe-id"
                        className="w-full bg-gray-50 p-6 rounded-[2rem] border-2 border-[#E2E8F0] focus:border-[#0F766E] outline-none font-bold italic shadow-inner"
                        placeholder="acct_..."
                      />
                    </div>
                 </div>

                 <div className="p-8 bg-gray-50 rounded-[2.5rem] border-2 border-[#E2E8F0] space-y-4">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest italic">Domestic Billing Protocol</p>
                    <p className="text-sm font-medium text-gray-600 italic">South African settlements are processed via PayFast. No manual configuration is required for ZAR transactions.</p>
                 </div>

                 <button 
                   disabled={loading}
                   onClick={async () => {
                     setLoading(true);
                     const stripeId = (document.getElementById('stripe-id') as HTMLInputElement).value;
                     try {
                        const { data: { user } } = await supabase.auth.getUser();
                        if (!user) return;
                        await profilesHub.update(user.id, { 
                          stripe_account_id: stripeId || null, 
                          updated_at: new Date().toISOString() 
                        });
                        if (profile) setProfile({ ...profile, stripe_account_id: stripeId });
                        toast.info("Financial Identity Synchronized.");
                     } catch (err) {
                        toast.error("Sync failed.");
                     } finally {
                        setLoading(false);
                     }
                   }}
                   className="w-full bg-[#0F766E] text-white py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] shadow-xl flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all italic"
                 >
                   {loading ? <Loader2 className="animate-spin" size={16} /> : <>Save Payout Config <Save size={16} /></>}
                 </button>
               </div>
             )}

             {activeTab === 'privacy' && (
                <div className="space-y-12">
                  <h3 className="text-5xl font-black italic tracking-tighter font-display mb-10 uppercase text-[#0F172A]">Radar Control</h3>
                  <div className="space-y-6">
                     <div className="flex items-center justify-between p-8 bg-gray-50 rounded-[2.5rem] border-2 border-[#E2E8F0] hover:border-[#0F766E]/40 transition-colors shadow-sm">
                       <div>
                         <p className="font-black text-xl sm:text-2xl uppercase italic font-display text-gray-800">Public Visibility</p>
                         <p className="text-[9px] sm:text-[10px] uppercase text-gray-400 font-bold tracking-[0.2em] italic mt-1">Appear in Discovery for new gigs</p>
                       </div>
                       <div className="w-14 h-8 bg-[#0F766E] rounded-full relative p-1.5 cursor-pointer shadow-sm border border-[#0F766E]/20">
                         <div className="w-5 h-5 bg-white rounded-full absolute right-1.5 shadow-sm"></div>
                       </div>
                     </div>
                     <div className="flex items-center justify-between p-8 bg-gray-50 rounded-[2.5rem] border-2 border-[#E2E8F0] hover:border-[#0F766E]/40 transition-colors shadow-sm">
                       <div>
                         <p className="font-black text-xl sm:text-2xl uppercase italic font-display text-gray-800">Incognito Protocol</p>
                         <p className="text-[9px] sm:text-[10px] uppercase text-gray-400 font-bold tracking-[0.2em] italic mt-1">Hide from public searches</p>
                       </div>
                       <div className="w-14 h-8 bg-gray-200 rounded-full relative p-1.5 cursor-pointer border border-[#E2E8F0]">
                         <div className="w-5 h-5 bg-white rounded-full absolute left-1.5 shadow-sm border border-gray-100"></div>
                       </div>
                     </div>
                  </div>
                </div>
              )}

             {activeTab === 'alerts' && (
               <div className="space-y-12">
                 <h3 className="text-5xl font-black italic tracking-tighter font-display mb-10 uppercase text-[#0F172A]">Comms Deck</h3>
                 <div className="space-y-6">
                    {['Gig Matches', 'Messages', 'Platform Broadcasts', 'System Updates'].map(item => (
                      <div key={item} className="flex items-center justify-between p-8 bg-white rounded-[2.5rem] border-2 border-[#E2E8F0] hover:border-[#0F766E]/40 transition-colors shadow-sm">
                        <p className="font-black text-xl uppercase italic font-display text-gray-700">{item}</p>
                        <div className="w-14 h-8 bg-[#0F766E] rounded-full relative p-1.5 cursor-pointer shadow-sm">
                          <div className="w-5 h-5 bg-white rounded-full absolute right-1.5 shadow-sm"></div>
                        </div>
                      </div>
                    ))}
                 </div>
               </div>
             )}

             {activeTab === 'device' && (
                <div className="space-y-12">
                  <h3 className="text-5xl font-black italic tracking-tighter font-display mb-10 uppercase text-[#0F172A]">Optimization</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-8 bg-white rounded-[2.5rem] border-2 border-[#E2E8F0] hover:border-[#0F766E]/40 transition-all shadow-sm">
                      <div>
                        <p className="font-black text-xl uppercase italic font-display text-gray-800">Data-Light Priority</p>
                        <p className="text-[9px] uppercase text-gray-500 font-bold tracking-[0.2em] italic mt-1.5">Zero-rated compliant connection</p>
                      </div>
                      <div className="w-14 h-8 bg-[#0F766E] rounded-full relative p-1.5 cursor-pointer shadow-sm">
                        <div className="w-5 h-5 bg-white rounded-full absolute right-1.5 shadow-sm"></div>
                      </div>
                    </div>
                  </div>
                </div>
             )}

             {activeTab === 'popia' && (
               <div className="space-y-12">
                 <h3 className="text-5xl font-black italic tracking-tighter font-display mb-8 uppercase text-[#8B5CF6]">POPIA Vault</h3>
                 <p className="text-gray-500 font-bold leading-relaxed italic text-sm sm:text-base border-l-4 border-[#8B5CF6] pl-6 bg-[#8B5CF6]/5 py-4 rounded-r-xl">Under South African law, you own your data. Configure data requests or initiate total system erasure.</p>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <button 
                     onClick={handleDownloadData}
                     disabled={loading}
                     className="bg-white p-8 sm:p-10 rounded-[2.5rem] border-2 border-[#E2E8F0] hover:border-[#8B5CF6] transition-all text-left group shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50"
                   >
                     <p className="text-2xl sm:text-3xl font-black italic text-[#8B5CF6] mb-3 uppercase font-display">Data Export</p>
                     <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.3em] italic">Generate Portfolio.json</p>
                   </button>
                   <button 
                     onClick={handleDeleteAccount}
                     disabled={loading}
                     className="bg-red-50 p-8 sm:p-10 rounded-[2.5rem] border-2 border-red-100 hover:border-red-400 transition-all text-left group shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50"
                   >
                     <p className="text-2xl sm:text-3xl font-black italic text-red-500 mb-3 uppercase font-display">Erase Identity</p>
                     <p className="text-[9px] text-red-400 font-black uppercase tracking-[0.3em] italic">Permanent System Deletion</p>
                   </button>
                 </div>
               </div>
             )}
          </div>
        )}

        <section className="pt-16 pb-8 space-y-8">
           <button 
             onClick={handleLogout}
             className="w-full py-8 bg-white border-2 border-[#E2E8F0] hover:border-red-300 rounded-[2.5rem] flex items-center justify-center gap-4 text-gray-500 hover:text-red-500 transition-all font-black uppercase tracking-[0.4em] text-[10px] italic shadow-sm"
           >
              <LogOut size={18} /> Disconnect Session
           </button>
           <p className="text-center text-[8px] sm:text-[9px] font-black uppercase tracking-[0.5em] text-gray-400 italic">Future WayMakers Platform v2.0 // Secured Protocol</p>
        </section>
      </div>
    </div>
  );
}

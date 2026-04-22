"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Briefcase, CheckCircle2, Clock, Check, Inbox, Search } from "lucide-react";
import Link from "next/link";

interface Contract {
  id: string;
  employer_name: string;
  title: string;
  price: number;
  status: "pending" | "active" | "completed" | "disputed";
  created_at: string;
  duration: string;
}

export default function TalentGigBoard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");

  useEffect(() => {
    async function fetchContracts() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }

      const { data, error } = await supabase
        .from("contracts")
        .select("id, title, price, status, created_at, employer_id")
        .eq("maker_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[TalentGigBoard] Failed to load contracts:", error.message);
      } else {
        // Normalize to UI shape — duration is not stored, so derive from dates
        const normalized = (data || []).map((c: any) => ({
          id: c.id,
          employer_name: c.employer_name || "Employer",
          title: c.title || "Gig Assignment",
          price: c.price || 0,
          status: c.status,
          created_at: c.created_at,
          duration: "See workspace",
        }));
        setContracts(normalized);
      }
      setLoading(false);
    }
    fetchContracts();
  }, [router]);


  const activeContracts = contracts.filter(c => c.status === "active" || c.status === "pending");
  const completedContracts = contracts.filter(c => c.status === "completed");

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <Briefcase size={40} className="text-[#13EC6A] mb-4" />
        <p className="font-black italic tracking-widest text-[#13EC6A]">SYNCING GIGS...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 pb-32 animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter font-display uppercase">My <span className="text-[#13EC6A]">Gigs.</span></h1>
          <p className="text-gray-400 font-bold mt-2 uppercase tracking-widest text-[10px] md:text-xs">Manage your active contracts and escrow payouts.</p>
        </div>
        <div className="bg-[#13EC6A]/10 border border-[#13EC6A]/20 px-6 py-4 rounded-2xl flex items-center gap-4">
           <div className="w-12 h-12 bg-[#13EC6A] text-[#052210] rounded-xl flex items-center justify-center font-black">
              {activeContracts.length}
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#13EC6A] mb-1">Active Escrow</p>
              <p className="text-xl font-black font-mono">
                R{activeContracts.reduce((sum, c) => sum + c.price, 0).toLocaleString()}
              </p>
           </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-4 border-b border-white/10 pb-6 mb-10 overflow-x-auto hide-scrollbar">
         <button 
           onClick={() => setActiveTab("active")}
           className={`text-sm md:text-2xl font-black italic uppercase tracking-tighter transition-all whitespace-nowrap px-6 py-3 rounded-2xl ${
             activeTab === "active" ? "bg-white text-black shadow-premium" : "text-gray-500 hover:text-white"
           }`}
         >
            Active & Pending ({activeContracts.length})
         </button>
         <button 
           onClick={() => setActiveTab("completed")}
           className={`text-sm md:text-2xl font-black italic uppercase tracking-tighter transition-all whitespace-nowrap px-6 py-3 rounded-2xl ${
             activeTab === "completed" ? "bg-white text-black shadow-premium" : "text-gray-500 hover:text-white"
           }`}
         >
            Completed ({completedContracts.length})
         </button>
      </div>

      {/* Contract Boards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {(activeTab === "active" ? activeContracts : completedContracts).length > 0 ? (
            (activeTab === "active" ? activeContracts : completedContracts).map(contract => (
              <div key={contract.id} className={`glass p-8 rounded-[3rem] border transition-all hover:scale-[1.02] cursor-pointer shadow-premium ${contract.status === "active" ? "border-[#13EC6A]/30" : "border-white/5 hover:border-white/20"}`}>
                 <Link href={`/contracts/${contract.id}`} className="block h-full">
                    <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-6">
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#13EC6A] mb-2">{contract.id}</p>
                          <h3 className="text-2xl font-black italic font-display uppercase tracking-tight line-clamp-1">{contract.title}</h3>
                          <p className="text-xs font-bold text-gray-400 mt-2">Employer: <span className="text-white">{contract.employer_name}</span></p>
                       </div>
                       <div className="text-right shrink-0">
                          <p className="text-xl font-black font-mono">R{contract.price}</p>
                          <p className={`text-[9px] font-black uppercase tracking-widest mt-2 px-3 py-1 inline-block rounded-full border ${
                            contract.status === "active" ? "bg-[#13EC6A]/10 text-[#13EC6A] border-[#13EC6A]/30" :
                            contract.status === "completed" ? "bg-blue-500/10 text-blue-400 border-blue-500/30" :
                            "bg-amber-500/10 text-amber-500 border-amber-500/30"
                          }`}>
                            {contract.status === "active" ? "IN PROGRESS" : contract.status.toUpperCase()}
                          </p>
                       </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                       <div className="flex items-center gap-2">
                          <Clock size={14} /> <span>Due: {contract.duration}</span>
                       </div>
                       <div className="flex items-center gap-2 text-white">
                          <span>View Workspace</span> <Check size={14} className={contract.status === "completed" ? "text-blue-500" : "text-[#13EC6A]"} />
                       </div>
                    </div>
                 </Link>
              </div>
            ))
         ) : (
            <div className="col-span-full py-24 glass rounded-[3rem] border border-dashed border-white/10 flex flex-col items-center justify-center text-center px-4 opacity-50">
               <Inbox size={48} className="mb-6 text-gray-500" />
               <p className="text-2xl font-black uppercase italic tracking-tighter text-white mb-2">No Contracts Found</p>
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">When clients hire you, gigs will appear here.</p>
            </div>
         )}
      </div>

    </div>
  );
}

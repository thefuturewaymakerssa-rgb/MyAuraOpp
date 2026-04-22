"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  Download, 
  Filter, 
  CreditCard,
  ShieldCheck,
  TrendingUp,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

export default function MakerWallet() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/onboarding");
          return;
        }

        // Search for wallet
        const { data: walletData, error: walletError } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (walletError && walletError.code !== "PGRST116") throw walletError;
        
        if (walletData) {
          setWallet(walletData);
          const { data: txData } = await supabase
            .from("transactions")
            .select("*")
            .eq("wallet_id", (walletData as any)?.id)
            .order("created_at", { ascending: false });
          setTransactions(txData || []);
        } else {
           // For demo, if no wallet exists, create a dummy one or show zero
           setWallet({ balance: 0.00, pending_balance: 0.00, currency: "ZAR" });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  if (loading) return (
    <div className="h-screen bg-[#F0FDFA] flex items-center justify-center text-[#0F766E]">
      <Sparkles className="animate-pulse" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F0FDFA] text-[#0F172A] font-sans p-6 sm:p-12 lg:p-24 relative overflow-hidden selection:bg-[#0F766E]/20 mb-20 lg:mb-0">
      
      {/* Immersive Background Blur */}
      <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-[#0F766E]/5 rounded-full blur-[120px] pointer-events-none" />

      <main className="max-w-5xl mx-auto space-y-16 relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-2 border-[#E2E8F0] pb-12 gap-8">
           <div>
              <p className="text-[#0F766E] font-black text-[10px] uppercase tracking-[0.5em] mb-6 italic bg-white shadow-sm px-6 py-2.5 rounded-full border border-[#E2E8F0] inline-block">Financial Hub Protocol</p>
              <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black italic tracking-tighter mb-4 font-display uppercase leading-[0.85] text-[#0F172A]">My Wallet.</h1>
              <p className="text-gray-500 font-bold max-w-md text-lg sm:text-xl italic leading-relaxed">Securely manage your earnings and sync every gig payment with professional precision.</p>
           </div>
           <button className="bg-white hover:bg-[#F0FDFA] px-8 py-5 rounded-[2rem] border-2 border-[#E2E8F0] hover:border-[#0F766E]/40 text-[#0F172A] text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-4 transition-all italic shadow-sm hover:shadow-md">
              <Download size={20} className="text-[#0F766E]" /> Statement Export
           </button>
        </header>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 bg-gradient-to-br from-[#0F766E] to-teal-800 p-12 sm:p-16 rounded-[3.5rem] text-white relative overflow-hidden shadow-[0_20px_60px_rgba(15,118,110,0.3)] border-b-8 border-black/10 group">
              <div className="absolute top-0 right-0 p-12 lg:p-16 transform rotate-6 opacity-[0.05] transition-transform group-hover:rotate-12 duration-1000">
                 <Wallet size={300} />
              </div>
              <p className="font-black text-[9px] sm:text-[10px] text-white/70 uppercase tracking-[0.4em] mb-8 italic">Available Operation Balance</p>
              <h2 className="text-7xl sm:text-8xl lg:text-9xl font-black tracking-tighter italic mb-12 font-display leading-[0.85] drop-shadow-md">R {wallet?.balance?.toLocaleString() || "0.00"}</h2>
              <button className="w-full bg-white text-[#0F766E] font-black py-6 sm:py-8 rounded-[2rem] text-[10px] sm:text-[11px] uppercase tracking-[0.4em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl italic border-b-4 border-gray-200">
                 Execute Transfer Protocol
              </button>
           </div>

           <div className="bg-white p-10 sm:p-14 rounded-[3.5rem] border-2 border-[#E2E8F0] flex flex-col justify-between shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] text-[#0F172A] group-hover:opacity-[0.05] transition-opacity">
                <Clock size={160} />
              </div>
              <div>
                 <p className="text-gray-400 font-black text-[9px] sm:text-[10px] uppercase tracking-[0.4em] mb-6 italic">In Secure Escrow</p>
                 <h2 className="text-5xl sm:text-6xl font-black tracking-tighter italic text-[#0F172A] font-display leading-[0.85]">R {wallet?.pending_balance?.toLocaleString() || "0.00"}</h2>
              </div>
              <div className="mt-12 flex items-center gap-4 text-[#0F766E] bg-[#F0FDFA] p-4 rounded-[1.5rem] border border-[#0F766E]/10">
                 <div className="w-3 h-3 rounded-full bg-[#0F766E] animate-pulse shadow-sm flex-shrink-0" />
                 <p className="text-[9px] font-black uppercase tracking-[0.2em] italic">Syncing with Escrow Chain</p>
              </div>
           </div>
        </div>

        {/* Transactions Section */}
        <section className="space-y-10">
           <div className="flex justify-between items-end px-4">
              <h3 className="text-4xl sm:text-5xl font-black italic tracking-tighter font-display uppercase text-[#0F172A]">Ledger Logs</h3>
              <div className="flex gap-4">
                 <button className="w-12 h-12 bg-white rounded-[1.2rem] border-2 border-[#E2E8F0] text-gray-400 hover:text-[#0F766E] hover:border-[#0F766E]/30 transition-all flex items-center justify-center shadow-sm">
                    <Filter size={20} />
                 </button>
              </div>
           </div>

           <div className="space-y-6">
              {transactions.length > 0 ? (
                transactions.map((tx: any) => (
                   <div key={tx.id} className="bg-white p-8 sm:p-10 rounded-[2.5rem] border-2 border-[#E2E8F0] flex items-center justify-between group hover:border-[#0F766E]/40 hover:shadow-md transition-all duration-300 shadow-sm">
                      <div className="flex items-center gap-6 sm:gap-10">
                         <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] flex items-center justify-center transition-all flex-shrink-0 ${tx.type === 'credit' ? 'bg-[#F0FDFA] text-[#0F766E] border border-[#0F766E]/10' : 'bg-red-50 text-red-500 border border-red-100'}`}>
                            {tx.type === 'credit' ? <ArrowDownLeft size={28} /> : <ArrowUpRight size={28} />}
                         </div>
                         <div className="min-w-0">
                            <p className="font-black text-xl sm:text-2xl leading-tight italic uppercase font-display text-gray-800 truncate">{tx.description}</p>
                            <p className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mt-2 italic flex items-center gap-2">
                               <Clock size={10} /> {new Date(tx.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                         </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                         <p className={`text-2xl sm:text-3xl font-black italic font-display ${tx.type === 'credit' ? 'text-[#0F766E]' : 'text-[#0F172A]'}`}>
                            {tx.type === 'credit' ? '+' : '-'} R {tx.amount.toLocaleString()}
                         </p>
                         <p className={`text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] mt-2 italic ${tx.status === 'completed' ? 'text-[#0F766E]' : 'text-gray-400'}`}>
                           {tx.status}
                         </p>
                      </div>
                   </div>
                ))
              ) : (
                <div className="text-center py-24 sm:py-32 bg-white rounded-[3.5rem] border-4 border-dashed border-[#E2E8F0] group shadow-sm">
                   <div className="w-20 h-20 rounded-[2rem] bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300 mx-auto mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all">
                      <ArrowUpRight size={40} />
                   </div>
                   <h4 className="text-2xl sm:text-3xl font-black text-gray-400 italic mb-4 uppercase font-display">No Digital Footprint.</h4>
                   <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em] italic">Commence operations to log your first transaction.</p>
                </div>
              )}
           </div>
        </section>

        {/* Security / FAQ */}
        <footer className="mt-32 grid grid-cols-1 md:grid-cols-2 gap-8 p-10 sm:p-14 bg-white rounded-[4rem] border-2 border-[#E2E8F0] relative overflow-hidden shadow-sm">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0F766E]/20 to-transparent" />
           <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
              <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-50 flex items-center justify-center text-indigo-500 flex-shrink-0 border border-indigo-100 shadow-sm">
                 <ShieldCheck size={28} />
              </div>
              <div className="space-y-3">
                 <h5 className="font-black text-[10px] uppercase tracking-[0.4em] text-[#0F172A] italic">Escrow Protected</h5>
                 <p className="text-xs sm:text-sm text-gray-500 font-bold leading-relaxed italic">All payments are locked in secure digital escrow until project protocol completion. Fully compliant with SA standards.</p>
              </div>
           </div>
           <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
              <div className="w-16 h-16 rounded-[1.5rem] bg-[#F0FDFA] flex items-center justify-center text-[#0F766E] flex-shrink-0 border border-[#0F766E]/10 shadow-sm">
                 <CreditCard size={28} />
              </div>
              <div className="space-y-3">
                 <h5 className="font-black text-[10px] uppercase tracking-[0.4em] text-[#0F172A] italic">Instant Pay Protocol</h5>
                 <p className="text-xs sm:text-sm text-gray-500 font-bold leading-relaxed italic">Once verified, withdrawals to major South African clearing banks are processed via the WayMakers routing engine.</p>
              </div>
           </div>
        </footer>
      </main>
    </div>
  );
}

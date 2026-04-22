"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { contractsHub, notificationsHub } from "@/lib/supabase-helpers";
import {
  Zap, 
  User,
  DollarSign,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  FileText
} from "lucide-react";
import Link from "next/link";

type MakerProfile = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  trade: string | null;
  hourly_rate: number | null;
  reliability_score: number | null;
  is_verified: boolean | null;
};

export default function HireFlowPage({ params }: { params: Promise<{ makerId: string }> }) {
  const resolvedParams = use(params);
  const makerId = resolvedParams.makerId;
  const router = useRouter();
  const supabase = createClient();

  const [maker, setMaker] = useState<MakerProfile | null>(null);
  const [employer, setEmployer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [makerRes, employerRes] = await Promise.all([
        (supabase.from('profiles').select('id, name, avatar_url, trade, hourly_rate, reliability_score, is_verified').eq('id', makerId).single() as any),
        (supabase.from('profiles').select('id, role').eq('id', user.id).single() as any)
      ]);

      if (makerRes.error || !makerRes.data) {
        setError("Maker profile not found.");
        setLoading(false);
        return;
      }

      if (employerRes.data?.role !== 'employer') {
        router.push("/talent/dashboard");
        return;
      }

      setMaker(makerRes.data as MakerProfile);
      setEmployer(employerRes.data);
      // Pre-fill price if maker has a rate
      if ((makerRes.data as any).hourly_rate) {
        setPrice(String((makerRes.data as any).hourly_rate));
      }
      setLoading(false);
    }
    load();
  }, [makerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maker || !employer || !title || !price) return;
    setSubmitting(true);
    setError(null);
    try {
      const contract = await contractsHub.insert({
        employer_id: employer.id,
        maker_id: maker.id,
        title,
        description,
        price: parseFloat(price),
        status: 'active',
        escrow_funded: false,
      }, supabase);

      // Notify maker
      await notificationsHub.insert({
        user_id: maker.id,
        message: `💼 New Contract Offer: "${title}" from an employer. Check your contracts to accept or discuss.`,
        type: 'contract_update'
      }, supabase);

      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0D110F] flex items-center justify-center">
      <Loader2 className="animate-spin text-[#8B5CF6]" size={48} />
    </div>
  );

  if (done) return (
    <div className="min-h-screen bg-[#0D110F] text-white flex flex-col items-center justify-center px-6 font-body">
      <div className="w-28 h-28 bg-[#8B5CF6]/10 rounded-[3rem] flex items-center justify-center text-[#8B5CF6] mb-10 border border-[#8B5CF6]/20">
        <CheckCircle2 size={64} />
      </div>
      <h1 className="text-6xl font-black italic tracking-tighter font-display mb-4 text-center">Contract Sent.</h1>
      <p className="text-gray-400 font-bold text-center max-w-sm mb-12 leading-relaxed">
        {maker?.name} will receive a notification about your offer. You can track it in your contracts dashboard.
      </p>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Link href="/employer/contracts" className="bg-[#8B5CF6] text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] text-center shadow-xl">
          View Contracts
        </Link>
        <Link href="/employer/hub" className="text-gray-500 font-black uppercase tracking-[0.3em] text-[10px] text-center hover:text-white transition-colors">
          Back to Hub
        </Link>
      </div>
    </div>
  );

  if (error && !maker) return (
    <div className="min-h-screen bg-[#0D110F] text-white flex flex-col items-center justify-center p-8 gap-6">
      <AlertCircle size={56} className="text-red-400" />
      <p className="font-black text-xl italic">{error}</p>
      <Link href="/employer/hub" className="text-[#8B5CF6] font-black text-xs uppercase tracking-widest underline">← Back to Hub</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0D110F] text-white font-body pb-40">
      {/* Header */}
      <header className="px-6 py-8 border-b border-white/5">
        <Link href={`/u/${makerId}`} className="flex items-center gap-3 text-gray-500 hover:text-white transition-colors group mb-6">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Back to Profile</span>
        </Link>
        <h1 className="text-4xl font-black italic tracking-tighter font-display">Hire <span className="text-[#8B5CF6]">{maker?.name?.split(' ')[0]}</span></h1>
        <p className="text-gray-500 text-sm font-bold mt-1">Create a contract offer — they&apos;ll be able to accept or negotiate.</p>
      </header>

      <div className="px-6 py-8 max-w-2xl mx-auto">
        {/* Maker Card */}
        <div className="bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded-3xl p-6 mb-8 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
            {maker?.avatar_url ? (
              <img src={maker.avatar_url} alt={maker.name || ''} className="w-full h-full object-cover" crossOrigin="anonymous" />
            ) : (
              <User size={28} className="text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-black italic text-xl tracking-tight truncate">{maker?.name}</p>
              {maker?.is_verified && <ShieldCheck size={16} className="text-[#13EC6A] flex-shrink-0" />}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#8B5CF6]">{maker?.trade || 'Creative'}</p>
          </div>
          {maker?.hourly_rate && (
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-black italic tracking-tighter font-display text-[#8B5CF6]">R{maker.hourly_rate}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-600">/hr rate</p>
            </div>
          )}
        </div>

        {/* Contract Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">
              Contract Title <span className="text-[#8B5CF6]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Social Media Content Package - May"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-[#8B5CF6]/60 rounded-2xl px-5 py-4 text-sm font-bold transition-colors outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">
              Scope of Work
            </label>
            <textarea
              placeholder="Describe the deliverables, timeline, and any specific requirements..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={5}
              className="w-full bg-white/5 border border-white/10 focus:border-[#8B5CF6]/60 rounded-2xl px-5 py-4 text-sm font-bold transition-colors outline-none resize-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">
              Total Offer (ZAR) <span className="text-[#8B5CF6]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-lg text-gray-500">R</span>
              <input
                type="number"
                required
                min="50"
                step="50"
                placeholder="1500"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full bg-white/5 border border-white/10 focus:border-[#8B5CF6]/60 rounded-2xl pl-10 pr-5 py-4 text-sm font-bold transition-colors outline-none"
              />
            </div>
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mt-2 flex items-center gap-1">
              <ShieldCheck size={10} className="text-[#13EC6A]" /> Funds held in escrow until work is approved
            </p>
          </div>

          {/* Platform fee note */}
          {price && parseFloat(price) > 0 && (
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-start gap-3">
              <FileText size={16} className="text-gray-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Fee Breakdown</p>
                <p className="text-xs font-bold text-gray-400">
                  Platform fee (10%): <span className="text-white">R {(parseFloat(price) * 0.10).toFixed(2)}</span>
                </p>
                <p className="text-xs font-bold text-gray-400">
                  Maker receives: <span className="text-[#13EC6A]">R {(parseFloat(price) * 0.90).toFixed(2)}</span>
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400 text-sm font-bold flex items-center gap-3">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !title || !price}
            className="w-full bg-[#8B5CF6] text-white font-black text-base py-6 rounded-[2rem] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-[#8B5CF6]/20 disabled:opacity-50 disabled:scale-100 uppercase tracking-widest"
          >
            {submitting ? <Loader2 className="animate-spin" size={24} /> : <><Zap size={24} /> Send Contract Offer</>}
          </button>
        </form>
      </div>
    </div>
  );
}

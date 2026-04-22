"use client";

import { useState, useEffect } from "react";
import { Video, Plus, Play, Trash2, Eye, Loader2, Upload, Film } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface Proof {
  id: string;
  title: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  created_at: string | null;
}

export default function MyVideosPage() {
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProofs() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error } = await supabase
        .from("proofs")
        .select("id, title, video_url, thumbnail_url, created_at")
        .eq("maker_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to load your proofs.");
      } else {
        setProofs(data || []);
      }
      setLoading(false);
    }
    fetchProofs();
  }, []);

  const handleDelete = async (proofId: string) => {
    setDeletingId(proofId);
    const supabase = createClient();
    const { error } = await supabase.from("proofs").delete().eq("id", proofId);
    if (error) {
      toast.error("Could not remove proof. Try again.");
    } else {
      setProofs(prev => prev.filter(p => p.id !== proofId));
      toast.success("Proof removed from your portfolio.");
    }
    setDeletingId(null);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-[#13EC6A]" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black mb-4 tracking-tighter italic font-display uppercase">
            My Video <span className="text-[#13EC6A]">Proof.</span>
          </h1>
          <p className="text-gray-500 font-bold uppercase tracking-[0.4em] text-[10px]">
            {proofs.length} clip{proofs.length !== 1 ? "s" : ""} in your portfolio
          </p>
        </div>
        <Link
          href="/talent/studio/record"
          className="px-8 py-5 bg-[#13EC6A] text-[#052210] font-black rounded-2xl flex items-center gap-3 hover:scale-110 transition-all shadow-glow uppercase tracking-widest text-[10px] italic"
        >
          <Plus size={20} /> Record New Clip
        </Link>
      </header>

      {proofs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center border-4 border-dashed border-white/5 rounded-[3rem] gap-8">
          <div className="w-24 h-24 rounded-[2rem] bg-[#13EC6A]/10 flex items-center justify-center text-[#13EC6A]">
            <Film size={40} />
          </div>
          <div>
            <h3 className="text-3xl font-black italic font-display tracking-tight uppercase mb-2">No Proof Yet.</h3>
            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest leading-loose">
              Your portfolio is empty. Record a 30-second Vibe CV<br />to start getting hired.
            </p>
          </div>
          <Link
            href="/talent/studio/record"
            className="px-10 py-5 bg-[#13EC6A] text-[#052210] rounded-full font-black text-[10px] uppercase tracking-[0.4em] shadow-glow hover:scale-105 transition-all italic"
          >
            Record Now <span className="ml-2">→</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {proofs.map((proof) => (
            <div key={proof.id} className="glass rounded-[3rem] overflow-hidden group border border-white/5 hover:border-[#13EC6A]/20 transition-all">
              {/* Thumbnail / Video Preview */}
              <div className="aspect-video bg-white/5 relative flex items-center justify-center cursor-pointer">
                {proof.thumbnail_url ? (
                  <img
                    src={proof.thumbnail_url}
                    alt={proof.title || "Proof"}
                    className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#13EC6A]/10 to-indigo-600/10" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 opacity-60" />
                <Link
                  href={`/talent/studio/publish?url=${encodeURIComponent(proof.video_url || "")}`}
                  className="z-20"
                >
                  <Play fill="currentColor" size={48} className="text-[#13EC6A] drop-shadow-glow group-hover:scale-125 transition-transform" />
                </Link>
                <div className="absolute top-6 right-6 z-20 flex gap-2">
                  <button
                    onClick={() => handleDelete(proof.id)}
                    disabled={deletingId === proof.id}
                    className="w-10 h-10 glass rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    {deletingId === proof.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-10 space-y-4 bg-black/40 relative z-20">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-black italic font-display tracking-tight uppercase mb-1">
                      {proof.title || "Untitled Proof"}
                    </h3>
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                      Vibe CV • {formatDate(proof.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Eye size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Live</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Upload New Slot */}
          <Link
            href="/talent/studio/record"
            className="border-4 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center p-20 gap-6 text-center hover:bg-white/5 transition-all cursor-pointer group"
          >
            <div className="w-20 h-20 rounded-[2rem] bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
              <Upload size={32} />
            </div>
            <div>
              <h4 className="font-black italic font-display tracking-tight uppercase mb-2">Add New Clip</h4>
              <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest leading-loose">
                Record & upload a<br />new Vibe CV proof.
              </p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

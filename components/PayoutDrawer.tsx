"use client";

import { useState } from "react";
import { X, Smartphone, ArrowRight, Loader2, CheckCircle2, Zap } from "lucide-react";
import { processPayout, Provider } from "@/lib/actions/payouts";

interface PayoutDrawerProps {
  userId: string;
  balance: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function PayoutDrawer({ userId, balance, onClose, onSuccess }: PayoutDrawerProps) {
  const [amount, setAmount] = useState(balance);
  const [provider, setProvider] = useState<Provider>("MTN MoMo");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handlePayout = async () => {
    if (!phoneNumber || amount <= 0) return;
    setIsProcessing(true);
    try {
      await processPayout(userId, amount, provider, phoneNumber);
      setStatus("success");
      onSuccess();
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (status === "success") {
    return (
      <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
        <div className="relative w-full max-w-lg glass rounded-[3rem] p-12 text-center border border-[#13EC6A]/20 shadow-glow animate-in zoom-in-95 duration-300">
           <CheckCircle2 className="mx-auto text-[#13EC6A] mb-8 drop-shadow-glow" size={80} />
           <h2 className="text-5xl font-black tracking-tighter italic font-display mb-4">ZIYAKHALA! 💸</h2>
           <p className="text-gray-400 font-bold mb-10">Your funds are being sent to your {provider} wallet.</p>
           <button 
             onClick={onClose}
             className="w-full py-5 bg-[#13EC6A] text-[#052210] rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
           >
             Hustle On
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg glass rounded-t-[3rem] sm:rounded-[3rem] p-10 border border-white/10 shadow-premium animate-in slide-in-from-bottom-20 duration-500">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-black tracking-tighter italic font-display">Capture The Bag.</h2>
            <p className="text-[#13EC6A] text-[10px] font-black uppercase tracking-[0.3em] italic">Mobile Money Withdrawal</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl glass-dark flex items-center justify-center hover:bg-white/10 transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-8">
          {/* Provider Toggle */}
          <div className="flex gap-4 p-2 glass-dark rounded-3xl border border-white/5">
            {(["MTN MoMo", "Vodacom mpesa"] as Provider[]).map((p) => (
              <button
                key={p}
                onClick={() => setProvider(p)}
                className={`flex-1 py-4 rounded-2xl font-black text-[10px] tracking-widest uppercase transition-all ${provider === p ? "bg-white text-black shadow-glow" : "text-gray-500 hover:text-white"}`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Amount Field */}
          <div className="space-y-3">
             <label className="text-[10px] font-black uppercase tracking-widest text-[#13EC6A] ml-2 italic">Withdraw Amount (ZAR)</label>
             <div className="relative">
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-5 px-8 text-3xl font-black font-display tracking-tighter italic focus:outline-none focus:border-[#13EC6A] transition-colors"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R</div>
             </div>
             <p className="text-[10px] text-gray-500 ml-2">Available: R{balance.toFixed(2)}</p>
          </div>

          {/* Phone Field */}
          <div className="space-y-3">
             <label className="text-[10px] font-black uppercase tracking-widest text-[#13EC6A] ml-2 italic">Mobile Number</label>
             <div className="relative">
                <input 
                  type="tel" 
                  placeholder="083 000 0000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-5 px-8 text-xl font-bold tracking-widest focus:outline-none focus:border-[#13EC6A] transition-colors"
                />
                <Smartphone className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-600" size={24} />
             </div>
          </div>

          <button
            onClick={handlePayout}
            disabled={isProcessing || !phoneNumber || amount <= 0 || amount > balance}
            className="w-full py-6 bg-[#13EC6A] text-[#052210] rounded-[2rem] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 italic"
          >
            {isProcessing ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                Initiate Transfer <ArrowRight size={20} className="drop-shadow-glow" />
              </>
            )}
          </button>
          
          <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl flex items-center gap-4">
             <Zap className="text-amber-500" size={20} />
             <p className="text-[9px] font-bold text-amber-500/80 leading-relaxed uppercase tracking-wider">Payments are processed instantly but may take up to 2 hours depending on network load shedding.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

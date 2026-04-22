"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { walletsHub, transactionsHub, contractsHub } from "@/lib/supabase-helpers";
import { 
  DollarSign, 
  Clock, 
  ShieldCheck, 
  TrendingUp, 
  Loader2,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Lock
} from "lucide-react";
import Link from "next/link";

type Contract = {
  id: string;
  title: string;
  price: number;
  status: string;
  escrow_funded: boolean;
  maker_id: string;
};

type Transaction = {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  status: string | null;
  created_at: string;
};

export default function EmployerEscrowPage() {
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fundedContracts, setFundedContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const w = await walletsHub.fetchOwn(user.id, supabase);
        setWallet(w);

        if (w) {
          const tx = await transactionsHub.fetchForWallet(w.id, supabase);
          setTransactions((tx || []) as Transaction[]);
        }

        const contracts = await contractsHub.fetchByEmployer(user.id, supabase);
        const funded = ((contracts || []) as Contract[]).filter(
          c => c.escrow_funded && ['active', 'delivered', 'revision_requested'].includes(c.status)
        );
        setFundedContracts(funded);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#0D110F] flex items-center justify-center">
      <Loader2 className="animate-spin text-[#8B5CF6]" size={48} />
    </div>
  );

  const totalEscrowed = fundedContracts.reduce((sum, c) => sum + Number(c.price), 0);

  return (
    <div className="min-h-[100dvh] bg-[#0D110F] text-white font-body pb-40">
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8B5CF6] mb-2">Financial Overview</p>
        <h1 className="text-4xl font-black italic tracking-tighter font-display">Escrow &amp; Wallet</h1>
      </div>

      {error && (
        <div className="mx-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm font-bold mb-6">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="px-6 grid grid-cols-2 gap-4 mb-8">
        <div className="bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded-3xl p-6">
          <DollarSign size={24} className="text-[#8B5CF6] mb-3" />
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Wallet Balance</p>
          <p className="text-3xl font-black italic tracking-tighter font-display text-[#8B5CF6]">
            R {(wallet?.balance ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6">
          <Lock size={24} className="text-amber-400 mb-3" />
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">In Escrow</p>
          <p className="text-3xl font-black italic tracking-tighter font-display text-amber-400">
            R {totalEscrowed.toLocaleString()}
          </p>
        </div>
        <div className="bg-white/5 border border-white/5 rounded-3xl p-6">
          <Clock size={24} className="text-gray-400 mb-3" />
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Pending Release</p>
          <p className="text-3xl font-black italic tracking-tighter font-display text-gray-300">
            R {(wallet?.pending_balance ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-3xl p-6">
          <ShieldCheck size={24} className="text-[#13EC6A] mb-3" />
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Active Contracts</p>
          <p className="text-3xl font-black italic tracking-tighter font-display text-[#13EC6A]">
            {fundedContracts.length}
          </p>
        </div>
      </div>

      {/* Funded Contracts */}
      {fundedContracts.length > 0 && (
        <div className="px-6 mb-8">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-4">Escrowed Contracts</h2>
          <div className="space-y-3">
            {fundedContracts.map(contract => (
              <Link
                key={contract.id}
                href={`/employer/contracts`}
                className="block bg-white/5 border border-white/5 hover:border-amber-500/30 rounded-3xl p-5 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black italic tracking-tight text-lg">{contract.title}</p>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full mt-2 inline-block ${
                      contract.status === 'delivered' ? 'bg-green-500/10 text-green-400' :
                      contract.status === 'revision_requested' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-[#8B5CF6]/10 text-[#8B5CF6]'
                    }`}>
                      {contract.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black italic tracking-tighter font-display text-amber-400">
                      R {Number(contract.price).toLocaleString()}
                    </p>
                    <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest flex items-center justify-end gap-1 mt-1">
                      <Lock size={10} /> Locked
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="px-6">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-4">Transaction History</h2>
        {transactions.length === 0 ? (
          <div className="bg-white/5 border border-white/5 rounded-3xl p-10 text-center">
            <TrendingUp size={40} className="text-gray-700 mx-auto mb-4" />
            <p className="text-gray-600 font-black text-sm uppercase tracking-widest">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map(tx => (
              <div key={tx.id} className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  tx.type === 'credit' ? 'bg-green-500/10 text-[#13EC6A]' : 'bg-red-500/10 text-red-400'
                }`}>
                  {tx.type === 'credit' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{tx.description || `${tx.type} transaction`}</p>
                  <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest">
                    {new Date(tx.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <p className={`font-black text-lg italic tracking-tight ${
                  tx.type === 'credit' ? 'text-[#13EC6A]' : 'text-red-400'
                }`}>
                  {tx.type === 'credit' ? '+' : '-'}R {Number(tx.amount).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

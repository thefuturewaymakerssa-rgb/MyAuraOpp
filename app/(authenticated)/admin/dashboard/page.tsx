"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Users, Briefcase, Zap, TrendingUp, Shield, Crown, Settings, Scale, AlertTriangle, Hammer } from "lucide-react";

import Link from "next/link";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMakers: 0,
    totalJobs: 0,
    activeFeatured: 0,
    activeDisputes: 0,
    pendingReports: 0,
    revenue: "R 0.00"
  });


  useEffect(() => {
    async function fetchStatsAndSettings() {
      const supabase = createClient();
      
      const { count: makersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: jobsCount } = await supabase.from('jobs').select('*', { count: 'exact', head: true });
      const { count: featuredCount } = await (supabase.from('profiles') as any)
        .select('*', { count: 'exact', head: true })
        .gt('featured_until', new Date().toISOString());



      const { count: disputesCount } = await supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('status', 'disputed');
      const { count: reportsCount } = await (supabase.from('reports') as any).select('*', { count: 'exact', head: true }).eq('status', 'pending');

      setStats({
        totalMakers: makersCount || 0,
        totalJobs: jobsCount || 0,
        activeFeatured: featuredCount || 0,
        activeDisputes: disputesCount || 0,
        pendingReports: reportsCount || 0,
        revenue: `R ${(featuredCount || 0) * 50 + (jobsCount || 0) * 200}.00`
      });
      setLoading(false);
    }
    fetchStatsAndSettings();
  }, []);



  if (loading) return <div className="h-screen bg-[#0D110F] flex items-center justify-center text-[#13EC6A]"><Zap className="animate-pulse" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#0D110F] text-white p-8 lg:p-16 font-body">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
           <div className="space-y-4">
              <h1 className="text-6xl font-black italic tracking-tighter font-display uppercase">Command Center.</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Platform Management • Future WayMakers v1.0</p>
           </div>
           
           <div className="flex items-center gap-3 px-8 py-4 rounded-2xl glass border border-white/5">
              <div className="w-3 h-3 rounded-full bg-[#13EC6A] shadow-[0_0_8px_#13EC6A]" />
              <span className="text-[10px] font-black uppercase tracking-widest">Grid Stable</span>
           </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           <StatCard icon={<Users />} label="Total Makers" value={stats.totalMakers} color="#13EC6A" />
           <StatCard icon={<Briefcase />} label="Active Gigs" value={stats.totalJobs} color="#3B82F6" />
           <StatCard icon={<Scale />} label="Active Disputes" value={stats.activeDisputes} color="#EF4444" />
           <StatCard icon={<TrendingUp />} label="Est. Revenue" value={stats.revenue} color="#F59E0B" />
        </div>

        {/* Management Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
           {/* Recent Activity */}
           <div className="glass-dark rounded-[3.5rem] border border-white/5 p-12">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-2xl font-black italic uppercase font-display tracking-tight">System Integrity</h3>
                 <Shield className="text-[#13EC6A]/50" />
              </div>
              <div className="space-y-6">
                  <IntegrityCheck label="Database Sync" status="Operational" />
                  <IntegrityCheck label="Escrow System" status={stats.activeDisputes > 0 ? "Friction High" : "Operational"} warning={stats.activeDisputes > 0} />
                  <IntegrityCheck label="Safety Flags" status={stats.pendingReports > 0 ? `${stats.pendingReports} PENDING` : "Secure"} warning={stats.pendingReports > 0} />
                  <IntegrityCheck label="Messenger Relay" status="Operational" />
              </div>
           </div>

           {/* Quick Actions */}
           <div className="glass-dark rounded-[3.5rem] border border-white/5 p-12 space-y-8">
              <h3 className="text-2xl font-black italic uppercase font-display tracking-tight">Rapid Response</h3>
              <div className="grid grid-cols-2 gap-6">
                 <Link href="/admin/disputes" className="contents">
                    <ActionButton icon={<Hammer />} label="Dispute Court" />
                 </Link>
                 <Link href="/admin/kyc" className="contents">
                    <ActionButton icon={<Settings />} label="KYC / Verify" />
                 </Link>
                 <Link href="/admin/moderation" className="contents">
                    <ActionButton icon={<AlertTriangle />} label="Moderate Review" />
                 </Link>
                 <Link href="/admin/moderation" className="contents">
                    <ActionButton icon={<Crown />} label="Feature Maker" />
                 </Link>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) {
  return (
    <div className="glass-dark p-10 rounded-[3rem] border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between group">
       <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-10 border border-white/5 group-hover:scale-110 transition-transform" style={{ color }}>
          {icon}
       </div>
       <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 mb-2 italic">{label}</p>
          <h4 className="text-4xl font-black italic tracking-tighter font-display leading-none">{value}</h4>
       </div>
    </div>
  );
}

function IntegrityCheck({ label, status, warning }: { label: string, status: string, warning?: boolean }) {
  return (
    <div className="flex justify-between items-center p-6 glass rounded-2xl border border-white/5">
       <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic">{label}</span>
       <span className={`text-[10px] font-black uppercase tracking-widest ${warning ? 'text-amber-500' : 'text-[#13EC6A]'}`}>{status}</span>
    </div>
  );
}

function ActionButton({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <button className="flex flex-col items-center justify-center p-8 glass rounded-3xl border border-white/5 hover:bg-white/5 hover:border-[#13EC6A]/30 transition-all gap-4 group">
       <div className="text-gray-500 group-hover:text-[#13EC6A] transition-colors">{icon}</div>
       <span className="text-[8px] font-black uppercase tracking-widest text-gray-600 group-hover:text-white transition-colors">{label}</span>
    </button>
  );
}

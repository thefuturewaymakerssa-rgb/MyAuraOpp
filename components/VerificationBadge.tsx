import React from 'react';
import { CheckCircle2, ShieldCheck, Gem, Star } from "lucide-react";

export type VerificationTier = 'basic' | 'trusted' | 'verified' | 'pro';

interface VerificationBadgeProps {
  tier: VerificationTier;
  score?: number;
  showText?: boolean;
}

const TIER_CONFIG = {
  basic: {
    icon: null,
    color: 'text-gray-500',
    label: 'Basic'
  },
  trusted: {
    icon: <CheckCircle2 size={16} />,
    color: 'text-blue-400',
    label: 'Trusted'
  },
  verified: {
    icon: <ShieldCheck size={16} />,
    color: 'text-[#13EC6A]',
    label: 'Verified'
  },
  pro: {
    icon: <Gem size={16} />,
    color: 'text-amber-400',
    label: 'Pro'
  }
};

export const VerificationBadge = ({ tier, score, showText = false }: VerificationBadgeProps) => {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.basic;

  if (tier === 'basic' && !score) return null;

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl ${config.color} shadow-glow-sm animate-in fade-in zoom-in duration-500`}>
        {config.icon}
        {showText && <span className="text-[10px] font-black uppercase tracking-widest leading-none">{config.label}</span>}
      </div>
      
      {score && (
        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl text-amber-400 shadow-glow-sm">
          <Star size={12} fill="currentColor" />
          <span className="text-[10px] font-black leading-none">{Number(score).toFixed(1)}</span>
        </div>
      )}
    </div>
  );
};

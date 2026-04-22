"use client";

import { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft, X, Sparkles } from "lucide-react";

const TOUR_STEPS = [
  {
    title: "Welcome to Shapa!",
    content: "Shapa is where skill meets visibility. Let's show you how to get your first gig.",
    target: "header",
  },
  {
    title: "Your VibeCV Score",
    content: "This score grows as you complete your profile and verify your skills. Higher score = Higher visibility.",
    target: "score-card",
  },
  {
    title: "The Work Radar",
    content: "Set your travel radius and privacy settings here to control who sees your exact location.",
    target: "work-radar",
  },
  {
    title: "Recording Proof",
    content: "Use the Studio to record short video proof of your skills. This is what employers really want to see.",
    target: "proof-studio",
  }
];

export default function OnboardingTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("shapa_tour_seen");
    if (!hasSeenTour) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem("shapa_tour_seen", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500">
      <div className="bg-[#171C19] border border-[#1CD79D]/30 w-full max-w-md rounded-[2.5rem] p-8 shadow-[0_0_100px_rgba(28,215,157,0.2)]">
        <div className="flex justify-between items-start mb-6">
          <div className="w-12 h-12 bg-[#1CD79D]/10 rounded-2xl flex items-center justify-center text-[#1CD79D]">
            <Sparkles size={24} />
          </div>
          <button onClick={handleComplete} className="p-2 text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <h3 className="text-3xl font-black italic tracking-tighter mb-4 text-white">{step.title}</h3>
        <p className="text-gray-400 font-bold mb-10 leading-relaxed">{step.content}</p>

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all ${i === currentStep ? 'w-6 bg-[#1CD79D]' : 'w-1.5 bg-white/10'}`} 
              />
            ))}
          </div>

          <div className="flex gap-3">
            {currentStep > 0 && (
              <button 
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white border border-white/10"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            
            <button 
              onClick={() => {
                if (currentStep < TOUR_STEPS.length - 1) {
                  setCurrentStep(prev => prev + 1);
                } else {
                  handleComplete();
                }
              }}
              className="px-8 h-12 rounded-2xl bg-[#1CD79D] text-black font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all"
            >
              {currentStep === TOUR_STEPS.length - 1 ? "Get Started" : "Next"}
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

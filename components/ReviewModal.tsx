"use client";
import { useState } from "react";
import { Star, X, Loader2, Sparkles } from "lucide-react";
import { reviewsHub } from "@/lib/supabase-helpers";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  makerId: string;
  reviewerId: string;
  makerName: string;
  onSuccess: () => void;
}

export default function ReviewModal({ isOpen, onClose, makerId, reviewerId, makerName, onSuccess }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);
    try {
      await reviewsHub.insert({
        maker_id: makerId,
        reviewer_id: reviewerId,
        rating,
        comment,
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Review submission failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="glass-dark w-full max-w-md p-10 rounded-[3rem] border border-white/10 relative shadow-2xl overflow-hidden group">
        {/* Vibe lines */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#13EC6A] to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
        
        <button onClick={onClose} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors">
          <X size={24} />
        </button>

        <h3 className="text-3xl font-black mb-2 italic tracking-tight font-display">Rate the Vibe.</h3>
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-10">How was working with <span className="text-[#13EC6A]">{makerName}</span>?</p>

        <div className="flex justify-center gap-4 mb-10">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(star)}
              className="transition-transform active:scale-95"
            >
              <Star
                size={40}
                className={`${
                  star <= (hover || rating) ? "text-[#13EC6A] drop-shadow-glow" : "text-gray-800"
                } transition-all duration-300`}
                fill={star <= (hover || rating) ? "currentColor" : "none"}
                strokeWidth={2.5}
              />
            </button>
          ))}
        </div>

        <div className="space-y-6">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Drop a quick shoutout or feedback..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white placeholder-gray-700 focus:outline-none focus:border-[#13EC6A]/30 min-h-[120px] transition-all"
          />

          <button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className={`w-full py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 ${
              rating === 0 
                ? "bg-gray-800 text-gray-500 cursor-not-allowed" 
                : "bg-[#13EC6A] text-[#052210] shadow-glow hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={18} />}
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}

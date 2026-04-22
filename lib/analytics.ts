import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

/**
 * Basic "Zero-Sugar" Analytics Utility
 * Tracks high-fidelity conversion events across ShapaCV.
 */
export const trackEvent = async (eventName: string, metadata: any = {}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await (supabase.from('analytics_events') as any).insert({
      user_id: user?.id || null,
      event_name: eventName,
      metadata: {
        ...metadata,
        url: typeof window !== 'undefined' ? window.location.href : 'server-side',
        timestamp: new Date().toISOString()
      }
    });

    if (error) {
      console.warn(`[Analytics] Failed to track ${eventName}:`, error.message);
    } else {

    }
  } catch (err) {
    // Analytics should never crash the app
    console.error("[Analytics] Error:", err);
  }
};

export const ANALYTICS_EVENTS = {
  VIBECHECK_START: 'vibecheck_start',
  VIBECHECK_RECORDED: 'vibecheck_recorded',
  VIBECHECK_PUBLISHED: 'vibecheck_published',
  EMPLOYER_SIGNUP: 'employer_signup',
  TALENT_SIGNUP: 'talent_signup',
  GIG_POSTED: 'gig_posted',
  APPLICATION_SUBMITTED: 'application_submitted'
};

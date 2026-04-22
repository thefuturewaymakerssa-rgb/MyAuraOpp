export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ProfileRole = 'hustler' | 'employer' | 'admin' | 'freshie' | 'graduate' | 'reskiller';
export type VerificationTier = 'basic' | 'pro' | 'elite';
export type JobStatus = 'open' | 'closed' | 'filled';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';
export type ContractStatus = 'active' | 'delivered' | 'revision_requested' | 'completed' | 'disputed' | 'refunded' | 'cancelled' | 'expired';
export type TransactionType = 'credit' | 'debit';
export type TransactionStatus = 'completed' | 'pending' | 'failed';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string | null
          username: string | null
          role: ProfileRole | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          bio: string | null
          email: string | null
          phone: string | null
          dob: string | null
          location: string | null
          province: string | null
          city: string | null
          township: string | null
          trade: string | null
          skills: string[] | null
          hourly_rate: number | null
          is_available: boolean | null
          is_verified: boolean | null
          identity_verified: boolean | null
          onboarded: boolean | null
          verification_tier: VerificationTier | null
          reliability_score: number | null
          featured_until: string | null
          latitude: number | null
          longitude: number | null
          id_selfie: string | null
          gender: string | null
          stripe_account_id: string | null
          paystack_customer_code: string | null
          verification_paid_at: string | null
        }
        Insert: {
          id: string
          name?: string | null
          username?: string | null
          role?: ProfileRole | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          bio?: string | null
          email?: string | null
          phone?: string | null
          dob?: string | null
          location?: string | null
          province?: string | null
          city?: string | null
          township?: string | null
          trade?: string | null
          skills?: string[] | null
          hourly_rate?: number | null
          is_available?: boolean | null
          is_verified?: boolean | null
          identity_verified?: boolean | null
          onboarded?: boolean | null
          verification_tier?: string | null
          reliability_score?: number | null
          featured_until?: string | null
          latitude?: number | null
          longitude?: number | null
          id_selfie?: string | null
          gender?: string | null
          stripe_account_id?: string | null
          paystack_customer_code?: string | null
          verification_paid_at?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          username?: string | null
          role?: ProfileRole | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          bio?: string | null
          email?: string | null
          phone?: string | null
          dob?: string | null
          location?: string | null
          province?: string | null
          city?: string | null
          township?: string | null
          trade?: string | null
          skills?: string[] | null
          hourly_rate?: number | null
          is_available?: boolean | null
          is_verified?: boolean | null
          identity_verified?: boolean | null
          onboarded?: boolean | null
          verification_tier?: string | null
          reliability_score?: number | null
          featured_until?: string | null
          latitude?: number | null
          longitude?: number | null
          id_selfie?: string | null
          gender?: string | null
          stripe_account_id?: string | null
          paystack_customer_code?: string | null
          verification_paid_at?: string | null
        }
      }
      proofs: {
        Row: {
          id: string
          maker_id: string
          title: string
          video_url: string | null
          thumbnail_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          maker_id: string
          title?: string
          video_url?: string | null
          thumbnail_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          maker_id?: string
          title?: string
          video_url?: string | null
          thumbnail_url?: string | null
          created_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          employer_id: string
          title: string
          description: string | null
          trade: string | null
          location: string | null
          budget: string | null
          status: JobStatus | null
          preferred_talent_type: ProfileRole[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employer_id: string
          title?: string
          description?: string | null
          trade?: string | null
          location?: string | null
          budget?: string | null
          status?: JobStatus | null
          preferred_talent_type?: ProfileRole[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employer_id?: string
          title?: string
          description?: string | null
          trade?: string | null
          location?: string | null
          budget?: string | null
          status?: JobStatus | null
          preferred_talent_type?: ProfileRole[] | null
          created_at?: string
          updated_at?: string
        }
      }
      saved_makers: {
        Row: {
          id: string
          user_id: string | null
          maker_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          maker_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          maker_id?: string | null
          created_at?: string
        }
      }
      job_applications: {
        Row: {
          id: string
          job_id: string
          maker_id: string
          proof_id: string | null
          status: ApplicationStatus | null
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          maker_id: string
          proof_id?: string | null
          status?: ApplicationStatus | null
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          maker_id?: string
          proof_id?: string | null
          status?: ApplicationStatus | null
          created_at?: string
        }
      }
      wallets: {
        Row: {
          id: string
          user_id: string
          balance: number
          pending_balance: number | null
          currency: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          pending_balance?: number | null
          currency?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          pending_balance?: number | null
          currency?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          wallet_id: string
          type: TransactionType
          amount: number
          vat_amount: number
          description: string | null
          metadata: Json | null
          status: TransactionStatus | null
          created_at: string
        }
        Insert: {
          id?: string
          wallet_id: string
          type?: TransactionType
          amount: number
          vat_amount: number
          description?: string | null
          metadata?: Json | null
          status?: TransactionStatus | null
          created_at?: string
        }
        Update: {
          id?: string
          wallet_id?: string
          type?: string
          amount?: number
          vat_amount?: number
          description?: string | null
          metadata?: Json | null
          status?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          message: string
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          message: string
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          message?: string
          read_at?: string | null
          created_at?: string
        }
      }
      vouches: {
        Row: {
          id: string
          voucher_id: string
          maker_id: string
          weight: number
          created_at: string
        }
        Insert: {
          id?: string
          voucher_id: string
          maker_id: string
          weight?: number
          created_at?: string
        }
        Update: {
          id?: string
          voucher_id?: string
          maker_id?: string
          weight?: number
          created_at?: string
        }
      }
      consent_logs: {
        Row: {
          id: string
          user_id: string
          purpose: string
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          purpose: string
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          purpose?: string
          ip_address?: string | null
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          user_1_id: string
          user_2_id: string
          last_message: string | null
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_1_id: string
          user_2_id: string
          last_message?: string | null
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_1_id?: string
          user_2_id?: string
          last_message?: string | null
          updated_at?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          text: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          text: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          text?: string
          is_read?: boolean
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          maker_id: string
          reviewer_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          maker_id: string
          reviewer_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          maker_id?: string
          reviewer_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
      }
      contracts: {
        Row: {
          id: string
          job_id: string | null
          employer_id: string
          maker_id: string
          title: string
          description: string | null
          price: number
          status: ContractStatus | null
          escrow_funded: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id?: string | null
          employer_id: string
          maker_id: string
          title: string
          description?: string | null
          price: number
          status?: ContractStatus | null
          escrow_funded?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string | null
          employer_id?: string
          maker_id?: string
          title?: string
          description?: string | null
          price?: number
          status?: string | null
          escrow_funded?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      site_settings: {
        Row: {
          key: string
          value: Json
          updated_at: string
        }
        Insert: {
          key: string
          value: Json
          updated_at?: string
        }
        Update: {
          key?: string
          value?: Json
          updated_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          target_id: string | null
          proof_id: string | null
          reason: string
          status: 'pending' | 'resolved' | 'dismissed'
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          target_id?: string | null
          proof_id?: string | null
          reason: string
          status?: 'pending' | 'resolved' | 'dismissed'
          created_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          target_id?: string | null
          proof_id?: string | null
          reason?: string
          status?: 'pending' | 'resolved' | 'dismissed'
          created_at?: string
        }
      }
      analytics_events: {
        Row: {
          id: string
          user_id: string | null
          event_name: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          event_name: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          event_name?: string
          metadata?: Json | null
          created_at?: string
        }
      }
    }
  }
}

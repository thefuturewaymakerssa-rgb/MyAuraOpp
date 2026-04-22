import { SupabaseClient } from '@supabase/supabase-js';
import { Database, JobStatus, ApplicationStatus, ContractStatus, VerificationTier, TransactionType, TransactionStatus } from "./database.types";
import { logger } from './logger';

// Initial browser client for client-side usage
let browserClient: SupabaseClient<Database> | null = null;
const getBrowserClient = () => {
  if (typeof window === 'undefined') return null;
  if (!browserClient) {
     
    const { createClient } = require("@/utils/supabase/client");
    browserClient = createClient();
  }
  return browserClient;
};

// Helper to use either a provided client or the default browser client
const getClient = (customClient?: SupabaseClient<Database>) => (customClient || getBrowserClient()) as SupabaseClient<Database>;

// --- Types & Interfaces ---
export type ProfileWithMakers = Database['public']['Tables']['profiles']['Row'] & {
  makers: any | null; // Deprecated backwards compatibility
};

export type MakerWithRelations = Database['public']['Tables']['profiles']['Row'] & {
  proofs: Database['public']['Tables']['proofs']['Row'][];
  reviews: Database['public']['Tables']['reviews']['Row'][];
};

export type JobWithApplications = Database['public']['Tables']['jobs']['Row'] & {
  job_applications: Database['public']['Tables']['job_applications']['Row'][];
  employer?: Database['public']['Tables']['profiles']['Row'] | null;
};

export type ContractWithProfiles = Database['public']['Tables']['contracts']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'] | null;
};

export type ContractFull = Database['public']['Tables']['contracts']['Row'] & {
  maker?: Database['public']['Tables']['profiles']['Row'] | null;
  employer?: Database['public']['Tables']['profiles']['Row'] | null;
};

// --- CRUD Hub for Core Tables ---

export const profilesHub = {
  fetchAll: async (client?: SupabaseClient<Database>): Promise<any[]> => {
    // Only return talent (hustlers) by default when fetching all from the hub
    const { data, error } = await getClient(client)
      .from('profiles')
      .select('*, proofs(title, video_url, thumbnail_url, created_at), reviews(rating)')
      .in('role', ['hustler', 'freshie', 'graduate', 'reskiller'])
      .order('created_at', { ascending: false });
    
    if (error) {
      logger.supabaseError('profilesHub.fetchAll', error);
      return [];
    }
    return data || [];
  },
  fetchById: async (id: string, client?: SupabaseClient<Database>): Promise<Database['public']['Tables']['profiles']['Row'] | null> => {
    try {
      const { data, error } = await getClient(client).from('profiles').select('*').eq('id', id).maybeSingle();
      if (error) {
        const isNetworkDrop = error.message?.includes('fetch failed') || error.details?.includes('ECONNRESET');
        
        if (isNetworkDrop) {
          logger.warn('profilesHub.fetchById transient network drop', { action: 'fetchById.econnreset', userId: id });
        } else {
          logger.supabaseError('profilesHub.fetchById', error, { userId: id });
        }
        return null;
      }
      return data;
    } catch (err: unknown) {
       const isNetworkDrop = String(err).includes('fetch failed') || String(err).includes('ECONNRESET');
       if (isNetworkDrop) {
          logger.warn('profilesHub.fetchById transient network drop (thrown)', { action: 'fetchById.econnreset', userId: id });
       } else {
          const error = err instanceof Error ? err : new Error(String(err));
          logger.error('profilesHub.fetchById network failure', error, { action: 'profilesHub.fetchById.catch', userId: id });
       }
       return null;
    }
  },
  fetchRich: async (id: string, client?: any): Promise<MakerWithRelations | null> => {
    const { data, error } = await getClient(client)
      .from('profiles')
      .select('*, proofs(*), reviews(*)')
      .eq('id', id)
      .maybeSingle(); 
    
    if (error) {
      console.warn('[profilesHub.fetchRich] Supabase error:', error.message, error.code);
      return null;
    }
    return data as any;
  },
  insert: async (values: Database['public']['Tables']['profiles']['Insert'], client?: any) => {
    const { data, error } = await (getClient(client).from('profiles') as any).insert(values).select().single();
    if (error) throw error;
    return data;
  },
  update: async (id: string, values: Database['public']['Tables']['profiles']['Update'], client?: any) => {
    const { data, error } = await (getClient(client).from('profiles') as any).update(values).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  upsert: async (values: Database['public']['Tables']['profiles']['Insert'], client?: any) => {
    const { data, error } = await (getClient(client).from('profiles') as any).upsert(values).select().single();
    if (error) throw error;
    return data;
  },
  addSkill: async (makerId: string, skill: string, client?: any) => {
    const { data: maker } = await getClient(client).from('profiles').select('skills').eq('id', makerId).single();
    const skills = (maker as any)?.skills || [];
    if (!skills.includes(skill)) {
      const { error } = await (getClient(client).from('profiles') as any).update({ skills: [...skills, skill] }).eq('id', makerId);
      if (error) throw error;
    }
  },
  removeSkill: async (makerId: string, skill: string, client?: any) => {
    const { data: maker } = await getClient(client).from('profiles').select('skills').eq('id', makerId).single();
    const skills = (maker as any)?.skills || [];
    const { error } = await (getClient(client).from('profiles') as any).update({ skills: skills.filter((s: string) => s !== skill) }).eq('id', makerId);
    if (error) throw error;
  }
};

// 2.5 Proofs
export const proofsHub = {
  fetchAll: async (client?: any) => {
    const { data, error } = await getClient(client).from('proofs').select('*, profiles:maker_id(name)');
    if (error) throw error;
    return data;
  },
  fetchForMaker: async (makerId: string, client?: any) => {
    const { data, error } = await getClient(client).from('proofs').select('*').eq('maker_id', makerId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  insert: async (values: Database['public']['Tables']['proofs']['Insert'], client?: SupabaseClient<Database>) => {
    const { data, error } = await (getClient(client).from('proofs') as any).insert(values).select().single();
    if (error) throw error;
    return data;
  },
  delete: async (id: string, client?: SupabaseClient<Database>) => {
    const supabase = getClient(client);
    // Get file path first
    const { data: proof } = await supabase.from('proofs').select('video_url, maker_id').eq('id', id).single() as any;
    if (proof && proof.video_url) {
      const parts = proof.video_url.split('/');
      const fileName = parts.pop();
      if (fileName) await storageHub.deleteFile('proofs', `${proof.maker_id}/${fileName}`, supabase);
    }
    const { error } = await supabase.from('proofs').delete().eq('id', id);
    if (error) throw error;
  }
};

// 3. Jobs
export const jobsHub = {
  fetchAll: async (makerRole?: string, client?: any) => {
    const query = getClient(client).from('jobs').select('*');
    
    if (makerRole) {
      // Prioritize jobs that match the maker's category or have no preference
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      
      // Sort in-memory to handle the array overlap prioritization
      return (data as any[]).sort((a, b) => {
        const aMatches = a.preferred_talent_type?.includes(makerRole);
        const bMatches = b.preferred_talent_type?.includes(makerRole);
        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
        return 0;
      });
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  insert: async (values: Database['public']['Tables']['jobs']['Insert'], client?: any) => {
    const { data, error } = await (getClient(client).from('jobs') as any).insert(values).select().single();
    if (error) throw error;
    return data;
  },
  fetchForEmployer: async (employerId: string, client?: any) => {
    const { data, error } = await getClient(client).from('jobs').select('*, job_applications(*)').eq('employer_id', employerId);
    if (error) throw error;
    return data as any;
  }
};

// 4. Saved Makers
export const savedMakersHub = {
  fetchOwn: async (userId: string, client?: any): Promise<{ maker_id: string }[]> => {
    const { data, error } = await getClient(client).from('saved_makers').select('maker_id').eq('user_id', userId);
    if (error) throw error;
    return data || [];
  },
  upsert: async (userId: string, makerId: string, client?: any) => {
    const { data, error } = await (getClient(client)
      .from('saved_makers') as any)
      .upsert({ user_id: userId, maker_id: makerId }, { onConflict: 'user_id, maker_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  remove: async (userId: string, makerId: string, client?: any) => {
    const { error } = await getClient(client)
      .from('saved_makers')
      .delete()
      .eq('user_id', userId)
      .eq('maker_id', makerId);
    if (error) throw error;
  }
};

// 5. Job Applications
export const applicationsHub = {
  insert: async (values: Database['public']['Tables']['job_applications']['Insert'], client?: any) => {
    const { data, error } = await (getClient(client).from('job_applications') as any).insert(values).select().single();
    if (error) throw error;
    return data;
  }
};

// 6. Wallets & Transactions
export const walletsHub = {
  fetchOwn: async (userId: string, client?: SupabaseClient<Database>): Promise<Database['public']['Tables']['wallets']['Row'] | null> => {
    const { data, error } = await getClient(client).from('wallets').select('*').eq('user_id', userId).maybeSingle();
    if (error) {
      logger.supabaseError('walletsHub.fetchOwn', error, { userId });
      return null;
    }
    return data;
  },
  fetchByUserId: async (userId: string, client?: SupabaseClient<Database>): Promise<Database['public']['Tables']['wallets']['Row']> => {
    const { data, error } = await getClient(client).from('wallets').select('*').eq('user_id', userId).single();
    if (error) throw error;
    return data;
  },
  update: async (id: string, values: Database['public']['Tables']['wallets']['Update'], client?: SupabaseClient<Database>) => {
    const { data, error } = await (getClient(client).from('wallets') as any).update(values).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }
};

export const transactionsHub = {
  insert: async (values: Database['public']['Tables']['transactions']['Insert'], client?: SupabaseClient<Database>) => {
    const { data, error } = await (getClient(client).from('transactions') as any).insert(values).select().single();
    if (error) throw error;
    return data;
  },
  fetchForWallet: async (walletId: string, client?: SupabaseClient<Database>) => {
    const { data, error } = await getClient(client).from('transactions').select('*').eq('wallet_id', walletId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  processContractPayment: async (contract: any, client?: SupabaseClient<Database>) => {
    const supabase = getClient(client);
    
    // 1. Get platform fee percentage (Default 10%)
    const feePercent = await settingsHub.get('platform_fee_percentage', client) || 0.10;
    const totalAmount = Number(contract.price);
    const platformFee = totalAmount * feePercent;
    const makerNet = totalAmount - platformFee;

    // 2. Update Contract Status
    const { error: contractError } = await (supabase.from('contracts') as any).update({ 
      status: 'completed',
      updated_at: new Date().toISOString()
    }).eq('id', contract.id);
    if (contractError) throw contractError;

    // 3. Update Maker Wallet (Move from pending to balance)
    const { data: wallet, error: walletError } = await (supabase.from('wallets') as any).select('*').eq('user_id', contract.maker_id).single();
    if (walletError) throw walletError;

    const newBalance = Number(wallet.balance) + makerNet;
    const newPending = Math.max(0, Number(wallet.pending_balance) - totalAmount);

    const { error: updateError } = await (supabase.from('wallets') as any).update({
      balance: newBalance,
      pending_balance: newPending,
      updated_at: new Date().toISOString()
    }).eq('id', (wallet as any).id);
    if (updateError) throw updateError;

    // 4. Log Transaction for Maker
    await (supabase.from('transactions') as any).insert({
      wallet_id: wallet.id,
      type: 'credit',
      amount: makerNet,
      vat_amount: 0, // Should be calculated if applicable
      description: `Payment for "${contract.title}" (Less ${feePercent * 100}% fee)`,
      status: 'completed'
    });

    // 5. Log Virtual Platform Fee (Optional: requires a platform wallet entry)
    // For now we just return the calculation details
    return { success: true, makerNet, platformFee };
  }
};

// 7. Conversations & Messages
export const conversationsHub = {
  getOrCreate: async (u1: string, u2: string, client?: any) => {
    const [id1, id2] = u1 < u2 ? [u1, u2] : [u2, u1];
    const { data, error } = await (getClient(client)
      .from('conversations') as any)
      .upsert({ user_1_id: id1, user_2_id: id2 }, { onConflict: 'user_1_id, user_2_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

export const messagesHub = {
  insert: async (values: Database['public']['Tables']['messages']['Insert'], client?: any) => {
    const { data, error } = await (getClient(client).from('messages') as any).insert(values).select().single();
    if (error) throw error;
    return data;
  }
};

// 8. Reviews
export const reviewsHub = {
  insert: async (values: Database['public']['Tables']['reviews']['Insert'], client?: any) => {
    const { data, error } = await (getClient(client).from('reviews') as any).insert(values).select().single();
    if (error) throw error;
    return data;
  }
};

// 9. Contracts
export const contractsHub = {
  insert: async (values: Database['public']['Tables']['contracts']['Insert'], client?: any) => {
    const { data, error } = await (getClient(client).from('contracts') as any).insert(values).select().single();
    if (error) throw error;
    return data;
  },
  update: async (id: string, values: Database['public']['Tables']['contracts']['Update'], client?: any) => {
    const { data, error } = await (getClient(client).from('contracts') as any).update(values).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  fetchByEmployer: async (employerId: string, client?: any) => {
    const { data, error } = await getClient(client).from('contracts').select('*, profiles(*)').eq('employer_id', employerId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  fetchByMaker: async (makerId: string, client?: any) => {
    const { data, error } = await getClient(client).from('contracts').select('*, profiles(*)').eq('maker_id', makerId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  cancel: async (contractId: string, client?: SupabaseClient<Database>) => {
    const supabase = getClient(client);
    // 1. Get contract to find maker/price for refund logic
    const { data: contract } = await (supabase.from('contracts') as any).select('*').eq('id', contractId).single();
    if (!contract) throw new Error("Contract not found");

    // 2. Set to cancelled
    const { error } = await (supabase.from('contracts') as any).update({ 
      status: 'cancelled',
      updated_at: new Date().toISOString()
    }).eq('id', contractId);
    if (error) throw error;

    // 3. Refund Maker's Pending Balance (Since it shouldn't move to available)
    if ((contract as any).escrow_funded) {
      const { data: wallet } = await (supabase.from('wallets') as any).select('*').eq('user_id', (contract as any).maker_id).single();
      if (wallet) {
        const newPending = Math.max(0, Number(wallet.pending_balance) - Number((contract as any).price));
        await (supabase.from('wallets') as any).update({ 
          pending_balance: newPending,
          updated_at: new Date().toISOString()
        }).eq('id', (wallet as any).id);
      }
    }
    
    return { success: true };
  }
};

// 10. Site Settings
export const settingsHub = {
  get: async (key: string, client?: any) => {
    const { data, error } = await getClient(client).from('site_settings').select('value').eq('key', key).single();
    if (error) return null;
    return (data as any).value;
  },
  set: async (key: string, value: any, client?: any) => {
    const { error } = await (getClient(client).from('site_settings') as any).upsert({ key, value });
    if (error) throw error;
  }
};

// 11. Notifications
export const notificationsHub = {
  fetchOwn: async (userId: string, client?: any) => {
    const { data, error } = await getClient(client).from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  markAsRead: async (id: string, client?: any) => {
    const { error } = await (getClient(client).from('notifications') as any).update({ read_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },
  insert: async (values: Database['public']['Tables']['notifications']['Insert'], client?: any) => {
    const { data, error } = await (getClient(client).from('notifications') as any).insert(values).select().single();
    if (error) throw error;
    return data;
  }
};

// 12. Vouches
export const vouchesHub = {
  vouch: async (values: Database['public']['Tables']['vouches']['Insert'], client?: any) => {
    const { data, error } = await (getClient(client).from('vouches') as any).insert(values).select().single();
    if (error) throw error;
    return data;
  },
  fetchForMaker: async (makerId: string, client?: any) => {
    const { data, error } = await getClient(client).from('vouches').select('*').eq('maker_id', makerId);
    if (error) throw error;
    return data;
  }
};

// 13. Consent Logs
export const consentHub = {
  log: async (values: Database['public']['Tables']['consent_logs']['Insert'], client?: any) => {
    const { data, error } = await (getClient(client).from('consent_logs') as any).insert(values).select().single();
    if (error) throw error;
    return data;
  },
  fetchOwn: async (userId: string, client?: any) => {
    const { data, error } = await getClient(client).from('consent_logs').select('*').eq('user_id', userId);
    if (error) throw error;
    return data;
  }
};

// 14. Reports
export const reportsHub = {
  insert: async (values: Database['public']['Tables']['reports']['Insert'], client?: any) => {
    const { data, error } = await (getClient(client).from('reports') as any).insert(values).select().single();
    if (error) throw error;
    return data;
  },
  fetchAll: async (client?: any) => {
    const { data, error } = await getClient(client)
      .from('reports')
      .select('*, profiles:reporter_id(name), target:target_id(name), proofs:proof_id(title, video_url), jobs:target_id(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  resolve: async (id: string, status: 'resolved' | 'dismissed', client?: any) => {
    const { data, error } = await (getClient(client).from('reports') as any).update({ status }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }
};

// --- Storage Integrations ---
const uploadFile = async (bucket: 'proofs' | 'voice-notes' | 'identity-selfies', file: File | Blob | Buffer, userId: string, subfolder: string = '', ext: string = 'webm', client?: any) => {
  const fileName = `${userId}/${subfolder ? subfolder + '/' : ''}${Date.now()}.${ext}`;
  let contentType = 'application/octet-stream';
  
  if (bucket === 'proofs') contentType = ext === 'mp4' ? 'video/mp4' : 'video/webm';
  else if (bucket === 'voice-notes') contentType = ext === 'mp4' ? 'audio/mp4' : 'audio/webm';
  else if (bucket === 'identity-selfies') contentType = 'image/jpeg';
  
  const { data, error } = await getClient(client).storage.from(bucket).upload(fileName, file, {
    contentType,
    cacheControl: '3600',
    upsert: false
  });
  if (error) throw error;
  return getClient(client).storage.from(bucket).getPublicUrl(data.path).data.publicUrl;
};

export const storageHub = {
  uploadProof: async (file: File | Blob, makerId: string, ext: string = 'webm', client?: any) => {
    return uploadFile('proofs', file, makerId, '', ext, client);
  },
  uploadVoiceNote: async (blob: Blob, userId: string, format: 'webm' | 'mp4' = 'webm', client?: any) => {
    return uploadFile('voice-notes', blob, userId, '', format, client);
  },
  uploadIdentitySelfie: async (base64Data: string, userId: string, client?: any) => {
    // Convert base64 to Blob
    const base64Response = await fetch(base64Data);
    const blob = await base64Response.blob();
    return uploadFile('identity-selfies', blob, userId, '', 'jpg', client);
  },
  deleteFile: async (bucket: 'proofs' | 'voice-notes' | 'identity-selfies', path: string, client?: any) => {
    const { error } = await getClient(client).storage.from(bucket as any).remove([path]);
    if (error) throw error;
  }
};

-- Sprint 2.8: Enforce RLS on all sensitive tables
-- Covers: wallets, transactions, messages, conversations, notifications, consent_logs
-- Tables already covered: profiles, jobs, contracts (20260412000000_production_rls_hardening.sql)

-- ─────────────────────────────────────────────────────────────
-- WALLETS: Users can only see and update their own wallet
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet"
ON public.wallets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet"
ON public.wallets FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Service role only for insert (wallets created on signup, not by users directly)
CREATE POLICY "Service role can insert wallets"
ON public.wallets FOR INSERT
TO service_role
WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────
-- TRANSACTIONS: Users can only see transactions in their own wallet
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
ON public.transactions FOR SELECT
USING (
  wallet_id IN (
    SELECT id FROM public.wallets WHERE user_id = auth.uid()
  )
);

-- Transactions are only inserted by the service role (payment processing)
CREATE POLICY "Service role can insert transactions"
ON public.transactions FOR INSERT
TO service_role
WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────
-- CONVERSATIONS: Only involved participants can see the conversation
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view conversations"
ON public.conversations FOR SELECT
USING (auth.uid() = user_1_id OR auth.uid() = user_2_id);

CREATE POLICY "Authenticated users can create conversations"
ON public.conversations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_1_id OR auth.uid() = user_2_id);


-- ─────────────────────────────────────────────────────────────
-- MESSAGES: Only conversation participants can read or send messages
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages"
ON public.messages FOR SELECT
USING (
  conversation_id IN (
    SELECT id FROM public.conversations
    WHERE user_1_id = auth.uid() OR user_2_id = auth.uid()
  )
);

CREATE POLICY "Participants can send messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);


-- ─────────────────────────────────────────────────────────────
-- NOTIFICATIONS: Users can only see and manage their own
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can mark own notifications as read"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Notifications are inserted by backend/service role (triggered events)
CREATE POLICY "Service role can insert notifications"
ON public.notifications FOR INSERT
TO service_role
WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────
-- CONSENT LOGS: Users can view their own consent records only
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consent logs"
ON public.consent_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert consent logs"
ON public.consent_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────
-- SAVED MAKERS: Users can only see and manage their own saves
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.saved_makers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved makers"
ON public.saved_makers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can save makers"
ON public.saved_makers FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave makers"
ON public.saved_makers FOR DELETE
USING (auth.uid() = user_id);


-- Re-sync PostgREST schema cache
NOTIFY pgrst, 'reload schema';

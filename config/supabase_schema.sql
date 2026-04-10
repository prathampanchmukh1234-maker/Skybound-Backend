CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT,
  name          TEXT,
  phone         TEXT,
  avatar_url    TEXT,
  role          TEXT DEFAULT 'user',
  tier          TEXT DEFAULT 'Standard',
  sky_points    INTEGER DEFAULT 0,
  wallet_balance NUMERIC DEFAULT 0,
  free_trial_used BOOLEAN DEFAULT false,
  referral_code TEXT,
  search_history JSONB DEFAULT '[]',
  created_at    TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own" ON public.users;
CREATE POLICY "users_own" ON public.users FOR ALL USING (auth.uid() = id);

CREATE TABLE IF NOT EXISTS public.bookings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,
  item_id       TEXT,
  movie_id      TEXT,
  showtime_id   TEXT,
  title         TEXT,
  poster        TEXT,
  seat          TEXT[],
  total_price   NUMERIC DEFAULT 0,
  status        TEXT DEFAULT 'confirmed',
  payment_id    TEXT,
  is_free       BOOLEAN DEFAULT false,
  venue         TEXT,
  travel_date   TEXT,
  show_time     TEXT,
  from_city     TEXT,
  to_city       TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bookings_own" ON public.bookings;
CREATE POLICY "bookings_own" ON public.bookings FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.reviews (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name     TEXT NOT NULL,
  service_id    TEXT NOT NULL,
  service_type  TEXT NOT NULL,
  rating        INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reviews_read" ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert" ON public.reviews;
DROP POLICY IF EXISTS "reviews_delete" ON public.reviews;
CREATE POLICY "reviews_read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_delete" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id   UUID REFERENCES auth.users(id),
  name      TEXT, email TEXT, message TEXT,
  status    TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tickets_all" ON public.support_tickets;
CREATE POLICY "tickets_all" ON public.support_tickets FOR ALL USING (true);

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS location      TEXT,
  ADD COLUMN IF NOT EXISTS bio           TEXT,
  ADD COLUMN IF NOT EXISTS two_fa_enabled BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type       TEXT CHECK (type IN ('credit','debit')),
  amount     NUMERIC NOT NULL,
  reason     TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wt_own" ON public.wallet_transactions;
CREATE POLICY "wt_own" ON public.wallet_transactions FOR ALL USING (auth.uid() = user_id);
CREATE TABLE IF NOT EXISTS travel_profiles ( 
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, 
  age INTEGER, 
  travel_style TEXT, 
  yearly_budget NUMERIC, 
  created_at TIMESTAMPTZ DEFAULT NOW(), 
  UNIQUE(user_id) 
);

CREATE TABLE IF NOT EXISTS dream_destinations ( 
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, 
  name TEXT NOT NULL, 
  category TEXT, 
  priority TEXT, 
  is_completed BOOLEAN DEFAULT FALSE, 
  created_at TIMESTAMPTZ DEFAULT NOW() 
);

CREATE TABLE IF NOT EXISTS life_trips ( 
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, 
  destination TEXT NOT NULL, 
  year INTEGER, 
  status TEXT DEFAULT 'planned', 
  created_at TIMESTAMPTZ DEFAULT NOW() 
);

ALTER TABLE travel_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dream_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tp_own" ON travel_profiles;
DROP POLICY IF EXISTS "dd_own" ON dream_destinations;
DROP POLICY IF EXISTS "lt_own" ON life_trips;

CREATE POLICY "tp_own" ON travel_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "dd_own" ON dream_destinations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "lt_own" ON life_trips FOR ALL USING (auth.uid() = user_id);

-- IMPORTANT: Before running this schema, manually create a Storage bucket in Supabase Dashboard:
-- 1. Go to Storage → New Bucket
-- 2. Name: "avatars"
-- 3. Public bucket: YES (enable public access)
-- 4. File size limit: 5MB
-- 5. Allowed MIME types: image/jpeg, image/png, image/webp, image/gif

-- Storage bucket RLS (run after creating bucket)
-- Note: Replace 'avatars' with your bucket name if different
CREATE POLICY "Avatar Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Avatar View" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Avatar Update" ON storage.objects FOR UPDATE WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Avatar Delete" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

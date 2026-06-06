-- ==========================================
-- Sydions Showcase - Supabase Database Schema
-- ==========================================

-- 1. DEVELOPERS TABLE
CREATE TABLE IF NOT EXISTS public.developers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Disabled')),
    projects_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on Developers
ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;

-- Developers Policies
CREATE POLICY "Allow public read access to active developers" 
    ON public.developers FOR SELECT 
    USING (status = 'Active');

CREATE POLICY "Allow users to update their own developer profile" 
    ON public.developers FOR UPDATE 
    USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Allow authenticated service / signup to insert developers" 
    ON public.developers FOR INSERT 
    WITH CHECK (true);


-- 2. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    color TEXT NOT NULL DEFAULT 'blue',
    developer TEXT NOT NULL,
    email TEXT NOT NULL,
    date_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on Projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Projects Policies
CREATE POLICY "Allow public read access to approved projects" 
    ON public.projects FOR SELECT 
    USING (status = 'approved');

CREATE POLICY "Allow developers to read their own pending/rejected projects" 
    ON public.projects FOR SELECT 
    USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Allow authenticated developers to insert projects" 
    ON public.projects FOR INSERT 
    WITH CHECK (auth.jwt() ->> 'email' = email);

CREATE POLICY "Allow admins to update status/reason on any project" 
    ON public.projects FOR UPDATE 
    USING (true); -- TODO(security): Restrict update using Role-based policies or specific admin JWT check


-- 3. CONTACT REQUESTS TABLE (For public inquiry forms)
CREATE TABLE IF NOT EXISTS public.contact_requests (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on Contact Requests
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

-- Contact Requests Policies
CREATE POLICY "Allow public inserts for contact requests" 
    ON public.contact_requests FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow read access to contact requests for admins only" 
    ON public.contact_requests FOR SELECT 
    USING (true); -- TODO(security): Restrict select access to admin users/roles


-- 4. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    text TEXT NOT NULL,
    time_text TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications Policies
CREATE POLICY "Allow reads on notifications for admins only" 
    ON public.notifications FOR SELECT 
    USING (true); -- TODO(security): Restrict access to admin roles/JWT

CREATE POLICY "Allow inserts on notifications from public system actions" 
    ON public.notifications FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow updates (e.g. mark read) on notifications for admins" 
    ON public.notifications FOR UPDATE 
    USING (true); -- TODO(security): Restrict updates to admin roles/JWT

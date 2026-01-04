
-- Create enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'workshop');
CREATE TYPE public.user_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE public.membership_status AS ENUM ('trial', 'active', 'inactive');
CREATE TYPE public.match_mode AS ENUM ('friendly', 'tournament');
CREATE TYPE public.request_status AS ENUM ('open', 'matched', 'cancelled');
CREATE TYPE public.payment_status AS ENUM ('pending', 'approved', 'rejected');

-- User profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  gender TEXT,
  date_of_birth DATE,
  profile_photo TEXT,
  membership_status membership_status DEFAULT 'trial',
  trial_start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  monthly_fee_due TIMESTAMP WITH TIME ZONE,
  experience_points INTEGER DEFAULT 0,
  level user_level DEFAULT 'beginner',
  ranking_position INTEGER,
  total_matches_played INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  penalty_count INTEGER DEFAULT 0,
  account_suspension_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Courts table
CREATE TABLE public.courts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_name TEXT NOT NULL,
  address TEXT NOT NULL,
  google_map_url TEXT,
  price_rate TEXT,
  opening_hours TEXT,
  contact TEXT,
  images TEXT[],
  created_by_admin UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Partner requests table
CREATE TABLE public.partner_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_user UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mode match_mode NOT NULL,
  court_id UUID REFERENCES public.courts(id),
  date DATE NOT NULL,
  time TIME NOT NULL,
  phone TEXT,
  wanted_level user_level,
  status request_status DEFAULT 'open',
  matched_user UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Matches table
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.partner_requests(id),
  player1 UUID REFERENCES auth.users(id) NOT NULL,
  player2 UUID REFERENCES auth.users(id) NOT NULL,
  mode match_mode NOT NULL,
  score_player1 INTEGER,
  score_player2 INTEGER,
  player1_confirmed BOOLEAN DEFAULT false,
  player2_confirmed BOOLEAN DEFAULT false,
  winner UUID REFERENCES auth.users(id),
  experience_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Experience rules table
CREATE TABLE public.experience_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode match_mode NOT NULL UNIQUE,
  win_points INTEGER NOT NULL,
  lose_points INTEGER NOT NULL,
  friendly_points INTEGER DEFAULT 5
);

-- Insert default experience rules
INSERT INTO public.experience_rules (mode, win_points, lose_points, friendly_points) VALUES
  ('friendly', 5, 5, 5),
  ('tournament', 15, 10, 0);

-- Penalty logs table
CREATE TABLE public.penalty_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  match_id UUID REFERENCES public.matches(id),
  exp_deducted_percent DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Shop categories table
CREATE TABLE public.shop_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default categories
INSERT INTO public.shop_categories (name) VALUES
  ('Rackets'),
  ('Shoes'),
  ('Bags'),
  ('Shuttlecocks'),
  ('Accessories'),
  ('Apparel'),
  ('Others');

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.shop_categories(id),
  price DECIMAL(10,2) NOT NULL,
  images TEXT[],
  description TEXT,
  level_recommendation user_level,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Cart table
CREATE TABLE public.cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, product_id)
);

-- Favorites table
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, product_id)
);

-- Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_status payment_status DEFAULT 'pending',
  transaction_id TEXT,
  uploaded_screenshot TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Order items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Chat rooms table
CREATE TABLE public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default chat rooms
INSERT INTO public.chat_rooms (room_name, description) VALUES
  ('General', 'General discussion for all members'),
  ('Beginner Tips', 'Tips and advice for beginners'),
  ('Tournament Talk', 'Discuss tournaments and competitions'),
  ('Gear Reviews', 'Share your equipment reviews'),
  ('Find Partners', 'Looking for playing partners');

-- Messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penalty_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for courts (public read, admin write)
CREATE POLICY "Anyone can view courts" ON public.courts FOR SELECT USING (true);
CREATE POLICY "Admins can manage courts" ON public.courts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for partner_requests
CREATE POLICY "Anyone can view open requests" ON public.partner_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create requests" ON public.partner_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by_user);
CREATE POLICY "Users can update own requests" ON public.partner_requests FOR UPDATE TO authenticated USING (auth.uid() = created_by_user OR auth.uid() = matched_user);
CREATE POLICY "Users can delete own requests" ON public.partner_requests FOR DELETE TO authenticated USING (auth.uid() = created_by_user);

-- RLS Policies for matches
CREATE POLICY "Users can view own matches" ON public.matches FOR SELECT TO authenticated USING (auth.uid() = player1 OR auth.uid() = player2);
CREATE POLICY "Admins can view all matches" ON public.matches FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create matches" ON public.matches FOR INSERT TO authenticated WITH CHECK (auth.uid() = player1 OR auth.uid() = player2);
CREATE POLICY "Players can update their matches" ON public.matches FOR UPDATE TO authenticated USING (auth.uid() = player1 OR auth.uid() = player2);

-- RLS Policies for experience_rules (public read)
CREATE POLICY "Anyone can view experience rules" ON public.experience_rules FOR SELECT USING (true);
CREATE POLICY "Admins can manage experience rules" ON public.experience_rules FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for penalty_logs
CREATE POLICY "Users can view own penalties" ON public.penalty_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all penalties" ON public.penalty_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage penalties" ON public.penalty_logs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for shop_categories (public read)
CREATE POLICY "Anyone can view categories" ON public.shop_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.shop_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for products (public read)
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for cart
CREATE POLICY "Users can view own cart" ON public.cart FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own cart" ON public.cart FOR ALL TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for favorites
CREATE POLICY "Users can view own favorites" ON public.favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own favorites" ON public.favorites FOR ALL TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for orders
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for order_items
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Users can create order items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Admins can view all order items" ON public.order_items FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for chat_rooms (public read)
CREATE POLICY "Anyone can view chat rooms" ON public.chat_rooms FOR SELECT USING (true);
CREATE POLICY "Admins can manage chat rooms" ON public.chat_rooms FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for messages
CREATE POLICY "Anyone can view messages" ON public.messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own messages" ON public.messages FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete any message" ON public.messages FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, trial_start_date, monthly_fee_due)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email,
    now(),
    now() + INTERVAL '3 months'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_courts_updated_at BEFORE UPDATE ON public.courts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_partner_requests_updated_at BEFORE UPDATE ON public.partner_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

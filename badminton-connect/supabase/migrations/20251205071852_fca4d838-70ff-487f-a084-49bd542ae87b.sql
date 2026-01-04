-- Update handle_new_user function to include level from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, gender, date_of_birth, level, trial_start_date, monthly_fee_due)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'gender',
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'date_of_birth' IS NOT NULL 
        AND NEW.raw_user_meta_data ->> 'date_of_birth' != '' 
      THEN (NEW.raw_user_meta_data ->> 'date_of_birth')::date
      ELSE NULL
    END,
    COALESCE((NEW.raw_user_meta_data ->> 'level')::user_level, 'beginner'::user_level),
    now(),
    now() + INTERVAL '3 months'
  );
  
  -- Assign admin role for specific email
  IF NEW.email = 'dupyae552@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$$;
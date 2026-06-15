ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;

DO $$ 
DECLARE
    const_name text;
BEGIN
    SELECT constraint_name INTO const_name 
    FROM information_schema.constraint_column_usage 
    WHERE table_name = 'profiles' AND column_name = 'status';
    
    IF const_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT ' || const_name;
    END IF;
END $$;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check CHECK (status IN ('active', 'inactive', 'suspended'));

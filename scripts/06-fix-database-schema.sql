-- Add missing avatar columns if they don't exist
DO $$ 
BEGIN
    -- Add user_avatar_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_settings' AND column_name = 'user_avatar_url') THEN
        ALTER TABLE user_settings ADD COLUMN user_avatar_url TEXT;
    END IF;
    
    -- Add buddy_avatar_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_settings' AND column_name = 'buddy_avatar_url') THEN
        ALTER TABLE user_settings ADD COLUMN buddy_avatar_url TEXT;
    END IF;
END $$;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

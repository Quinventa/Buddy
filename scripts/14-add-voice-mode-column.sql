-- Add voice_mode column to user_settings table
-- This script adds the new voice mode field to support traditional vs realtime voice modes

DO $$ 
BEGIN
    -- Add voice_mode column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_settings' 
        AND column_name = 'voice_mode'
    ) THEN
        ALTER TABLE user_settings 
        ADD COLUMN voice_mode TEXT DEFAULT 'traditional' CHECK (voice_mode IN ('traditional', 'realtime'));
        
        RAISE NOTICE 'Added voice_mode column to user_settings table';
    ELSE
        RAISE NOTICE 'voice_mode column already exists in user_settings table';
    END IF;
END $$;
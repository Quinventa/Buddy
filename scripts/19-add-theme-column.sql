-- Add theme column to user_settings table
-- This column will store the user's theme preference (light, dark, auto)

-- Add the column if it doesn't exist
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'auto';

-- Update any existing NULL values to default 'auto'
UPDATE user_settings 
SET theme = 'auto' 
WHERE theme IS NULL;

-- Add check constraint for valid theme values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'user_settings_theme_check'
    ) THEN
        ALTER TABLE user_settings 
        ADD CONSTRAINT user_settings_theme_check 
        CHECK (theme IN ('light', 'dark', 'auto'));
    END IF;
END $$;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
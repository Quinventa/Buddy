-- Add use_emojis column to user_settings table
-- This column will store the user's preference for using emojis in responses

-- Add the column if it doesn't exist
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS use_emojis BOOLEAN DEFAULT true;

-- Update any existing NULL values to default true
UPDATE user_settings 
SET use_emojis = true 
WHERE use_emojis IS NULL;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
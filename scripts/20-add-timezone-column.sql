-- Add timezone column to user_settings table
-- This allows users to set their timezone preference for displaying time
-- If Google Calendar is connected, the timezone is auto-synced from their Google account

-- Add timezone column if it doesn't exist
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Set default timezone for existing users who have NULL
UPDATE user_settings 
SET timezone = 'UTC' 
WHERE timezone IS NULL;

-- Refresh the schema cache so PostgREST picks up the new column
NOTIFY pgrst, 'reload schema';

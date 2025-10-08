-- Add avatar URL columns to user_settings table
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS user_avatar_url TEXT,
ADD COLUMN IF NOT EXISTS buddy_avatar_url TEXT;

-- Update existing users with default avatar URLs
UPDATE user_settings 
SET user_avatar_url = '/diverse-user-avatars.png',
    buddy_avatar_url = '/smiling-buddy-avatar.png'
WHERE user_avatar_url IS NULL OR buddy_avatar_url IS NULL;

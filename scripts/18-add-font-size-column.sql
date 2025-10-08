-- Add font_size column to user_settings table
-- Font size levels: tiny, small, medium, large, huge, massive
-- Default to 'large' for better accessibility for elderly users

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS font_size TEXT DEFAULT 'large' CHECK (font_size IN ('tiny', 'small', 'medium', 'large', 'huge', 'massive'));

-- Update any existing rows to have the default value
UPDATE user_settings 
SET font_size = 'large' 
WHERE font_size IS NULL;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Verify the column was added correctly
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_settings' AND column_name = 'font_size';


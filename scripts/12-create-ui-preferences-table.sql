-- Create ui_preferences table for user interface settings
-- This table will handle all UI-related preferences separately from core user settings

CREATE TABLE IF NOT EXISTS ui_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  show_how_to_use BOOLEAN DEFAULT true,
  manually_enabled_guide BOOLEAN DEFAULT false,
  theme_preference TEXT DEFAULT 'auto', -- for future dark/light mode
  sidebar_collapsed BOOLEAN DEFAULT false, -- for future sidebar state
  notification_style TEXT DEFAULT 'toast', -- for future notification preferences
  animation_enabled BOOLEAN DEFAULT true, -- for future animation toggles
  compact_mode BOOLEAN DEFAULT false, -- for future compact/spacious layouts
  language TEXT DEFAULT 'en', -- Language preference (en, nl, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_ui_preferences_user_id ON ui_preferences(user_id);

-- Enable Row Level Security
ALTER TABLE ui_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own UI preferences" ON ui_preferences;
DROP POLICY IF EXISTS "Users can insert their own UI preferences" ON ui_preferences;
DROP POLICY IF EXISTS "Users can update their own UI preferences" ON ui_preferences;
DROP POLICY IF EXISTS "Users can delete their own UI preferences" ON ui_preferences;

-- Create policy to allow users to only access their own UI preferences
CREATE POLICY "Users can view their own UI preferences" ON ui_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own UI preferences" ON ui_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own UI preferences" ON ui_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own UI preferences" ON ui_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Insert default UI preferences for existing users
INSERT INTO ui_preferences (user_id, show_how_to_use, manually_enabled_guide, language)
SELECT 
  id as user_id,
  true as show_how_to_use,
  false as manually_enabled_guide,
  'en' as language
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM ui_preferences WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

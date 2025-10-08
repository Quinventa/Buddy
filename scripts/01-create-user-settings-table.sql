-- Create user_settings table to replace localStorage buddy_settings_v1
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  tone TEXT DEFAULT 'warm',
  pace TEXT DEFAULT 'normal',
  humor_level INTEGER DEFAULT 3,
  blocked_topics TEXT[] DEFAULT '{}',
  backstory_enabled BOOLEAN DEFAULT true,
  ai_model TEXT DEFAULT 'auto',
  voice_enabled BOOLEAN DEFAULT true,
  selected_microphone TEXT,
  selected_voice TEXT,
  speech_rate REAL DEFAULT 1.0,
  speech_pitch REAL DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policy so users can only access their own settings
CREATE POLICY "Users can view their own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" ON user_settings
  FOR DELETE USING (auth.uid() = user_id);

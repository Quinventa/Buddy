-- Create calendar reminder preferences table
-- This table stores user preferences for when they want to be reminded of calendar events

CREATE TABLE IF NOT EXISTS user_calendar_reminder_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Default reminder time in minutes before the event
  default_reminder_minutes INTEGER DEFAULT 30,
  
  -- Whether calendar reminders are enabled at all
  reminders_enabled BOOLEAN DEFAULT true,
  
  -- Reminder method preferences
  show_notification BOOLEAN DEFAULT true,
  speak_reminder BOOLEAN DEFAULT true,
  
  -- Advanced preferences
  remind_for_all_day_events BOOLEAN DEFAULT true,
  all_day_event_reminder_time TIME DEFAULT '09:00:00', -- What time to remind for all-day events
  
  -- Available reminder time options (stored as JSON array of minutes)
  available_reminder_times JSONB DEFAULT '[1, 5, 15, 30, 45, 60, 120, 240, 480, 1440]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_calendar_reminder_preferences_user_id 
ON user_calendar_reminder_preferences(user_id);

-- Create unique constraint to ensure one preference record per user
ALTER TABLE user_calendar_reminder_preferences 
ADD CONSTRAINT unique_user_calendar_preferences 
UNIQUE (user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE user_calendar_reminder_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own calendar reminder preferences" 
ON user_calendar_reminder_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar reminder preferences" 
ON user_calendar_reminder_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar reminder preferences" 
ON user_calendar_reminder_preferences 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar reminder preferences" 
ON user_calendar_reminder_preferences 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_calendar_reminder_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_calendar_reminder_preferences_updated_at_trigger
  BEFORE UPDATE ON user_calendar_reminder_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_reminder_preferences_updated_at();

-- Insert default preferences for existing users
INSERT INTO user_calendar_reminder_preferences (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Add helpful comments
COMMENT ON TABLE user_calendar_reminder_preferences IS 'Stores user preferences for calendar event reminders';
COMMENT ON COLUMN user_calendar_reminder_preferences.default_reminder_minutes IS 'Default number of minutes before an event to remind the user';
COMMENT ON COLUMN user_calendar_reminder_preferences.available_reminder_times IS 'JSON array of available reminder time options in minutes: [1, 5, 15, 30, 45, 60, 120, 240, 480, 1440] = [1min, 5min, 15min, 30min, 45min, 1hr, 2hr, 4hr, 8hr, 24hr]';
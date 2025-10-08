-- Create calendar event reminders table
-- This table stores individual reminders scheduled for specific calendar events

CREATE TABLE IF NOT EXISTS calendar_event_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Google Calendar event details
  google_event_id TEXT NOT NULL,
  event_title TEXT NOT NULL,
  event_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  event_end_time TIMESTAMP WITH TIME ZONE,
  event_description TEXT,
  event_location TEXT,
  
  -- Reminder details
  reminder_time TIMESTAMP WITH TIME ZONE NOT NULL,
  minutes_before_event INTEGER NOT NULL,
  
  -- Reminder status
  is_triggered BOOLEAN DEFAULT false,
  triggered_at TIMESTAMP WITH TIME ZONE,
  is_dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  
  -- Reminder content
  reminder_message TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_calendar_reminders_user_id 
ON calendar_event_reminders(user_id);

CREATE INDEX IF NOT EXISTS idx_calendar_reminders_reminder_time 
ON calendar_event_reminders(reminder_time);

CREATE INDEX IF NOT EXISTS idx_calendar_reminders_google_event 
ON calendar_event_reminders(google_event_id);

CREATE INDEX IF NOT EXISTS idx_calendar_reminders_pending 
ON calendar_event_reminders(reminder_time) 
WHERE is_triggered = false AND is_dismissed = false;

-- Create unique constraint to prevent duplicate reminders for the same event
ALTER TABLE calendar_event_reminders 
ADD CONSTRAINT unique_user_event_reminder 
UNIQUE (user_id, google_event_id, minutes_before_event);

-- Enable RLS (Row Level Security)
ALTER TABLE calendar_event_reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own calendar reminders" 
ON calendar_event_reminders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar reminders" 
ON calendar_event_reminders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar reminders" 
ON calendar_event_reminders 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar reminders" 
ON calendar_event_reminders 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_calendar_reminders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_calendar_reminders_updated_at_trigger
  BEFORE UPDATE ON calendar_event_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_reminders_updated_at();

-- Create function to generate reminder message
CREATE OR REPLACE FUNCTION generate_reminder_message(
  event_title TEXT,
  event_start_time TIMESTAMP WITH TIME ZONE,
  event_location TEXT,
  minutes_before INTEGER
) RETURNS TEXT AS $$
DECLARE
  time_text TEXT;
  location_text TEXT := '';
BEGIN
  -- Format the time
  time_text := to_char(event_start_time AT TIME ZONE 'UTC', 'HH24:MI');
  
  -- Add location if provided
  IF event_location IS NOT NULL AND event_location != '' THEN
    location_text := ' at ' || event_location;
  END IF;
  
  -- Generate the reminder message
  IF minutes_before = 1 THEN
    RETURN 'Reminder: "' || event_title || '" starts in 1 minute at ' || time_text || location_text || '.';
  ELSIF minutes_before < 60 THEN
    RETURN 'Reminder: "' || event_title || '" starts in ' || minutes_before || ' minutes at ' || time_text || location_text || '.';
  ELSIF minutes_before = 60 THEN
    RETURN 'Reminder: "' || event_title || '" starts in 1 hour at ' || time_text || location_text || '.';
  ELSE
    RETURN 'Reminder: "' || event_title || '" starts in ' || (minutes_before / 60) || ' hours at ' || time_text || location_text || '.';
  END IF;
END;
$$ language 'plpgsql';

-- Add helpful comments
COMMENT ON TABLE calendar_event_reminders IS 'Stores individual reminders for specific calendar events';
COMMENT ON COLUMN calendar_event_reminders.google_event_id IS 'The unique ID of the event from Google Calendar';
COMMENT ON COLUMN calendar_event_reminders.reminder_time IS 'When this reminder should be triggered';
COMMENT ON COLUMN calendar_event_reminders.minutes_before_event IS 'How many minutes before the event this reminder is set for';
COMMENT ON FUNCTION generate_reminder_message IS 'Generates a friendly reminder message for calendar events';
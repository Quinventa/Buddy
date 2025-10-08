-- Add language column to existing ui_preferences table
-- This is a separate migration to add language support

-- Add the language column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ui_preferences' 
        AND column_name = 'language'
    ) THEN 
        ALTER TABLE ui_preferences ADD COLUMN language TEXT DEFAULT 'en';
    END IF; 
END $$;

-- Update existing records to have default language
UPDATE ui_preferences 
SET language = 'en' 
WHERE language IS NULL;

-- Add check constraint for supported languages
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'ui_preferences_language_check'
    ) THEN
        ALTER TABLE ui_preferences 
        ADD CONSTRAINT ui_preferences_language_check 
        CHECK (language IN ('en', 'nl'));
    END IF;
END $$;
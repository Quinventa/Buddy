-- Add show_how_to_use column to user_settings table
-- This column controls whether the how-to-use guide button is displayed

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS show_how_to_use BOOLEAN DEFAULT true;

-- Add manually_enabled_guide column to track if user re-enabled guide from settings
-- This prevents the finish button from hiding the guide if user intentionally enabled it

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS manually_enabled_guide BOOLEAN DEFAULT false;

-- Update existing users to show the guide by default
UPDATE user_settings 
SET show_how_to_use = true 
WHERE show_how_to_use IS NULL;

-- Update existing users to have manually_enabled_guide as false by default
UPDATE user_settings 
SET manually_enabled_guide = false 
WHERE manually_enabled_guide IS NULL;
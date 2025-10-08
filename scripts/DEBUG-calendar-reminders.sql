-- 🔍 CALENDAR REMINDER DEBUGGING QUERIES
-- Run these in Supabase Dashboard → SQL Editor to debug calendar reminder issues

-- ========================================
-- 1. CHECK YOUR GOOGLE CONNECTION STATUS
-- ========================================
SELECT 
  provider,
  email,
  expires_at,
  CASE 
    WHEN expires_at::timestamp > NOW() THEN '✅ Valid'
    ELSE '❌ EXPIRED - Need to reconnect!'
  END as token_status,
  last_used_at,
  is_active,
  connected_at
FROM user_connected_accounts
WHERE user_id = '5ddad2a7-32d6-4567-8f84-38c4605a58fd'
AND provider = 'google';

-- ========================================
-- 2. CHECK REMINDER PREFERENCES
-- ========================================
SELECT 
  reminders_enabled,
  default_reminder_minutes,
  all_day_event_reminder_time,
  remind_for_all_day_events,
  created_at,
  updated_at
FROM user_calendar_reminder_preferences
WHERE user_id = '5ddad2a7-32d6-4567-8f84-38c4605a58fd';

-- If no results, create default preferences:
/*
INSERT INTO user_calendar_reminder_preferences (
  user_id,
  reminders_enabled,
  default_reminder_minutes,
  all_day_event_reminder_time,
  remind_for_all_day_events
) VALUES (
  '5ddad2a7-32d6-4567-8f84-38c4605a58fd',
  true,
  15,  -- Remind 15 minutes before event
  '09:00',
  true
) ON CONFLICT (user_id) DO NOTHING;
*/

-- ========================================
-- 3. VIEW ALL YOUR REMINDERS
-- ========================================
SELECT 
  event_title,
  event_start_time AT TIME ZONE 'Europe/Istanbul' as event_start_istanbul,
  reminder_time AT TIME ZONE 'Europe/Istanbul' as reminder_time_istanbul,
  minutes_before_event,
  is_triggered,
  is_dismissed,
  triggered_at,
  created_at AT TIME ZONE 'Europe/Istanbul' as created_at_istanbul,
  CASE 
    WHEN is_triggered THEN '✅ Already triggered'
    WHEN is_dismissed THEN '❌ Dismissed'
    WHEN reminder_time::timestamp <= NOW() THEN '🔔 SHOULD TRIGGER NOW!'
    ELSE '⏰ Scheduled for future'
  END as status
FROM calendar_event_reminders
WHERE user_id = '5ddad2a7-32d6-4567-8f84-38c4605a58fd'
ORDER BY event_start_time DESC
LIMIT 20;

-- ========================================
-- 4. VIEW PENDING (UNTRIGGERED) REMINDERS
-- ========================================
SELECT 
  event_title,
  event_start_time AT TIME ZONE 'Europe/Istanbul' as event_time,
  reminder_time AT TIME ZONE 'Europe/Istanbul' as reminder_time,
  minutes_before_event,
  NOW() AT TIME ZONE 'Europe/Istanbul' as current_time,
  EXTRACT(EPOCH FROM (reminder_time::timestamp - NOW())) / 60 as minutes_until_reminder,
  google_event_id
FROM calendar_event_reminders
WHERE user_id = '5ddad2a7-32d6-4567-8f84-38c4605a58fd'
AND is_triggered = false
AND is_dismissed = false
ORDER BY reminder_time ASC;

-- ========================================
-- 5. CHECK IF REMINDERS ARE DUE NOW
-- ========================================
SELECT 
  event_title,
  reminder_time AT TIME ZONE 'Europe/Istanbul' as reminder_time,
  NOW() AT TIME ZONE 'Europe/Istanbul' as current_time,
  CASE 
    WHEN reminder_time::timestamp <= NOW() THEN '🔔 DUE NOW - Should trigger!'
    ELSE '⏰ Not yet due'
  END as trigger_status,
  minutes_before_event
FROM calendar_event_reminders
WHERE user_id = '5ddad2a7-32d6-4567-8f84-38c4605a58fd'
AND is_triggered = false
AND is_dismissed = false
AND reminder_time::timestamp <= NOW()
ORDER BY reminder_time ASC;

-- ========================================
-- 6. DELETE OLD/TEST REMINDERS (CLEANUP)
-- ========================================
-- Uncomment to delete old reminders (be careful!)
/*
DELETE FROM calendar_event_reminders
WHERE user_id = '5ddad2a7-32d6-4567-8f84-38c4605a58fd'
AND event_start_time < NOW() - INTERVAL '7 days';  -- Delete events older than 7 days
*/

-- ========================================
-- 7. DELETE ALL REMINDERS (FRESH START)
-- ========================================
-- Uncomment for a complete fresh start (be careful!)
/*
DELETE FROM calendar_event_reminders
WHERE user_id = '5ddad2a7-32d6-4567-8f84-38c4605a58fd';
*/

-- ========================================
-- 8. MANUALLY TRIGGER A REMINDER FOR TESTING
-- ========================================
-- This marks a reminder as untriggered so it will fire again
/*
UPDATE calendar_event_reminders
SET 
  is_triggered = false,
  triggered_at = NULL,
  reminder_time = NOW() - INTERVAL '1 minute'  -- Set to 1 minute ago so it triggers immediately
WHERE user_id = '5ddad2a7-32d6-4567-8f84-38c4605a58fd'
AND event_title = 'YOUR_EVENT_TITLE_HERE'  -- Replace with your event title
AND is_triggered = true;
*/

-- ========================================
-- 9. CREATE A TEST REMINDER MANUALLY
-- ========================================
-- Creates a reminder that should trigger in 1 minute
/*
INSERT INTO calendar_event_reminders (
  user_id,
  google_event_id,
  event_title,
  event_start_time,
  reminder_time,
  minutes_before_event,
  reminder_message,
  is_triggered,
  is_dismissed
) VALUES (
  '5ddad2a7-32d6-4567-8f84-38c4605a58fd',
  'test-' || EXTRACT(EPOCH FROM NOW())::text,  -- Unique ID
  'Test Reminder',
  NOW() + INTERVAL '16 minutes',  -- Event in 16 minutes
  NOW() + INTERVAL '1 minute',    -- Reminder in 1 minute
  15,
  'Test reminder: You have Test Reminder in 15 minutes',
  false,
  false
);
*/

-- ========================================
-- 10. CHECK TIMEZONE SETTING
-- ========================================
SELECT 
  timezone,
  created_at,
  updated_at
FROM user_settings
WHERE user_id = '5ddad2a7-32d6-4567-8f84-38c4605a58fd';

-- ========================================
-- COMMON ISSUES AND SOLUTIONS
-- ========================================

/*
❌ ISSUE: No reminders in database
✅ SOLUTION: 
   1. Check query #1 - If token is expired, disconnect and reconnect Google Calendar
   2. Wait 2 minutes for system to fetch events from Google
   3. Run query #3 to verify reminders are created

❌ ISSUE: Reminders exist but not triggering
✅ SOLUTION:
   1. Run query #5 to see if they're due
   2. Check console logs for "[v0] 🔄 Buddy-app checking for calendar reminders"
   3. Make sure app tab is open and active
   4. Refresh the page

❌ ISSUE: "Found 0 upcoming events" in console
✅ SOLUTION:
   1. Run query #1 to check token status
   2. If expired: Disconnect and reconnect Google Calendar
   3. Create a test event in Google Calendar
   4. Wait 2 minutes for system to detect it

❌ ISSUE: Reminders trigger multiple times
✅ SOLUTION:
   1. This shouldn't happen - check if is_triggered is being set
   2. Look for errors in console logs
   3. Refresh the page

❌ ISSUE: Wrong reminder time
✅ SOLUTION:
   1. Run query #10 to check timezone setting
   2. Make sure timezone is set to 'Europe/Istanbul'
   3. Run query #2 to check default_reminder_minutes
   4. Change in Settings → Connections → Calendar Reminder Settings
*/

-- ========================================
-- QUICK DIAGNOSTIC
-- ========================================
-- Run this one query to get a complete overview
SELECT 
  '🔗 Google Connection' as check_type,
  CASE 
    WHEN ca.expires_at::timestamp > NOW() THEN '✅ Valid token'
    ELSE '❌ Token expired - Reconnect Google Calendar!'
  END as status,
  ca.email as detail
FROM user_connected_accounts ca
WHERE ca.user_id = '5ddad2a7-32d6-4567-8f84-38c4605a58fd'
AND ca.provider = 'google'

UNION ALL

SELECT 
  '⚙️ Reminder Preferences',
  CASE 
    WHEN crp.reminders_enabled THEN '✅ Enabled'
    ELSE '❌ Disabled - Enable in settings!'
  END,
  crp.default_reminder_minutes::text || ' minutes before event'
FROM user_calendar_reminder_preferences crp
WHERE crp.user_id = '5ddad2a7-32d6-4567-8f84-38c4605a58fd'

UNION ALL

SELECT 
  '📅 Total Reminders',
  '✅ ' || COUNT(*)::text || ' reminders',
  COUNT(CASE WHEN is_triggered THEN 1 END)::text || ' triggered, ' ||
  COUNT(CASE WHEN NOT is_triggered AND NOT is_dismissed THEN 1 END)::text || ' pending'
FROM calendar_event_reminders
WHERE user_id = '5ddad2a7-32d6-4567-8f84-38c4605a58fd'

UNION ALL

SELECT 
  '🔔 Reminders Due Now',
  CASE 
    WHEN COUNT(*) > 0 THEN '⚠️ ' || COUNT(*)::text || ' reminders should trigger!'
    ELSE '✅ No reminders due'
  END,
  STRING_AGG(event_title, ', ')
FROM calendar_event_reminders
WHERE user_id = '5ddad2a7-32d6-4567-8f84-38c4605a58fd'
AND is_triggered = false
AND is_dismissed = false
AND reminder_time::timestamp <= NOW()

UNION ALL

SELECT 
  '🕐 Timezone',
  '✅ ' || COALESCE(us.timezone, 'NOT SET'),
  'Used for reminder calculations'
FROM user_settings us
WHERE us.user_id = '5ddad2a7-32d6-4567-8f84-38c4605a58fd';

# Calendar Reminder Diagnostic Guide

## Problem: Not Receiving Calendar Reminders

### Step 1: Check Browser Console Logs

Open your browser console (F12 → Console tab) and look for these messages:

#### ✅ **What You SHOULD See:**
```
[CALENDAR-REMINDER] Starting calendar event monitoring for user: <user-id> with timezone: <timezone>
[CALENDAR-REMINDER] Checking for upcoming events to schedule reminders...
[CALENDAR-REMINDER] Found X upcoming events
[CALENDAR-REMINDER] ✅ Successfully created reminder for event: <event-name>
[v0] 🔄 Buddy-app checking for calendar reminders at: <timestamp>
```

#### ❌ **Problem Indicators:**
- **"No Google Calendar access token found"** → Go to Step 2
- **"Access token expired"** → Go to Step 3
- **"Found 0 upcoming events"** → Go to Step 4
- **"Reminders disabled for user"** → Go to Step 5
- **"Reminder already exists for event"** → Go to Step 6

---

### Step 2: Check Google Calendar Connection

**Issue:** Not connected to Google Calendar

**Solution:**
1. Open Settings (gear icon)
2. Scroll to "Connections" section
3. Look for Google Calendar status
4. If not connected or showing "Already Connected" but not working:
   - Click "Disconnect Google Calendar" (if visible)
   - Wait 2 seconds
   - Click "Connect Google Calendar"
   - Sign in with your Google account
   - **Grant calendar permissions** when asked
5. Refresh the page

---

### Step 3: Token Expired - Reconnect

**Issue:** Google tokens expired (happens after 6 months or security changes)

**Solution:**
1. Settings → Connections
2. Disconnect Google Calendar
3. Reconnect and grant permissions
4. Check console for: "Token refresh successful"

---

### Step 4: No Events Found

**Issue:** System can't see your Google Calendar events

**Possible Causes:**
1. **Wrong Calendar:** Check if the event is in your PRIMARY Google Calendar
2. **Private Event:** Make sure event is not set to "Private"
3. **Different Account:** Verify you connected the right Google account
4. **Event Time:** Event must be within next 7 days

**Check Console For:**
```
[CALENDAR-REMINDER] Failed to fetch calendar events: 403
```
If you see 403, you didn't grant calendar permissions.

**Solution:**
1. Go to Google Calendar (calendar.google.com)
2. Verify the event exists in your PRIMARY calendar
3. If event is in a different calendar, move it to primary
4. Reconnect Google Calendar and grant ALL permissions

---

### Step 5: Reminders Disabled

**Issue:** Calendar reminders are turned off in settings

**Solution:**
1. Settings → Calendar Reminders section
2. Toggle "Enable Calendar Reminders" to ON
3. Set "Default Reminder Time" (30 minutes recommended)
4. Click "Save Settings"
5. Check console for: "Settings Saved"

---

### Step 6: Reminder Already Created But Not Triggering

**Issue:** Reminder exists in database but notification didn't appear

**Run SQL Diagnostic:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run this query:

```sql
-- Check your pending reminders
SELECT 
  event_title,
  event_start_time AT TIME ZONE 'America/New_York' AS event_time_local,
  reminder_time AT TIME ZONE 'America/New_York' AS reminder_time_local,
  minutes_before_event,
  is_triggered,
  triggered_at,
  CASE 
    WHEN reminder_time <= NOW() THEN 'SHOULD HAVE TRIGGERED'
    ELSE 'NOT YET DUE'
  END AS status,
  EXTRACT(EPOCH FROM (reminder_time - NOW())) / 60 AS minutes_until_reminder
FROM calendar_event_reminders
WHERE user_id = auth.uid()
  AND is_triggered = false
  AND is_dismissed = false
ORDER BY reminder_time ASC;
```

**Replace `America/New_York` with your timezone!**

**Interpret Results:**
- **"SHOULD HAVE TRIGGERED"**: Reminder is overdue - check if monitoring is running
- **"NOT YET DUE"**: Reminder will trigger when time comes
- **No rows**: No reminders scheduled - system didn't detect your event

---

### Step 7: Force Manual Check

**In Browser Console, run:**
```javascript
// Check if monitoring is running
console.log(window.reminderCheckInterval ? "✅ Monitoring ACTIVE" : "❌ Monitoring INACTIVE")

// Check calendar status
const { createClient } = await import('./lib/supabase')
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
console.log("User ID:", user?.id)

// Check for connected account
const { data: account } = await supabase
  .from('user_connected_accounts')
  .select('*')
  .eq('user_id', user.id)
  .eq('provider', 'google')
  .single()
console.log("Google Account:", account)

// Check preferences
const { data: prefs } = await supabase
  .from('user_calendar_reminder_preferences')
  .select('*')
  .eq('user_id', user.id)
  .single()
console.log("Preferences:", prefs)
```

---

### Step 8: Common Issues

#### Issue: "Reminder time already passed"
**Cause:** You're testing with an event that's too soon
**Solution:** Create a test event at least 35 minutes in the future (30 min reminder + 5 min buffer)

#### Issue: Console shows "Created reminder" but no notification
**Cause:** Notification panel might be hidden or browser notifications blocked
**Solution:** 
- Check if notification bell icon shows a number
- Check browser notification permissions
- Make sure page is not in background tab when reminder triggers

#### Issue: Multiple reminders for same event
**Cause:** Page refreshed multiple times
**Solution:** System prevents duplicates - only first reminder will trigger

---

### Step 9: Test With Fresh Event

1. **Create Test Event:**
   - Go to Google Calendar
   - Create new event: "Test Reminder"
   - Set time: **35 minutes from now**
   - Save event

2. **Wait 2 Minutes:**
   - System checks for new events every 2 minutes
   - Watch console for: "Found 1 upcoming events"
   - Should see: "✅ Successfully created reminder for event: Test Reminder"

3. **Wait for Reminder Time:**
   - System checks every 10 seconds for due reminders
   - When current time reaches (event_time - 30 minutes), notification will appear

---

### Step 10: Nuclear Option - Full Reset

If nothing works:

1. **Clear All Data:**
```sql
-- Run in Supabase SQL Editor
DELETE FROM calendar_event_reminders WHERE user_id = auth.uid();
DELETE FROM user_calendar_reminder_preferences WHERE user_id = auth.uid();
```

2. **Disconnect Everything:**
   - Settings → Connections → Disconnect Google Calendar
   - Sign out of the app
   - Clear browser cache for your app's domain

3. **Fresh Start:**
   - Sign in with Google
   - Grant ALL permissions
   - Go to Settings → Calendar Reminders
   - Enable reminders, set 30 minutes
   - Save settings
   - Create test event 35 minutes in future
   - Wait and observe console logs

---

## Key Timing Facts

- **Event Check Interval:** Every 2 minutes
- **Reminder Check Interval:** Every 10 seconds  
- **Default Reminder Time:** 30 minutes before event
- **Customizable Range:** 1 minute to 1 day before event

## Expected Log Flow

For an event at 8:00 PM with 30-minute reminder:

```
7:25 PM: [CALENDAR-REMINDER] Found 1 upcoming events
7:25 PM: [CALENDAR-REMINDER] ✅ Created reminder (will trigger at 7:30 PM)
7:30 PM: [v0] 📋 Found 1 triggered calendar reminders
7:30 PM: [v0] Created notification and chat message
7:30 PM: 🔊 About to speak reminder
```

---

## Still Not Working?

Open browser console and take a screenshot of ALL logs, then share:
1. Full console output from page load
2. Your timezone setting (Settings → Timezone dropdown)
3. Screenshot of Google Calendar showing the event
4. Result of the SQL diagnostic query

This will help identify the exact issue!

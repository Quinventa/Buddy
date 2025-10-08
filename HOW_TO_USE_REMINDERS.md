# ✅ HOW TO MAKE CALENDAR REMINDERS WORK - SIMPLE GUIDE

## 🚀 Quick Setup (Do This First!)

### Step 1: Fix Your Google Connection (2 minutes)

Your tokens expired on **Sept 29, 2025**. Here's how to fix it:

1. **Open your app** → Go to **Settings** (gear icon top right)
2. Scroll down to **"Connections"** section
3. Find the Google Calendar card
4. Click **"Disconnect"** (red button)
5. Click **"Connect Google"** (blue button)
6. **Sign in** with your Google account
7. **Grant calendar permissions**
8. **Done!** Wait for redirect

✅ **Check if it worked:**
- Open browser console (F12)
- Look for: `✅ [CALENDAR-REMINDER] Found X upcoming events` (X > 0)
- If you see this, connection is working!

---

### Step 2: Run the SQL Migration (1 minute)

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy contents of `scripts/20-add-timezone-column.sql`
3. **Run it**
4. You should see: "Success. No rows returned"

✅ **This adds timezone support to your database**

---

### Step 3: Create a Test Event (1 minute)

1. Open **Google Calendar**
2. **Create new event**:
   - Title: "Test Reminder"
   - Time: **5 minutes from now** (e.g., if it's 7:10 PM, set for 7:15 PM)
   - Save event

3. **Go back to your app**
4. **Wait 2 minutes** (system checks every 2 minutes)

---

### Step 4: Verify Reminder Was Created (30 seconds)

1. Open browser console (F12)
2. Look for these logs:

```
✅ [CALENDAR-REMINDER] Found 1 upcoming events
✅ [CALENDAR-REMINDER] ✅ Successfully created reminder for event: Test Reminder
✅ [CALENDAR-REMINDER] 📅 Event time: 7:15:00 PM
✅ [CALENDAR-REMINDER] ⏰ Reminder will trigger at: 7:00:00 PM
```

If you see this, **reminder is created!** ✅

---

### Step 5: Wait for Reminder to Trigger

**Default reminder time: 15 minutes before event**

So if your event is at 7:15 PM, reminder triggers at 7:00 PM.

**What happens at 7:00 PM:**
- 🔔 **Notification appears** in top right
- 🗣️ **Bot speaks**: "Calendar reminder: You have Test Reminder in 15 minutes"
- 💬 **Chat message** appears with reminder details

---

## ⚙️ How to Change Reminder Time

**Current default: 15 minutes before event**

To change it:

### Option 1: In Supabase (Permanent)

Run in **Supabase → SQL Editor**:

```sql
-- Change to 30 minutes before
UPDATE user_calendar_reminder_preferences
SET default_reminder_minutes = 30
WHERE user_id = '5ddad2a7-32d6-4567-8f84-38c4605a58fd';

-- Or 10 minutes before
UPDATE user_calendar_reminder_preferences
SET default_reminder_minutes = 10
WHERE user_id = '5ddad2a7-32d6-4567-8f84-38c4605a58fd';

-- Or 5 minutes before
UPDATE user_calendar_reminder_preferences
SET default_reminder_minutes = 5
WHERE user_id = '5ddad2a7-32d6-4567-8f84-38c4605a58fd';
```

### Option 2: UI Settings (Coming Soon)

I can add a settings panel for this if you want! Just ask.

---

## 🔍 Debugging - If Reminders Don't Work

### Problem 1: No reminders triggering

**Run this in Supabase SQL Editor:**

```sql
-- Copy from scripts/DEBUG-calendar-reminders.sql
-- Run the "QUICK DIAGNOSTIC" query at the bottom
```

This shows:
- ✅/❌ Google connection status
- ✅/❌ Reminder preferences
- ✅/❌ Number of reminders in database
- ✅/❌ Timezone setting

### Problem 2: "Found 0 upcoming events"

**Cause:** Google token expired or no events in calendar

**Fix:**
1. Disconnect and reconnect Google Calendar
2. Create an event in Google Calendar
3. Wait 2 minutes
4. Check console logs

### Problem 3: Reminder created but didn't trigger

**Check in Supabase SQL Editor:**

```sql
SELECT 
  event_title,
  reminder_time AT TIME ZONE 'Europe/Istanbul' as reminder_time,
  NOW() AT TIME ZONE 'Europe/Istanbul' as current_time,
  is_triggered
FROM calendar_event_reminders
WHERE user_id = '5ddad2a7-32d6-4567-8f84-38c4605a58fd'
AND is_triggered = false
ORDER BY reminder_time DESC
LIMIT 5;
```

If `reminder_time` < `current_time` but `is_triggered = false`:
- Reminder should have triggered but didn't
- **Fix:** Refresh your app page
- System checks every **10 seconds** now (was 30 seconds)

---

## 📊 System Behavior

### How Often Things Happen:

| Action | Frequency |
|--------|-----------|
| Check Google Calendar for new events | Every 2 minutes |
| Check database for pending reminders | Every 10 seconds |
| Token auto-refresh | When needed (before expiration) |
| Manual check on tab focus | When you switch back to tab |

### What Gets Logged in Console:

**When working correctly:**

```javascript
// Every 2 minutes:
[CALENDAR-REMINDER] Checking for upcoming events to schedule reminders...
[CALENDAR-REMINDER] Found 3 upcoming events

// Every 10 seconds:
[v0] 🔄 Buddy-app checking for calendar reminders at: 2025-10-02T...
[v0] 📋 Found 0 triggered calendar reminders

// When reminder triggers:
[v0] 📋 Found 1 triggered calendar reminders
[CALENDAR-REMINDER] ✅ Successfully triggered reminder: Test Reminder
🔊 [CalendarReminder] About to speak reminder: Test Reminder
🔊 [CalendarReminder] Finished speaking reminder
```

---

## 🎯 Complete Test Flow

### 1. Current Time: 7:10 PM

Create event at **7:40 PM** in Google Calendar

### 2. Current Time: 7:12 PM (2 minutes later)

System checks Google Calendar:
```
[CALENDAR-REMINDER] Found 1 upcoming events
[CALENDAR-REMINDER] Event time: 7:40 PM
[CALENDAR-REMINDER] Reminder will trigger at: 7:25 PM (15 min before)
[CALENDAR-REMINDER] ✅ Successfully created reminder
```

### 3. Current Time: 7:25 PM

System checks pending reminders (every 10 seconds):
```
[v0] 🔄 Checking for calendar reminders
[v0] Current time: 7:25:05 PM
[v0] Found 1 pending reminder
[CALENDAR-REMINDER] Processing reminder: Your Event
[CALENDAR-REMINDER] ✅ Successfully triggered reminder
```

### 4. You See:
- 🔔 Notification in top right corner
- 🗣️ Bot speaks the reminder
- 💬 Chat message appears
- ✅ Reminder marked as triggered (won't repeat)

---

## 🆘 Still Not Working?

### Last Resort - Manual Test:

Run this in **Supabase SQL Editor** to create a test reminder that triggers in 30 seconds:

```sql
-- Create test reminder
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
  'manual-test-' || EXTRACT(EPOCH FROM NOW())::text,
  'Manual Test Reminder',
  NOW() + INTERVAL '15 minutes 30 seconds',
  NOW() + INTERVAL '30 seconds',
  15,
  'Test reminder: You have Manual Test Reminder in 15 minutes',
  false,
  false
);
```

**Wait 30 seconds** - reminder should trigger!

If it doesn't:
1. Check if app tab is open and active
2. Check console for errors
3. Refresh the page
4. Check console for reminder checking logs

---

## ✨ Summary

**What I Fixed:**

1. ✅ **Added timezone support** - Reminders respect your timezone (Europe/Istanbul)
2. ✅ **Increased check frequency** - Now checks every 10 seconds (was 30)
3. ✅ **Better logging** - See exactly what's happening in console
4. ✅ **Better error handling** - Clear messages when things go wrong
5. ✅ **Edge case handling** - Works even if reminder time is very close
6. ✅ **Connection status fix** - Shows "Already Connected" when logged in with Google

**What You Need to Do:**

1. **Disconnect and reconnect Google Calendar** (tokens expired Sept 29)
2. **Run SQL migration** (`scripts/20-add-timezone-column.sql`)
3. **Create test event** 5 minutes from now
4. **Wait and verify** reminder triggers

**After that, it will work automatically for all your Google Calendar events!** 🎉

---

## 📝 Files Created/Updated

- ✅ `scripts/DEBUG-calendar-reminders.sql` - SQL queries for debugging
- ✅ `CALENDAR_REMINDER_DEBUG_GUIDE.md` - Detailed technical guide
- ✅ `HOW_TO_USE_REMINDERS.md` - This simple guide (this file)
- ✅ Updated reminder checking (10 seconds instead of 30)
- ✅ Added detailed logging throughout system
- ✅ Fixed timezone handling
- ✅ Fixed connection button logic

**Everything is ready!** Just reconnect Google Calendar and it will work! 🚀

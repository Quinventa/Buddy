# 🐛 Calendar Reminder Debugging Guide

## Issue: Event at 7:40 PM, Current Time 7:10 PM, No Reminder

### 🔍 Root Cause Analysis

Based on your logs, the issue is:

```
[CALENDAR-REMINDER] Token refresh failed: 400 Bad Request
[CALENDAR-REMINDER] Found 0 upcoming events
```

**Your Google OAuth tokens expired on 2025-09-29, but today is 2025-10-02.**

When tokens are expired:
- ❌ Can't fetch calendar events from Google
- ❌ No events = No reminders created
- ❌ System doesn't know about your 7:40 PM event

---

## ✅ **Solution: Reconnect Google Calendar**

### Step 1: Disconnect Google Calendar
1. Open your app
2. Go to **Settings** → **Connections** 
3. Find the Google connection card
4. Click **"Disconnect"** button (red button on the right)
5. Confirm disconnection

### Step 2: Reconnect Google Calendar
1. In the same **Connections** section
2. You should now see **"Connect"** button instead of "Already Connected"
3. Click **"Connect Google"**
4. Sign in with your Google account
5. Grant calendar permissions
6. Wait for redirect back to your app

### Step 3: Verify Connection
Check console logs for:
```javascript
✅ [CALENDAR-REMINDER] Starting calendar event monitoring for user: <id> with timezone: Europe/Istanbul
✅ [CALENDAR-REMINDER] Found X upcoming events  // Should show your events!
✅ [CALENDAR-REMINDER] Created reminder for event: <Your Event> at <Time>
```

### Step 4: Test Reminder
1. Create a test event in Google Calendar for 5 minutes from now
2. Wait for reminder to trigger
3. You should see:
   - 🔔 Notification in the app
   - Bot speaks the reminder
   - Chat message appears

---

## 🕐 How Reminders Work

### Event at 7:40 PM, Reminder at 7:25 PM (15 min before)

```
Current Time: 7:10 PM
   ↓
System checks Google Calendar every 2 minutes
   ↓
Finds event at 7:40 PM
   ↓
Calculates reminder time: 7:40 PM - 15 min = 7:25 PM
   ↓
Saves reminder to database with trigger time: 7:25 PM
   ↓
At 7:25 PM: Checks database for pending reminders
   ↓
Finds reminder due at 7:25 PM (current time >= reminder time)
   ↓
🔔 TRIGGERS REMINDER:
   - Shows notification
   - Bot speaks: "You have Meeting Name in 15 minutes"
   - Adds chat message
```

### Default Settings:
- **Reminder Time**: 15 minutes before event
- **Check Interval**: Every 2 minutes for new events
- **Trigger Check**: Every 30 seconds for pending reminders
- **Timezone**: Your selected timezone (Europe/Istanbul)

---

## 🔧 Advanced Debugging

### Check Database for Reminders

Run this in **Supabase Dashboard → SQL Editor**:

```sql
-- See all your reminders
SELECT 
  event_title,
  event_start_time,
  reminder_time,
  minutes_before_event,
  is_triggered,
  is_dismissed,
  created_at
FROM calendar_event_reminders
WHERE user_id = '5ddad2a7-32d6-4567-8f84-38c4605a58fd'
ORDER BY reminder_time DESC
LIMIT 10;
```

### Check Token Status

```sql
-- Check your Google connection
SELECT 
  provider,
  email,
  expires_at,
  last_used_at,
  is_active,
  created_at
FROM user_connected_accounts
WHERE user_id = '5ddad2a7-32d6-4567-8f84-38c4605a58fd'
AND provider = 'google';
```

If `expires_at` is in the past → Token expired, need to reconnect!

### Console Log Checklist

When everything is working, you should see:

**On App Load:**
```javascript
[CALENDAR-REMINDER] Starting calendar event monitoring for user: <id> with timezone: Europe/Istanbul
[CALENDAR-REMINDER] Checking for upcoming events to schedule reminders...
[CALENDAR-REMINDER] Found X upcoming events
[CALENDAR-REMINDER] Created reminder for event: <Event> at <Time>
[CALENDAR-REMINDER] Monitoring started
```

**Every 2 Minutes:**
```javascript
[CALENDAR-REMINDER] Checking for upcoming events to schedule reminders...
[CALENDAR-REMINDER] Found X upcoming events
```

**Every 30 Seconds:**
```javascript
[CALENDAR-REMINDER] Checking for pending reminders at: <ISO Timestamp>
[CALENDAR-REMINDER] Found Y pending reminders
```

**When Reminder Triggers:**
```javascript
[CALENDAR-REMINDER] Processing reminder: <Event Title> scheduled for: <Time>
[CALENDAR-REMINDER] ✅ Successfully triggered reminder: <Event Title>
🔊 [CalendarReminder] Speaking reminder: <Message>
🔊 [CalendarReminder] Finished speaking reminder
```

---

## ⚠️ Common Issues

### Issue 1: "Found 0 upcoming events" but I have events
**Cause**: Token expired or calendar not connected  
**Fix**: Disconnect and reconnect Google Calendar

### Issue 2: Events found but no reminder triggered
**Cause**: Reminder time already passed  
**Check**: Console shows "Skip if reminder time is in the past"  
**Fix**: Create new event with future time

### Issue 3: Reminder created but not triggering
**Cause**: Database trigger check not running  
**Check**: Look for `[CALENDAR-REMINDER] Checking for pending reminders at:`  
**Fix**: Refresh page, check if calendar monitoring is started

### Issue 4: Wrong timezone for reminder
**Cause**: Timezone setting not saved to database  
**Fix**: Run SQL migration `scripts/20-add-timezone-column.sql`  
**Verify**: Check Settings → Timezone dropdown shows correct timezone

### Issue 5: "Token refresh failed: 400"
**Cause**: Refresh token invalid or expired  
**Fix**: Disconnect and reconnect Google Calendar  
**Prevention**: Use calendar regularly (tokens refresh automatically when used)

---

## 🎯 Quick Test Checklist

✅ **Step 1**: Disconnect Google Calendar  
✅ **Step 2**: Reconnect Google Calendar  
✅ **Step 3**: Check console for "Found X upcoming events" (X > 0)  
✅ **Step 4**: Create test event 5 minutes from now  
✅ **Step 5**: Wait 2 minutes for system to find event  
✅ **Step 6**: Check console for "Created reminder for event"  
✅ **Step 7**: Wait until reminder time  
✅ **Step 8**: Verify notification appears and bot speaks  

---

## 📊 Expected Behavior

**Scenario**: Create event at 7:40 PM at 7:10 PM

| Time | System Action |
|------|---------------|
| 7:10 PM | User creates event in Google Calendar |
| 7:10-7:12 PM | System checks Google Calendar (every 2 min) |
| 7:12 PM | Finds event at 7:40 PM, creates reminder for 7:25 PM |
| 7:25 PM | **🔔 Reminder triggers!** Bot speaks, notification shows |
| 7:40 PM | Event starts |

**Current Issue**: System can't find events because tokens expired → No reminders created

**After Reconnecting**: System will find events → Create reminders → Trigger at correct time ✅

---

## 🆘 Still Not Working?

### Enable Verbose Logging

Add this to your console to see all reminder checks:
```javascript
// In browser console:
localStorage.setItem('DEBUG_CALENDAR_REMINDERS', 'true')
```

Then refresh the page and watch console logs.

### Check Reminder Preferences

Run in **Supabase SQL Editor**:
```sql
-- Check your reminder settings
SELECT *
FROM calendar_reminder_preferences
WHERE user_id = '5ddad2a7-32d6-4567-8f84-38c4605a58fd';
```

Should show:
- `reminders_enabled: true`
- `default_reminder_minutes: 15`
- `remind_for_all_day_events: true/false`

If no row exists, create default settings:
```sql
INSERT INTO calendar_reminder_preferences (
  user_id,
  reminders_enabled,
  default_reminder_minutes,
  all_day_event_reminder_time,
  remind_for_all_day_events
) VALUES (
  '5ddad2a7-32d6-4567-8f84-38c4605a58fd',
  true,
  15,
  '09:00',
  true
);
```

---

## 🎉 Success Indicators

You'll know it's working when you see:

1. ✅ Console: "Found X upcoming events" (X > 0 if you have events)
2. ✅ Console: "Created reminder for event: <Name> at <Time>"
3. ✅ Database has rows in `calendar_event_reminders` table
4. ✅ At reminder time: Notification appears + Bot speaks
5. ✅ Chat shows reminder message

---

**Remember**: The main issue is your expired Google OAuth tokens. Reconnecting Google Calendar will generate fresh tokens and fix everything! 🚀

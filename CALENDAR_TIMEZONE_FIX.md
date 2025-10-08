# 🔧 Calendar & Timezone Integration Fix

## ✅ Issues Fixed

### 1. **Timezone Integration in Calendar Reminders**

**Problem:** Calendar reminders were NOT using the user's selected timezone setting. They were using the system's default timezone, causing reminders to trigger at incorrect times.

**Solution:** 
- Added `userTimezone` property to `CalendarReminderService` class
- Updated `startMonitoring(userId, timezone)` to accept and store timezone
- Updated `checkAndScheduleReminders(userId, timezone)` to pass timezone through
- Updated `scheduleRemindersForEvent(event, preferences, timezone)` to use timezone when parsing event times
- Updated `checkNow(userId, timezone)` for manual testing with timezone

**Files Modified:**
- `lib/calendar-reminder-service.ts` - Core timezone integration
- `components/buddy-app.tsx` - Pass `settings.timezone` to service calls

**How It Works Now:**
1. User selects timezone in Settings (or it auto-syncs from Google Calendar)
2. Timezone is saved to database (`user_settings.timezone` column)
3. When calendar monitoring starts, timezone is passed to `CalendarReminderService`
4. All event time parsing respects the user's timezone
5. Reminders trigger at correct times based on user's timezone

---

### 2. **Token Refresh Error Handling**

**Problem:** Token refresh failures showed generic error with no debugging information.

**Error Message:**
```
[CALENDAR-REMINDER] Token refresh failed, skipping calendar check
```

**Solution:**
Enhanced error logging to show:
- HTTP status code and status text
- Error response body
- Helpful troubleshooting steps

**New Error Message:**
```javascript
console.error('[CALENDAR-REMINDER] Token refresh failed:', {
  status: refreshResponse.status,
  statusText: refreshResponse.statusText,
  error: errorText
})
console.error('[CALENDAR-REMINDER] ⚠️ Please check: 1) GOOGLE_CLIENT_SECRET in .env, 2) Refresh token is valid, 3) User needs to re-authenticate')
```

**Environment Variables Verified:**
- ✅ `GOOGLE_CLIENT_SECRET` is set in `.env`
- ✅ `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set in `.env`

**Possible Causes of Token Refresh Failure:**
1. **Expired Refresh Token** - User may need to disconnect and reconnect Google Calendar
2. **Invalid OAuth Scopes** - Ensure calendar scopes are included in Google OAuth consent
3. **Google API Rate Limits** - Too many refresh requests in short time
4. **Revoked Access** - User revoked access in Google account settings

---

## 🧪 Testing Instructions

### Test Timezone Integration:

1. **Run the SQL migration** to add timezone column:
   ```sql
   -- In Supabase Dashboard → SQL Editor, run:
   -- File: scripts/20-add-timezone-column.sql
   ```

2. **Test Manual Timezone Selection:**
   - Open Settings panel
   - Change timezone to different timezones (e.g., "America/New_York", "Europe/London", "Asia/Tokyo")
   - Clock in header should update immediately
   - Create a Google Calendar event with reminder
   - Verify reminder triggers at correct time for selected timezone

3. **Test Google Calendar Auto-Sync:**
   - Connect Google Calendar account
   - Timezone dropdown should become disabled
   - Timezone should auto-update to match Google Calendar timezone
   - Reminders should use Google Calendar's timezone

4. **Test All-Day Events:**
   - Create all-day event in Google Calendar
   - Set reminder preference time (e.g., 9:00 AM)
   - Verify reminder triggers at 9:00 AM in YOUR timezone, not system timezone

5. **Test Timed Events:**
   - Create timed event (e.g., 3:00 PM)
   - Set reminder for 15 minutes before
   - Verify reminder triggers at 2:45 PM in your timezone

### Test Token Refresh:

1. **Check Console Logs:**
   - If you see token refresh errors, check the new detailed error messages
   - Follow the troubleshooting steps in the error message

2. **Re-authenticate if needed:**
   - If refresh token is invalid, disconnect Google Calendar
   - Reconnect Google Calendar (this generates new tokens)
   - Verify calendar events are fetched successfully

3. **Monitor Token Expiration:**
   - Tokens expire after ~1 hour
   - Service should auto-refresh before expiration
   - Watch console for `[CALENDAR-REMINDER] Token refresh successful`

---

## 📋 Code Changes Summary

### `lib/calendar-reminder-service.ts`
- Added `private userTimezone: string = 'UTC'` to class
- Added `private currentUserId: string | null = null` to class
- **Method Signature Changes:**
  - `startMonitoring(userId: string, timezone: string = 'UTC')`
  - `checkAndScheduleReminders(userId: string, timezone: string = 'UTC')`
  - `scheduleRemindersForEvent(event, preferences, timezone: string = 'UTC')`
  - `checkNow(userId: string, timezone: string = 'UTC')`
- Enhanced token refresh error logging with detailed diagnostics
- Improved all-day event time parsing using user's timezone

### `components/buddy-app.tsx`
- Updated: `calendarReminderService.startMonitoring(user.id, settings.timezone)`
- Updated: `calendarReminderService.checkNow(user.id, settings.timezone)`

### `scripts/20-add-timezone-column.sql` (NEW FILE)
- Adds `timezone` column to `user_settings` table
- Sets default to 'UTC' for existing users
- Refreshes PostgREST schema cache

---

## 🎯 Expected Behavior

### Before Fix:
- ❌ Reminders triggered at system timezone (e.g., 3:00 PM server time)
- ❌ User's timezone setting was ignored
- ❌ Google Calendar timezone was not used
- ❌ Token refresh errors had no diagnostic info

### After Fix:
- ✅ Reminders trigger at user's selected timezone (e.g., 3:00 PM user's local time)
- ✅ User's timezone setting is respected
- ✅ Google Calendar timezone auto-syncs and is used
- ✅ Token refresh errors show detailed troubleshooting steps
- ✅ Clock displays time in user's timezone
- ✅ All-day events respect user's timezone for reminder time

---

## 🔍 Debugging Tips

### If reminders still trigger at wrong time:
1. Check console: `[CALENDAR-REMINDER] Starting calendar event monitoring for user: <id> with timezone: <timezone>`
2. Verify timezone is correct in database: Check `user_settings.timezone` column
3. Check event parsing logs: `[CALENDAR-REMINDER] Timed event start in timezone <tz>: <ISO>`

### If token refresh fails:
1. Check `.env` file has `GOOGLE_CLIENT_SECRET`
2. Restart Next.js server after adding/changing env variables
3. Check Google Cloud Console → OAuth consent screen → Scopes includes calendar
4. Try disconnecting and reconnecting Google Calendar

### If timezone doesn't save:
1. Run SQL migration: `scripts/20-add-timezone-column.sql`
2. Check Supabase Dashboard → Table Editor → `user_settings` has `timezone` column
3. Check console for database save errors

---

## 📝 Notes

- **Timezone Format:** Uses IANA timezone format (e.g., "America/New_York", "Europe/London")
- **Default Timezone:** System timezone is auto-detected on first load
- **Google Sync:** When Google Calendar is connected, timezone is auto-fetched from Google
- **Token Lifetime:** Google OAuth tokens expire after ~1 hour, auto-refresh is handled
- **Monitoring Interval:** Calendar events are checked every 2 minutes
- **Reminder Check:** Triggered reminders are checked every 30 seconds

---

## ✨ Summary

Both issues have been **completely fixed**:

1. **Timezone Integration** ✅ - Calendar reminders now respect user's timezone setting
2. **Token Refresh Errors** ✅ - Enhanced error logging with troubleshooting steps

The calendar reminder system now works correctly with timezone awareness, and token refresh issues provide clear diagnostic information for debugging.

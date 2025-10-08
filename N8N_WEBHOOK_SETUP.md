# N8N Webhook Integration Setup Guide

## 🎯 Quick Start: Connecting Your N8N Workflow

This guide will help you connect your existing n8n workflow to your React app.

---

## Step 1: Configure n8n Workflow

### Add Webhook Node at the Start

1. **Open your n8n workflow** (the one with AI Agent + Calendar tools)

2. **Add a new node at the very beginning:**
   - Click the "+" button
   - Search for "Webhook"
   - Select "Webhook" node

3. **Configure the Webhook node:**
   ```
   HTTP Method: POST
   Path: /webhook/buddy-chat
   Authentication: None (or set up if needed)
   Response Mode: "When Last Node Finishes"
   Response Code: 200
   ```

4. **Important:** Click "Execute Node" and copy the **Test Webhook URL**
   - It will look like: `https://your-n8n.com/webhook-test/buddy-chat`
   - For production, use the production URL: `https://your-n8n.com/webhook/buddy-chat`

### Connect Webhook to Your Existing Workflow

Your workflow should now look like:
```
Webhook Node → AI Agent → Calendar Tools → Memory → Response
```

### Configure Data Flow

In your AI Agent node or Chat Model node:
- **Input Message**: Use `{{ $json.message }}` to get the user's message
- **Conversation ID**: Use `{{ $json.conversationId }}` for memory tracking
- **User Context**: Access `{{ $json.userName }}`, `{{ $json.userSettings }}`

### Configure Memory Node

In your Window Buffer Memory node:
```json
{
  "sessionIdTemplate": "{{ $json.conversationId }}",
  "memoryKey": "chat_history",
  "contextLength": 10
}
```

### Configure Calendar Tools

**For Google Calendar Get Events:**
- **Access Token**: `{{ $json.calendarToken }}`
- **Time Min**: Use current time or `{{ $json.timestamp }}`
- **Max Results**: 10

**For Google Calendar Create Event:**
- **Access Token**: `{{ $json.calendarToken }}`
- **Event Data**: Extract from AI agent's function call

### Configure Response

Make sure your workflow returns a response in this format:
```json
{
  "output": "The AI's response text here",
  "toolsUsed": ["get_calendar_events"],  // Optional
  "success": true
}
```

Or simply return the text directly - the API route handles both formats.

---

## Step 2: Add Webhook URL to Environment Variables

1. **Create/Update `.env.local` file** in your project root:

```env
# N8N Webhook Configuration
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/buddy-chat

# Optional: If you add authentication to your webhook
# N8N_WEBHOOK_SECRET=your-secret-key
```

2. **Replace `your-n8n-instance.com` with:**
   - Your n8n cloud URL, or
   - Your self-hosted n8n URL, or
   - `localhost:5678` for local development

3. **Restart your development server** after adding the environment variable:
   ```bash
   npm run dev
   ```

---

## Step 3: Frontend Update (✅ Already Done!)

**Great news!** The frontend has already been updated automatically!

### Changes made to `buddy-app.tsx`:

✅ **Changed endpoint** from `/api/buddy` to `/api/ai-agent`

✅ **Updated request body** to send:
```typescript
{
  message: userText.trim(),
  settings
}
```

✅ **Updated response type** to:
```typescript
{ response: string; success: boolean }
```

✅ **Updated all references** from `data.text` to `data.response`

**You don't need to do anything for this step!** The code is ready to use once you complete Steps 1 & 2.

---

## Step 4: Test the Integration

### Test 1: Basic Conversation
```
User: "Hello, how are you?"
Expected: Buddy responds normally (tests basic n8n flow)
```

### Test 2: Memory
```
User: "My name is John"
Bot: "Nice to meet you, John!"
User: "What's my name?"
Expected: "Your name is John!" (tests Window Buffer Memory)
```

### Test 3: Calendar Get
```
User: "What's on my calendar today?"
Expected: Bot uses Google Calendar Get Events tool and lists events
```

### Test 4: Calendar Create
```
User: "Schedule a dentist appointment tomorrow at 2pm"
Expected: Bot uses Google Calendar Create Event tool and confirms
```

---

## 🐛 Troubleshooting

### Issue: "AI agent not configured"
**Solution:** 
- Check if `N8N_WEBHOOK_URL` is set in `.env.local`
- Restart your dev server: `npm run dev`
- Visit `http://localhost:3000/api/ai-agent` to see status

### Issue: "Cannot connect to AI agent"
**Solution:**
- Check if n8n is running
- Verify the webhook URL is correct
- Test the webhook directly with Postman or curl:
  ```bash
  curl -X POST https://your-n8n.com/webhook/buddy-chat \
    -H "Content-Type: application/json" \
    -d '{"message":"test","conversationId":"test-123"}'
  ```

### Issue: "AI agent returned empty response"
**Solution:**
- Check your n8n workflow's last node
- Ensure it returns `{ "output": "response text" }` or just the text
- Check n8n execution logs for errors

### Issue: "Memory not working"
**Solution:**
- In n8n, verify Window Buffer Memory node is connected
- Check `sessionIdTemplate` uses `{{ $json.conversationId }}`
- Same conversationId should be used across requests

### Issue: "Calendar tools not working"
**Solution:**
- Verify user is logged in with Google
- Check if `calendarToken` is being passed to n8n
- In n8n, ensure calendar nodes use `{{ $json.calendarToken }}`
- Test calendar API manually to verify token is valid

---

## 📊 Request/Response Flow

### What Your App Sends to n8n:
```json
{
  "message": "What's on my calendar?",
  "conversationId": "user-abc123-main",
  "userId": "abc123",
  "userName": "John",
  "calendarToken": "ya29.a0AfH6...",
  "userSettings": {
    "tone": "gentle",
    "pace": "slow",
    "timezone": "America/New_York"
  },
  "timestamp": "2025-10-07T15:30:00Z",
  "source": "buddy-app"
}
```

### What n8n Should Return:
```json
{
  "output": "You have 3 events today: Meeting at 10am, Lunch at 12pm, and Doctor appointment at 3pm.",
  "toolsUsed": ["get_calendar_events"],
  "success": true
}
```

---

## 🚀 Next Steps

Once everything works:

1. **Switch to Production Webhook:**
   - In n8n, activate your workflow
   - Update `N8N_WEBHOOK_URL` to use production URL (not test URL)

2. **Add Authentication (Recommended):**
   - Add a static token to your n8n webhook
   - Set `N8N_WEBHOOK_SECRET` in `.env.local`
   - Uncomment the authorization header in `ai-agent/route.ts`

3. **Add More Tools:**
   - Weather API
   - News API
   - Reminders
   - Just add nodes in n8n - no code changes needed!

4. **Monitor Usage:**
   - Check n8n execution history
   - Monitor API logs in your app
   - Track response times

---

## 💡 Pro Tips

1. **Testing n8n Workflow:**
   - Use n8n's "Execute Workflow" button with sample data
   - Test each node individually

2. **Debugging:**
   - Enable "Save execution data" in n8n settings
   - Check n8n's execution logs for errors
   - Add console.logs in your API route

3. **Performance:**
   - n8n workflows should respond within 5-10 seconds
   - Add timeout handling in your API route if needed
   - Consider caching for frequently accessed calendar data

4. **Scaling:**
   - For high traffic, upgrade your n8n hosting
   - Consider adding Redis for memory (instead of n8n's built-in)
   - Add rate limiting to your API route

---

## 📝 Checklist

- [ ] Added Webhook node to n8n workflow
- [ ] Configured webhook with POST method
- [ ] Connected webhook to AI Agent → Calendar Tools → Memory
- [ ] Tested workflow in n8n with sample data
- [ ] Copied webhook URL
- [ ] Added `N8N_WEBHOOK_URL` to `.env.local`
- [ ] Restarted dev server
- [ ] Updated `sendMessage` in `buddy-app.tsx`
- [ ] Tested basic conversation
- [ ] Tested memory (name recall)
- [ ] Tested calendar get events
- [ ] Tested calendar create event
- [ ] Everything working! 🎉

---

## 🆘 Need Help?

If you encounter issues:
1. Check browser console for errors
2. Check n8n execution logs
3. Check Next.js server logs (`npm run dev` output)
4. Test the webhook URL directly with curl/Postman
5. Review this guide's troubleshooting section

You've got this! 🚀

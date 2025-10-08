# 📅 How to Configure Google Calendar Tools in N8N

## 🎯 The Goal

Your app needs to use **YOUR** Google Calendar access token to create/read events on **YOUR** calendar.

---

## 🔑 What is `{{ $json.calendarToken }}`?

This is n8n's way of saying: **"Use the calendar token that came from the webhook"**

When your app sends a message to n8n, it includes:
```json
{
  "message": "Schedule meeting tomorrow at 3pm",
  "calendarToken": "ya29.a0AfH6SMHvY...",  ← YOUR actual Google token
  "conversationId": "user-123"
}
```

The `{{ $json.calendarToken }}` pulls that token value and uses it in the calendar tool.

---

## 📋 Step-by-Step Configuration

### **For Google Calendar CREATE Event:**

1. **Open your n8n workflow**

2. **Find or add "Google Calendar" node**
   - Click the "+" button
   - Search "Google Calendar"
   - Select "Google Calendar"
   - Choose operation: "Create Event"

3. **Configure Authentication:**
   
   **Option A: If you see "OAuth2 API" or "Generic Credential Type":**
   ```
   Authentication: OAuth2 API
   OR
   Credential Type: Generic Credential Type
   ```
   Then look for field called:
   - "Access Token" or
   - "OAuth Access Token" or
   - "Token"
   
   **In that field, enter EXACTLY:**
   ```
   {{ $json.calendarToken }}
   ```

   **Option B: If you only see "Google Calendar OAuth2 API":**
   - Select "Define Below" or "From Previous Node"
   - Then you'll see an "Access Token" field
   - Enter: `{{ $json.calendarToken }}`

4. **Configure Event Details:**
   ```
   Calendar: primary (or {{ $json.calendar || "primary" }})
   
   Event Details (these come from AI Agent):
   - Summary: Let AI Agent fill this
   - Start Time: Let AI Agent fill this  
   - End Time: Let AI Agent fill this
   - Description: (optional)
   ```

---

### **For Google Calendar GET Events:**

1. **Find or add "Google Calendar" node**
   - Operation: "Get All Events" or "Get Many"

2. **Configure Authentication (same as above):**
   ```
   Access Token: {{ $json.calendarToken }}
   ```

3. **Configure Query:**
   ```
   Calendar: primary
   Time Min: {{ $json.timestamp }} (or leave default "now")
   Time Max: (optional - end of day/week)
   Max Results: 10
   ```

---

## 🖼️ Visual Example

```
┌─────────────────────────────────────┐
│  Google Calendar Create Event Node  │
├─────────────────────────────────────┤
│                                     │
│  Authentication:                    │
│  ┌───────────────────────────────┐ │
│  │ OAuth2 API                    │ │
│  └───────────────────────────────┘ │
│                                     │
│  Access Token: *                    │
│  ┌───────────────────────────────┐ │
│  │ {{ $json.calendarToken }}     │ │ ← ENTER THIS!
│  └───────────────────────────────┘ │
│                                     │
│  Calendar: primary                  │
│                                     │
│  Event Details:                     │
│  - Summary: (from AI)               │
│  - Start: (from AI)                 │
│  - End: (from AI)                   │
│                                     │
└─────────────────────────────────────┘
```

---

## 🔄 Complete Workflow Setup

Your n8n workflow should look like this:

```
1. Webhook (POST /webhook/buddy-chat)
   ↓ Receives: { message, calendarToken, conversationId, ... }
   ↓
2. AI Agent (with Chat Model)
   ↓ Input: {{ $json.message }}
   ↓ Conversation ID: {{ $json.conversationId }}
   ↓ Decides: "User wants to create calendar event"
   ↓
3. Google Calendar Create Event
   ↓ Access Token: {{ $json.calendarToken }}
   ↓ Creates event using AI's extracted details
   ↓
4. Window Buffer Memory
   ↓ Session ID: {{ $json.conversationId }}
   ↓ Saves conversation history
   ↓
5. Return Response
   ↓ { "output": "I've scheduled your meeting for tomorrow at 3pm" }
```

---

## ✅ Verification Steps

### **Test in N8N:**

1. **Click "Execute Workflow" button**

2. **In the webhook node, click "Listen for Test Event"**

3. **Use this test data:**
   ```json
   {
     "message": "What's on my calendar today?",
     "calendarToken": "ya29.test-token-here",
     "conversationId": "test-123",
     "userId": "test-user",
     "userName": "Test",
     "timestamp": "2025-10-07T15:00:00Z"
   }
   ```

4. **Check if workflow executes without errors**

5. **Verify the calendar node shows it's using the token**

---

## 🐛 Troubleshooting

### **Issue: "No authentication method selected"**
**Solution:** 
- Make sure you selected "OAuth2 API" or similar
- Then the "Access Token" field should appear
- Enter `{{ $json.calendarToken }}`

### **Issue: "Invalid token" or "Unauthorized"**
**Solution:**
- The token is being passed correctly
- But your actual Google Calendar connection might be expired
- Make sure you're logged into Buddy with Google
- The app will automatically get a fresh token

### **Issue: "Can't find Access Token field"**
**Solution:**
- Different n8n versions show this differently
- Look for: "Access Token", "OAuth Token", or "Bearer Token"
- Or choose "Define Below" / "From Previous Node" first
- The field should then appear

### **Issue: Calendar node shows red error**
**Solution:**
- Don't test calendar node in isolation
- It needs the token from webhook
- Always test the full workflow with "Execute Workflow"

---

## 🎯 Quick Checklist

In your n8n workflow:

- [ ] ✅ Webhook node added (POST, /webhook/buddy-chat)
- [ ] ✅ Webhook response mode: "When Last Node Finishes"
- [ ] AI Agent node: Input = `{{ $json.message }}`
- [ ] AI Agent node: Has Google Calendar tools connected
- [ ] Memory node: Session ID = `{{ $json.conversationId }}`
- [ ] **Google Calendar GET node: Access Token = `{{ $json.calendarToken }}`**
- [ ] **Google Calendar CREATE node: Access Token = `{{ $json.calendarToken }}`**
- [ ] Workflow returns response at the end

---

## 💡 Pro Tip

**You can check if the token is being received:**

1. Add a "Set" node right after the Webhook
2. Set a variable: `tokenReceived = {{ $json.calendarToken }}`
3. Execute workflow
4. Check if the variable shows the token (it will be a long string like `ya29.a0AfH6...`)

If you see the token, it's working! ✅

---

## 🚀 Next Steps

Once you've configured the calendar tools:

1. **Save your n8n workflow**
2. **Activate the workflow** (toggle switch at top)
3. **Copy the production webhook URL** (not test URL)
4. **Update `.env.local`** with the webhook URL
5. **Restart your dev server:** `npm run dev`
6. **Test:** "Schedule me a meeting tomorrow at 3pm"

---

## 📸 Screenshot Guide (What to Look For)

When you open the Google Calendar node in n8n, you should see:

```
Authentication Section:
- A dropdown or selection for authentication type
- When selected, an "Access Token" or similar field appears
- That's where you put: {{ $json.calendarToken }}

Parameters Section:
- Calendar ID: primary
- Event details (for create)
- Time range (for get)
```

**The key is:** The Access Token field must have `{{ $json.calendarToken }}` so it uses the token from your app!

---

Need help? Just ask! 🎯

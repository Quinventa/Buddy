# Frontend Update Instructions

## Update buddy-app.tsx to use AI Agent endpoint

### Location: Line ~1237 in `components/buddy-app.tsx`

### Find this code block:

```typescript
const res = await fetch("/api/buddy", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    settings,
    messages: [...messages, newUserMsg].slice(-12),
  }),
})
```

### Replace with:

```typescript
const res = await fetch("/api/ai-agent", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: userText.trim(),
    settings
  }),
})
```

---

### Then find this line (a few lines below):

```typescript
const data = (await res.json()) as { text: string }
```

### Replace with:

```typescript
const data = (await res.json()) as { response: string; success: boolean }
```

---

### Then find these two lines:

```typescript
const originalResponse = data.text
const displayResponse = processMessageContent(data.text)
```

### Replace with:

```typescript
const originalResponse = data.response
const displayResponse = processMessageContent(data.response)
```

---

## That's it! Save the file.

The changes are:
1. ✅ Changed endpoint from `/api/buddy` to `/api/ai-agent`
2. ✅ Changed request body to send `message` and `settings` instead of full message history
3. ✅ Changed response type from `{ text: string }` to `{ response: string; success: boolean }`
4. ✅ Updated references from `data.text` to `data.response`

This connects your frontend to the n8n workflow through the AI agent API route.

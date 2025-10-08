# N8N Workflow Integration Guide

## 🎯 Executive Summary

Your n8n workflow has these components:
1. **Chat Message Trigger** → When user sends message
2. **AI Agent** → Calendar AI agent with chat model
3. **Memory** → Window buffer memory (conversation history)
4. **Tools** → Google Calendar Get Events + Google Calendar Create Events

This guide shows **3 integration approaches** from simplest to most robust.

---

## 📊 Current Architecture Analysis

### Your Existing System:
```
Frontend (React)
    ↓
/api/buddy (Next.js API Route)
    ↓
OpenAI/XAI Chat Completion
    ↓
Response back to Frontend
```

### Your Current Calendar Integration:
- ✅ Google OAuth via Supabase
- ✅ Access tokens stored in `user_connected_accounts` table
- ✅ Calendar utils with `getCalendarStatus()`, `createCalendarEvent()`
- ✅ Frontend components: `google-calendar.tsx`
- ⚠️ No conversation memory persistence
- ⚠️ Calendar operations not AI-integrated

---

## 🚀 Integration Approach Options

### **Option 1: Simple Webhook Bridge** ⭐ EASIEST
**Best for**: Quick integration, minimal code changes

Keep n8n running, expose it as webhook, call from your app.

#### Pros:
- ✅ No major code changes
- ✅ Keep n8n workflow visual editor
- ✅ Easy to modify workflow
- ✅ n8n handles memory and tools

#### Cons:
- ❌ Requires n8n running 24/7
- ❌ Another service to maintain
- ❌ Network latency

---

### **Option 2: Migrate to Supabase Edge Functions** ⭐⭐ RECOMMENDED
**Best for**: Production-ready, serverless, fully integrated

Move AI agent logic to Supabase Edge Functions with Deno.

#### Pros:
- ✅ No external services needed
- ✅ Serverless (auto-scales)
- ✅ Works with existing Supabase DB
- ✅ Can use Deno AI libraries
- ✅ Conversation history in database

#### Cons:
- ❌ Requires rewriting n8n logic
- ❌ More initial development time

---

### **Option 3: Hybrid - Backend AI Service** ⭐⭐⭐ MOST ROBUST
**Best for**: Complex AI workflows, scalability

Create dedicated Node.js backend with LangChain.

#### Pros:
- ✅ Full LangChain ecosystem
- ✅ Advanced AI agent capabilities
- ✅ Better error handling
- ✅ Can add more tools easily
- ✅ Production-ready architecture

#### Cons:
- ❌ Most development work
- ❌ Requires separate backend service
- ❌ More infrastructure complexity

---

## 📝 Detailed Implementation Plans

---

## 🎯 OPTION 1: Simple Webhook Bridge

### Step 1: Expose n8n Workflow as Webhook

1. In n8n, add **Webhook** node at the start
2. Configure webhook:
   ```
   Method: POST
   Path: /webhook/buddy-chat
   Response Mode: Wait for webhook response
   ```

3. Your workflow becomes:
   ```
   Webhook → AI Agent → Calendar Tools → Memory → Response
   ```

### Step 2: Create API Route to Call n8n

```typescript
// app/api/ai-agent/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { message, conversationId, userId, calendarToken } = await req.json()

    // Call your n8n webhook
    const n8nResponse = await fetch(process.env.N8N_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversationId, // For memory
        userId,
        calendarToken, // For calendar tools
        timestamp: new Date().toISOString()
      })
    })

    const data = await n8nResponse.json()
    
    return NextResponse.json({
      response: data.output,
      success: true
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'AI agent failed' },
      { status: 500 }
    )
  }
}
```

### Step 3: Update Frontend to Use New Endpoint

```typescript
// In buddy-app.tsx, modify sendMessage()
async function sendMessage(userText: string) {
  // ... existing code ...

  try {
    const res = await fetch("/api/ai-agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userText.trim(),
        conversationId: `user-${userId}`, // Generate conversation ID
        userId: user.id,
        calendarToken: calendarStatus.accessToken
      }),
    })

    const data = await res.json()
    
    const newMessage: BuddyMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: data.response,
      createdAt: Date.now(),
    }
    
    setMessages(prev => [...prev, newMessage])
    await speak(data.response)
  } catch {
    // fallback handling...
  }
}
```

### Step 4: Configure n8n Memory

In your n8n workflow's **Window Buffer Memory** node:
```json
{
  "sessionIdTemplate": "{{ $json.conversationId }}",
  "memoryKey": "chat_history",
  "contextLength": 10
}
```

### Step 5: Environment Variables

```env
# .env.local
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/buddy-chat
```

---

## 🎯 OPTION 2: Supabase Edge Functions (RECOMMENDED)

This approach recreates your n8n workflow logic natively in your app.

### Step 1: Create Database Table for Conversation Memory

```sql
-- scripts/21-create-conversation-memory.sql
CREATE TABLE IF NOT EXISTS conversation_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for fast retrieval
CREATE INDEX idx_conversation_memory_user_conversation 
  ON conversation_memory(user_id, conversation_id, created_at DESC);

-- RLS Policies
ALTER TABLE conversation_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversation memory"
  ON conversation_memory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversation memory"
  ON conversation_memory FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

Run this in Supabase SQL Editor.

### Step 2: Create Helper Functions for Memory

```typescript
// lib/conversation-memory.ts
import { createClient } from '@/lib/supabase'

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: string
}

export async function getConversationHistory(
  userId: string,
  conversationId: string,
  limit: number = 10
): Promise<ConversationMessage[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('conversation_memory')
    .select('role, content, created_at')
    .eq('user_id', userId)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Error fetching conversation history:', error)
    return []
  }
  
  // Return in chronological order (oldest first)
  return data.reverse().map(msg => ({
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
    timestamp: msg.created_at
  }))
}

export async function saveToConversationMemory(
  userId: string,
  conversationId: string,
  message: ConversationMessage
): Promise<boolean> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('conversation_memory')
    .insert({
      user_id: userId,
      conversation_id: conversationId,
      role: message.role,
      content: message.content
    })
  
  if (error) {
    console.error('Error saving to conversation memory:', error)
    return false
  }
  
  return true
}

export async function clearConversationMemory(
  userId: string,
  conversationId: string
): Promise<boolean> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('conversation_memory')
    .delete()
    .eq('user_id', userId)
    .eq('conversation_id', conversationId)
  
  return !error
}
```

### Step 3: Create Calendar AI Tools

```typescript
// lib/ai-tools/calendar-tools.ts
import { getCalendarStatus } from '@/lib/calendar-utils'

export interface AITool {
  name: string
  description: string
  parameters: any
  execute: (params: any) => Promise<any>
}

export async function getCalendarEventsTool(accessToken: string): Promise<AITool> {
  return {
    name: 'get_calendar_events',
    description: 'Get upcoming events from user\'s Google Calendar. Use this when user asks about their schedule, upcoming events, or "what do I have planned".',
    parameters: {
      type: 'object',
      properties: {
        timeMin: {
          type: 'string',
          description: 'Start time in ISO format (default: now)'
        },
        timeMax: {
          type: 'string',
          description: 'End time in ISO format (default: 7 days from now)'
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of events to return (default: 10)'
        }
      }
    },
    execute: async (params) => {
      const timeMin = params.timeMin || new Date().toISOString()
      const timeMax = params.timeMax || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      const maxResults = params.maxResults || 10

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        `timeMin=${encodeURIComponent(timeMin)}&` +
        `timeMax=${encodeURIComponent(timeMax)}&` +
        `maxResults=${maxResults}&` +
        `singleEvents=true&orderBy=startTime`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch calendar events')
      }

      const data = await response.json()
      
      // Format events for AI
      const events = data.items?.map((event: any) => ({
        title: event.summary,
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        location: event.location,
        description: event.description
      })) || []

      return {
        success: true,
        events,
        count: events.length
      }
    }
  }
}

export async function createCalendarEventTool(accessToken: string): Promise<AITool> {
  return {
    name: 'create_calendar_event',
    description: 'Create a new event in user\'s Google Calendar. Use when user wants to schedule something or add an event.',
    parameters: {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          description: 'Event title/summary'
        },
        description: {
          type: 'string',
          description: 'Event description (optional)'
        },
        startDateTime: {
          type: 'string',
          description: 'Start date-time in ISO format'
        },
        endDateTime: {
          type: 'string',
          description: 'End date-time in ISO format'
        },
        location: {
          type: 'string',
          description: 'Event location (optional)'
        }
      },
      required: ['summary', 'startDateTime', 'endDateTime']
    },
    execute: async (params) => {
      const event = {
        summary: params.summary,
        description: params.description,
        location: params.location,
        start: {
          dateTime: params.startDateTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: params.endDateTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      }

      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event)
        }
      )

      if (!response.ok) {
        throw new Error('Failed to create calendar event')
      }

      const data = await response.json()

      return {
        success: true,
        eventId: data.id,
        htmlLink: data.htmlLink,
        created: data.created
      }
    }
  }
}

export async function getAllCalendarTools(accessToken: string): Promise<AITool[]> {
  return [
    await getCalendarEventsTool(accessToken),
    await createCalendarEventTool(accessToken)
  ]
}
```

### Step 4: Create AI Agent API Route

```typescript
// app/api/ai-agent/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getConversationHistory, saveToConversationMemory } from '@/lib/conversation-memory'
import { getAllCalendarTools } from '@/lib/ai-tools/calendar-tools'
import { buildSystemPrompt } from '@/lib/buddy-prompt'

export async function POST(req: NextRequest) {
  try {
    const { message, settings } = await req.json()
    
    // Get current user
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Generate conversation ID (or get from request)
    const conversationId = `user-${user.id}-main`

    // Get conversation history (last 10 messages)
    const history = await getConversationHistory(user.id, conversationId, 10)

    // Save user message to memory
    await saveToConversationMemory(user.id, conversationId, {
      role: 'user',
      content: message
    })

    // Get calendar access token
    const { data: session } = await supabase.auth.getSession()
    const calendarToken = session?.session?.provider_token

    // Get available tools
    const tools = calendarToken 
      ? await getAllCalendarTools(calendarToken)
      : []

    // Build messages for AI
    const systemPrompt = buildSystemPrompt(settings)
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ]

    // Call OpenAI with function calling
    const apiKey = process.env.OPENAI_API_KEY || process.env.XAI_API_KEY
    if (!apiKey) {
      throw new Error('No API key configured')
    }

    const isOpenAI = !!process.env.OPENAI_API_KEY
    const apiUrl = isOpenAI
      ? 'https://api.openai.com/v1/chat/completions'
      : 'https://api.x.ai/v1/chat/completions'

    // First AI call with tools
    let response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: isOpenAI ? 'gpt-4o-mini' : 'grok-beta',
        messages,
        tools: tools.length > 0 ? tools.map(tool => ({
          type: 'function',
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
          }
        })) : undefined,
        tool_choice: tools.length > 0 ? 'auto' : undefined,
        temperature: 0.8
      })
    })

    if (!response.ok) {
      throw new Error('AI API call failed')
    }

    let data = await response.json()
    let assistantMessage = data.choices[0].message

    // Handle tool calls
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolResults = []

      for (const toolCall of assistantMessage.tool_calls) {
        const tool = tools.find(t => t.name === toolCall.function.name)
        
        if (tool) {
          try {
            const params = JSON.parse(toolCall.function.arguments)
            const result = await tool.execute(params)
            
            toolResults.push({
              tool_call_id: toolCall.id,
              role: 'tool',
              name: toolCall.function.name,
              content: JSON.stringify(result)
            })
          } catch (toolError) {
            console.error(`Tool execution error for ${toolCall.function.name}:`, toolError)
            toolResults.push({
              tool_call_id: toolCall.id,
              role: 'tool',
              name: toolCall.function.name,
              content: JSON.stringify({ error: 'Tool execution failed' })
            })
          }
        }
      }

      // Second AI call with tool results
      const followUpMessages = [
        ...messages,
        assistantMessage,
        ...toolResults
      ]

      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: isOpenAI ? 'gpt-4o-mini' : 'grok-beta',
          messages: followUpMessages,
          temperature: 0.8
        })
      })

      if (!response.ok) {
        throw new Error('AI follow-up call failed')
      }

      data = await response.json()
      assistantMessage = data.choices[0].message
    }

    const finalResponse = assistantMessage.content

    // Save assistant response to memory
    await saveToConversationMemory(user.id, conversationId, {
      role: 'assistant',
      content: finalResponse
    })

    return NextResponse.json({
      response: finalResponse,
      success: true
    })

  } catch (error) {
    console.error('AI Agent error:', error)
    return NextResponse.json(
      { error: 'AI agent failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
```

### Step 5: Update Frontend to Use AI Agent

```typescript
// In buddy-app.tsx, replace the sendMessage function's API call

async function sendMessage(userText: string) {
  // ... existing validation code ...

  try {
    // NEW: Use AI agent endpoint instead of /api/buddy
    const res = await fetch("/api/ai-agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userText.trim(),
        settings
      }),
    })

    if (!res.ok) {
      throw new Error('AI request failed')
    }

    const data = await res.json()
    
    const newMessage: BuddyMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: data.response,
      createdAt: Date.now(),
    }
    
    setMessages(prev => [...prev, newMessage])
    
    // Note: No need to save to database here since AI agent already handles it
    // But you can still save to user_messages table for backwards compatibility
    await saveUserMessage(newMessage)
    
    await speak(data.response)
  } catch {
    // ... existing fallback code ...
  }
}
```

### Step 6: Test the Integration

1. **Test Memory**:
   ```
   User: "My name is John"
   Bot: "Nice to meet you, John!"
   User: "What's my name?"
   Bot: "Your name is John!"
   ```

2. **Test Calendar Get**:
   ```
   User: "What's on my calendar today?"
   Bot: [Uses get_calendar_events tool and returns events]
   ```

3. **Test Calendar Create**:
   ```
   User: "Schedule a meeting tomorrow at 2pm"
   Bot: [Uses create_calendar_event tool and confirms]
   ```

---

## 🎯 OPTION 3: Full LangChain Backend

For the most robust solution, create a separate backend service.

### Step 1: Create Separate Backend Project

```bash
mkdir buddy-ai-backend
cd buddy-ai-backend
npm init -y
npm install express langchain @langchain/openai @langchain/community dotenv cors
npm install --save-dev typescript @types/node @types/express ts-node
```

### Step 2: Create AI Agent Service

```typescript
// src/agent.ts
import { ChatOpenAI } from '@langchain/openai'
import { BufferMemory } from 'langchain/memory'
import { ConversationChain } from 'langchain/chains'
import { DynamicTool } from '@langchain/core/tools'

export class BuddyAIAgent {
  private model: ChatOpenAI
  private memory: BufferMemory
  private tools: DynamicTool[]

  constructor(apiKey: string, calendarToken: string) {
    this.model = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: 'gpt-4o-mini',
      temperature: 0.8
    })

    this.memory = new BufferMemory({
      memoryKey: 'chat_history',
      returnMessages: true
    })

    this.tools = this.initializeTools(calendarToken)
  }

  private initializeTools(calendarToken: string): DynamicTool[] {
    return [
      new DynamicTool({
        name: 'get_calendar_events',
        description: 'Get upcoming events from Google Calendar',
        func: async () => {
          // Implementation similar to Option 2
          return JSON.stringify({ events: [] })
        }
      }),
      new DynamicTool({
        name: 'create_calendar_event',
        description: 'Create a new calendar event',
        func: async (input: string) => {
          const params = JSON.parse(input)
          // Implementation similar to Option 2
          return JSON.stringify({ success: true })
        }
      })
    ]
  }

  async chat(message: string): Promise<string> {
    const chain = new ConversationChain({
      llm: this.model,
      memory: this.memory
    })

    const response = await chain.call({ input: message })
    return response.response
  }
}
```

---

## 🎨 Comparison Matrix

| Feature | Option 1: Webhook | Option 2: Edge Functions | Option 3: LangChain Backend |
|---------|------------------|-------------------------|---------------------------|
| **Complexity** | ⭐ Low | ⭐⭐ Medium | ⭐⭐⭐ High |
| **Development Time** | 2-4 hours | 1-2 days | 3-5 days |
| **Maintenance** | Medium | Low | Medium |
| **Scalability** | Low | High | High |
| **Cost** | n8n hosting | Supabase usage | Server hosting |
| **Memory Management** | n8n built-in | Supabase DB | Redis/DB |
| **Tool Integration** | n8n nodes | Custom code | LangChain tools |
| **Latency** | Higher | Lower | Medium |
| **Best For** | Quick POC | Production app | Enterprise |

---

## 🚀 Recommended Implementation Path

### For Your Current Project: **Go with Option 2**

**Why:**
1. ✅ You already have Supabase infrastructure
2. ✅ No external dependencies
3. ✅ Serverless = no server management
4. ✅ Conversation memory in database
5. ✅ Direct calendar API integration
6. ✅ Easy to extend with more tools

### Implementation Steps:
1. **Week 1**: Set up conversation memory table ✅
2. **Week 2**: Create calendar AI tools ✅
3. **Week 3**: Build AI agent API route ✅
4. **Week 4**: Integrate frontend + testing ✅
5. **Week 5**: Polish, error handling, edge cases ✅

---

## 📦 Quick Start Checklist

- [ ] Create `conversation_memory` table in Supabase
- [ ] Run SQL script from Step 1
- [ ] Create `lib/conversation-memory.ts`
- [ ] Create `lib/ai-tools/calendar-tools.ts`
- [ ] Create `app/api/ai-agent/route.ts`
- [ ] Update `buddy-app.tsx` sendMessage function
- [ ] Test with simple conversation
- [ ] Test calendar get events
- [ ] Test calendar create event
- [ ] Add error handling
- [ ] Deploy to production

---

## 🐛 Common Issues & Solutions

### Issue: "No conversation history"
**Solution**: Check if conversation_memory table has RLS policies enabled

### Issue: "Calendar tools not working"
**Solution**: Verify `provider_token` is available in session

### Issue: "AI not using tools"
**Solution**: Check tool descriptions are clear and specific

### Issue: "Memory not persisting"
**Solution**: Ensure `saveToConversationMemory` is called after each message

---

## 📚 Additional Resources

- [OpenAI Function Calling Docs](https://platform.openai.com/docs/guides/function-calling)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [LangChain Tools](https://js.langchain.com/docs/modules/agents/tools/)
- [Google Calendar API](https://developers.google.com/calendar/api/guides/overview)

---

## 🎓 Next Steps After Implementation

Once basic integration works:

1. **Add More Tools**:
   - Weather API tool
   - Reminder creation tool
   - News/information tool
   
2. **Enhanced Memory**:
   - Semantic search in history
   - Summary of old conversations
   - User preferences learning

3. **Advanced Features**:
   - Multi-turn conversations
   - Proactive suggestions
   - Context-aware responses

4. **Monitoring**:
   - Log tool usage
   - Track conversation quality
   - Monitor API costs

---

## 💡 Pro Tips

1. **Start Simple**: Get basic conversation working first, then add tools
2. **Test Each Layer**: Test memory, then tools, then integration
3. **Handle Errors Gracefully**: AI can fail, always have fallbacks
4. **Monitor Costs**: Track API usage, especially with tools
5. **User Feedback**: Add "Was this helpful?" to improve responses

---

## 🤝 Need Help?

If you get stuck:
1. Check console logs for errors
2. Verify database queries in Supabase
3. Test tools independently
4. Check API rate limits
5. Review this guide's troubleshooting section

Good luck with your integration! 🚀

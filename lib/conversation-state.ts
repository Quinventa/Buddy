// Conversation state management for multi-step interactions
import { createClient } from "@/lib/supabase"

export interface ConversationState {
  id?: string
  user_id: string
  state_type: 'calendar_request' | 'reminder_setup'
  state_data: any
  context?: string
  waiting_for?: string[]
  created_at?: string
  updated_at?: string
}

export async function saveConversationState(state: Omit<ConversationState, 'id' | 'created_at' | 'updated_at'>): Promise<ConversationState | null> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('conversation_states')
      .insert({
        ...state,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error saving conversation state:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error saving conversation state:', error)
    return null
  }
}

export async function getActiveConversationState(userId: string, stateType: string): Promise<ConversationState | null> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('conversation_states')
      .select('*')
      .eq('user_id', userId)
      .eq('state_type', stateType)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching conversation state:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error fetching conversation state:', error)
    return null
  }
}

export async function updateConversationState(id: string, updates: Partial<ConversationState>): Promise<ConversationState | null> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('conversation_states')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating conversation state:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error updating conversation state:', error)
    return null
  }
}

export async function clearConversationState(userId: string, stateType?: string): Promise<boolean> {
  try {
    const supabase = createClient()
    
    let query = supabase
      .from('conversation_states')
      .delete()
      .eq('user_id', userId)
    
    if (stateType) {
      query = query.eq('state_type', stateType)
    }
    
    const { error } = await query
    
    if (error) {
      console.error('Error clearing conversation state:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error clearing conversation state:', error)
    return false
  }
}

// Helper function to check if user has any pending conversation states
export async function hasPendingConversations(userId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('conversation_states')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
    
    if (error) {
      console.error('Error checking pending conversations:', error)
      return false
    }
    
    return data && data.length > 0
  } catch (error) {
    console.error('Error checking pending conversations:', error)
    return false
  }
}
